import {parse} from 'path';
import {ContactRepository} from '../api/repository/contact/contact.repository';
import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IContact} from '../database/interfaces/contact.interface';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Contact} from '../database/repomodels/contact.repomodel';
import {Creditor} from '../database/repomodels/creditor.repomodel';
import {Debtor} from '../database/repomodels/debtor.repomodel';
import {DataCopier} from './dataCopier.util';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {ICase} from '../database/interfaces/case.interface';
import {Payment} from '../database/repomodels/payment.repomodel';
import {IPayment} from '../database/interfaces/payment.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import DebtorService from '../api/services/debtor.service';
import CreditorService from '../api/services/creditor.service';
import {Case} from '../database/repomodels/case.repomodel';
import constantsUtil from './constants.util';
import paymentUtil from './payment.util';
import {Request} from 'express';
import mongoose from 'mongoose';
import {AnyARecord} from 'dns';

class CaseUtil {
  private contactRepository: ContactRepository;
  private debtRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private debtorService: DebtorService;
  private creditorService: CreditorService;

  constructor() {
    this.contactRepository = new ContactRepository();
    this.debtRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
  }
  async createContacts(data: IContact[]) {
    const validatedContacts: IContact[] = [];
    for (const contact of data) {
      const newContact = new Contact();
      const validatedContact = DataCopier.copy(newContact, contact);
      validatedContacts.push(validatedContact);
    }
    const contacts =
      await this.contactRepository.createMany<IContact>(validatedContacts);

    return contacts.map(contact => {
      return contact._id;
    });
  }

  async createDebtor(data: IDebtor) {
    const newDebtor = new Debtor();
    const validatedDebtor = DataCopier.copy(newDebtor, data);
    return await this.debtRepository.create<IDebtor>(validatedDebtor);
  }

  async createCreditor(data: ICreditor) {
    const newCreditor = new Creditor();
    const validatedCreditor = DataCopier.copy(newCreditor, data);
    return await this.creditorRepository.create<ICreditor>(validatedCreditor);
  }

  async uploadFileFormat(originalFile: string) {
    const parsesdPath = parse(originalFile);
    const fileName = parsesdPath.name;
    const extension = parsesdPath.ext.toLowerCase();
    return `${fileName}-${Date.now()}${extension}`;
  }

  async createPayment(data: ICase) {
    const payment = new Payment();
    const paymentsArray = [];
    let tempPayment = null;
    let commission = 0;
    for (const interval of data.intervals) {
      if (interval.frequency === 0) {
        payment.dueDate = interval.startDate;
        if (!data.commissionPaidAlready) {
          commission = await this.calculateCommision(
            interval,
            data.weeklyBudget
          );
        }
        tempPayment = await this.populatePayment(
          data._id,
          payment,
          interval,
          0,
          commission
        );
        paymentsArray.push(tempPayment);
      }
      if (interval.frequency != 0) {
        for (let i = 1; i <= interval.frequency; i++) {
          if (i === 1) {
            payment.dueDate = interval.startDate;
          } else {
            payment.dueDate = await this.getDatePayment(
              interval.startDate,
              interval.timePeriod,
              i
            );
          }
          if (!data.commissionPaidAlready) {
            commission = await this.calculateCommision(
              interval,
              data.weeklyBudget
            );
          }
          tempPayment = await this.populatePayment(
            data._id,
            payment,
            interval,
            i,
            commission
          );
          paymentsArray.push(tempPayment);
        }
      }
    }
    await this.paymentRepository.createMany<IPayment>(paymentsArray);
  }

  async calculateCommision(
    interval: any,
    weeklyBudget: number
  ): Promise<number> {
    switch (interval.timePeriod.toLowerCase()) {
      case 'custom':
        return weeklyBudget <= interval.amount
          ? 0
          : weeklyBudget - interval.amount;
      case 'daily':
        if (weeklyBudget > interval.amount) {
          const totalCommission = weeklyBudget - interval.amount;
          return parseInt((totalCommission / interval.frequency).toFixed(2));
        }
        return 0;
      case 'weekly':
        return weeklyBudget <= interval.amount
          ? 0
          : weeklyBudget - interval.amount;
      case 'monthly':
        if (weeklyBudget > interval.amount) {
          const totalCommission = weeklyBudget - interval.amount;
          return parseInt((totalCommission * 4).toFixed(2));
        }
        return 0;
      case 'fortnightly':
        if (weeklyBudget > interval.amount) {
          const totalCommission = weeklyBudget - interval.amount;
          return parseInt((totalCommission * 2).toFixed(2));
        }
        return 0;
      default:
        throw new Error('Invalid time period');
    }
  }

  async getDatePayment(
    date: string,
    timePeriod: string,
    number: number
  ): Promise<string> {
    const currentDate = new Date(date);

    switch (timePeriod.toLowerCase()) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + number);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + number * 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + number);
        break;
      case 'fortnightly':
        currentDate.setDate(currentDate.getDate() + number * 14);
        break;
      default:
        throw new Error('Invalid time period');
    }

    return currentDate.toString();
  }

  async populatePayment(
    caseId: string,
    payment: Payment,
    interval: any,
    frequency: number,
    commission: number
  ) {
    payment.amount = interval.amount;
    payment.frequency = frequency;
    payment.caseId = caseId;
    payment.intervalId = String(interval._id);
    payment.timePeriod = interval.timePeriod;
    payment.commission = commission;
    return {...payment};
  }

  async getCaseCode() {
    const cases = await this.caseRepository.getAll<ICase>({}, {}, undefined);
    if (!cases.length) return 'CASE-001';
    let caseCode = cases[cases.length - 1].caseCode;
    return (
      'CASE-' +
      (parseInt(caseCode.split('-')[1]) + 1).toString().padStart(3, '0')
    );
  }

  async getAllCreditorsOfDebtor(debtor: IDebtor) {
    const cases = await this.caseRepository.getAll<ICase>(
      {debtor: debtor._id},
      'totalDebt caseCode status',
      undefined,
      undefined,
      {path: 'creditor', select: ['basicInformation.fullName']}
    );

    const tempCases: any = cases;
    return tempCases.map(obj => ({
      totalDebt: obj.totalDebt,
      caseCode: obj.caseCode,
      status: obj.status,
      name: obj.creditor.basicInformation.fullName,
    }));
  }

  async createCase(body: any, role: string, email: string) {
    let contactIds = null;
    let debtor: IDebtor = null;
    let creditor: ICreditor = null;
    const getDebtor = await this.debtRepository.getOne<IDebtor>({
      $or: [
        {
          'basicInformation.email':
            body.debtor.basicInformation.email.toLowerCase(),
        },
        {
          'basicInformation.SSID': body.debtor.basicInformation.SSID,
        },
        {
          'basicInformation.phone': body.debtor.basicInformation.phone,
        },
      ],
    });
    const getCreditor = await this.creditorRepository.getOne<ICreditor>({
      $or: [
        {
          'basicInformation.email':
            body.creditor.basicInformation.email.toLowerCase(),
        },
        {
          'basicInformation.phone': body.creditor.basicInformation.phone,
        },
      ],
    });
    if (!getDebtor) {
      contactIds = await this.createContacts(
        body.debtor.contacts as IContact[]
      );
      const debtorData = {
        ...body.debtor,
        contacts: contactIds,
      };
      debtor = await this.createDebtor(debtorData as IDebtor);
    }
    if (!getCreditor) {
      contactIds = await this.createContacts(
        body.creditor.contacts as IContact[]
      );
      const creditorData = {
        ...body.creditor,
        contacts: contactIds,
      };
      creditor = await this.createCreditor(creditorData as ICreditor);
    }
    if (getDebtor) debtor = getDebtor as IDebtor;
    if (getCreditor) creditor = getCreditor as ICreditor;
    body.debtor = debtor?._id;
    body.creditor = creditor?._id;
    const newCase = new Case();
    newCase.caseOwner = role;
    newCase.createdBy = email;
    newCase.caseCode = await this.getCaseCode();
    if (!body.commissionPaidAlready) {
      newCase.commissionCalculated = parseInt(
        (body.totalDebt * 0.19).toFixed(2)
      );
    }
    const validatedCase = DataCopier.copy(newCase, body);
    const caseCreated = await this.caseRepository.create<ICase>(validatedCase);
    await this.createPayment(caseCreated);
    return caseCreated;
  }

  async checkCasePayment(body: any): Promise<[boolean, string]> {
    if (body.remaining !== body.totalDebt - body.paidAmount) {
      return [false, constantsUtil.Messages.PAYMENT_CALCULATION_ERROR];
    }
    if (body && body.intervals && body.intervals.length) {
      let amount = 0;
      for (const interval of body.intervals) {
        if (!interval.frequency) {
          amount += interval.amount;
        }
        if (interval.frequency != 0) {
          // for (let i = 0; i < interval.frequency; i++) {
          //   amount += interval.amount;
          // }
          let multipliedAmount = interval.frequency * interval.amount;
          amount += multipliedAmount;
        }
      }
      if (amount !== body.remaining) {
        return [false, constantsUtil.Messages.PAYMENT_CALCULATION_ERROR];
      }
    }
    return [true, ''];
  }

  async getClientsList(cases: any) {
    const seenDebtor = new Set();
    const result = [];
    const mappingIndex = {};
    const mappingCreditors = {};
    let seenCreditor = new Set();
    let index = 0;
    for (const tempCase of cases) {
      let debtorId = String(tempCase.debtor._id);
      let creditorId = String(tempCase.creditor);
      if (seenDebtor.has(debtorId)) {
        let index = mappingIndex[debtorId];
        let creditorSet = mappingCreditors[debtorId];
        let resultObj = result[index];
        if (!creditorSet.has(creditorId)) {
          resultObj.creditors += 1;
          creditorSet.add(creditorId);
          mappingCreditors[debtorId] = creditorSet;
        }
        result[index] = {
          cases: resultObj.cases + 1,
          creditors: resultObj.creditors,
          name: resultObj.name,
          status: resultObj.status,
          totalDebt: resultObj.totalDebt + tempCase.totalDebt,
          id: resultObj.id,
        };
      } else {
        seenDebtor.add(debtorId);
        seenCreditor.add(creditorId);
        result.push({
          cases: 1,
          creditors: 1,
          name: tempCase.debtor.basicInformation.fullName,
          status: tempCase.debtor.basicInformation.status,
          totalDebt: tempCase.totalDebt,
          id: debtorId,
        });
        mappingIndex[debtorId] = index;
        index += 1;
        mappingCreditors[debtorId] = seenCreditor;
        seenCreditor = new Set();
      }
    }
    return result;
  }

  // async getClientDetails(cases: any) {
  //   const caseIds = cases.map((tempCase: ICase) => {
  //     return String(tempCase._id);
  //   });
  //   const payments = await this.paymentRepository.getAll<IPayment>({
  //     caseId: caseIds,
  //   });
  //   const filteredPayments = await paymentUtil.getFilteredPaymentsObj(payments);
  //   const resultObj = {};
  //   const result = [];
  //   let caseIndex = 0,
  //     bin = 0;
  //   let objectCreated = false;
  //   while (true) {
  //     if (
  //       bin === filteredPayments.upcomingPayments.length &&
  //       caseIndex === caseIds.length
  //     ) {
  //       break;
  //     }
  //     if (
  //       caseIds[caseIndex] ===
  //       String(filteredPayments.upcomingPayments[bin]?.caseId)
  //     ) {
  //       if (!objectCreated) {
  //         resultObj['creditor'] =
  //           cases[caseIndex].creditor.basicInformation.fullName;
  //         resultObj['totalDebt'] = cases[caseIndex].totalDebt;
  //         resultObj['upcomingDebt'] =
  //           filteredPayments.upcomingPayments[bin].amount;
  //         resultObj['upcomingAuthDate'] = new Date(
  //           filteredPayments.upcomingPayments[bin].dueDate
  //         )
  //           .toISOString()
  //           .split('T')[0];
  //         resultObj['caseOwner'] = cases[caseIndex].caseOwner;
  //         result.push(resultObj);
  //         objectCreated = true;
  //       }
  //       bin += 1;
  //     } else {
  //       if (!objectCreated) {
  //         resultObj['creditor'] =
  //           cases[caseIndex].creditor.basicInformation.fullName;
  //         resultObj['totalDebt'] = cases[caseIndex].totalDebt;
  //         resultObj['upcomingDebt'] = 0;
  //         resultObj['upcomingAuthDate'] = '-';
  //         resultObj['caseOwner'] = cases[caseIndex].caseOwner;
  //         result.push(resultObj);
  //       }
  //       caseIndex += 1;
  //       objectCreated = false;
  //     }
  //   }
  //   bin = 0;
  //   caseIndex = 0;
  //   let findSuccess = false;
  //   let finalResult = [];
  //   while (true) {
  //     if (
  //       bin === filteredPayments.successPayments.length &&
  //       caseIndex === caseIds.length
  //     ) {
  //       break;
  //     }
  //     if (
  //       caseIds[caseIndex] ===
  //       String(filteredPayments.successPayments[bin]?.caseId)
  //     ) {
  //       bin += 1;
  //       findSuccess = true;
  //     } else {
  //       if (findSuccess) {
  //         let temp = {...result[caseIndex]};
  //         temp['lastPaymentDate'] = new Date(
  //           filteredPayments.successPayments[bin - 1].dueDate
  //         )
  //           .toISOString()
  //           .split('T')[0];
  //         temp['lastPayment'] =
  //           filteredPayments.successPayments[bin - 1].amount;
  //         finalResult.push(temp);
  //       }
  //       if (!findSuccess) {
  //         let temp = {...result[caseIndex]};
  //         temp['lastPaymentDate'] = '-';
  //         temp['lastPayment'] = 0;
  //         finalResult.push(temp);
  //       }
  //       caseIndex += 1;
  //       findSuccess = false;
  //     }
  //   }
  //   const countPayments = {
  //     failedAuthorizations: filteredPayments.failedAuthorizations.length,
  //     failedPayments: filteredPayments.failedPayments.length,
  //     successAuthorizations: filteredPayments.successAuthorizations.length,
  //     successPayments: filteredPayments.successPayments.length,
  //   };

  //   return {columns: finalResult, paymentsCount: countPayments};
  // }

  async getClientDetails(req: Request) {
    const convertedDebtorId = new mongoose.Types.ObjectId(req.params.id);
    const pipeline = [
      {
        $match: {debtor: convertedDebtorId},
      },
      {
        $lookup: {
          from: 'debtors',
          localField: 'debtor',
          foreignField: '_id',
          as: 'debtorDetails',
        },
      },
      {
        $unwind: '$debtorDetails',
      },
      {
        $lookup: {
          from: 'creditors',
          localField: 'creditor',
          foreignField: '_id',
          as: 'creditorDetails',
        },
      },
      {
        $unwind: '$creditorDetails',
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'caseId',
          as: 'payments',
        },
      },
      {
        $addFields: {
          lastPayment: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$payments',
                  as: 'payment',
                  cond: {$eq: ['$$payment.captured', 'Success']},
                },
              },
              -1,
            ],
          },
          upcomingPayment: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$payments',
                  as: 'payment',
                  cond: {$eq: ['$$payment.authorized', 'Pending']},
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          lastPayment: {$ifNull: ['$lastPayment', null]},
          upcomingPayment: {$ifNull: ['$upcomingPayment', null]},
        },
      },
      {
        $group: {
          _id: '$debtor',
          caseHistory: {
            $push: {
              _id: '$_id',
              creditorName: '$creditorDetails.basicInformation.fullName',
              totalDebt: '$totalDebt',
              lastPayment: {$ifNull: ['$lastPayment.amount', null]},
              lastPaymentDate: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {$ifNull: ['$lastPayment.dueDate', null]},
                },
              },
              upcomingPayment: {$ifNull: ['$upcomingPayment.amount', null]},
              upcomingPaymentDate: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {$ifNull: ['$upcomingPayment.dueDate', null]},
                },
              },
              caseOwner: '$caseOwner',
              outstandingDebt: {
                $subtract: ['$totalDebt', {$sum: '$payments.amount'}],
              },
            },
          },
          debtorDetails: {$first: '$debtorDetails'},
          failedPayments: {
            $sum: {
              $size: {
                $filter: {
                  input: '$payments',
                  as: 'payment',
                  cond: {$eq: ['$$payment.captured', 'Failed']},
                },
              },
            },
          },
          failedAuthorizations: {
            $sum: {
              $size: {
                $filter: {
                  input: '$payments',
                  as: 'payment',
                  cond: {$eq: ['$$payment.authorized', 'Failed']},
                },
              },
            },
          },
          successfulPayments: {
            $sum: {
              $size: {
                $filter: {
                  input: '$payments',
                  as: 'payment',
                  cond: {$eq: ['$$payment.captured', 'Success']},
                },
              },
            },
          },
          successfulAuthorizations: {
            $sum: {
              $size: {
                $filter: {
                  input: '$payments',
                  as: 'payment',
                  cond: {$eq: ['$$payment.authorized', 'Success']},
                },
              },
            },
          },
        },
      },
      {
        $project: {
          caseHistory: 1,
          debtor: {
            SSN: '$debtorDetails.basicInformation.SSID',
            fullName: '$debtorDetails.basicInformation.fullName',
            companyName: '$debtorDetails.businessInformation.companyName',
            email: '$debtorDetails.basicInformation.email',
            status: '$debtorDetails.basicInformation.status',
            address: '$debtorDetails.basicInformation.address',
            outstandingDebt: {
              $sum: '$caseHistory.outstandingDebt',
            },
            totalDebt: {
              $sum: '$caseHistory.totalDebt',
            },
          },
          paymentCounts: {
            failedPayments: '$failedPayments',
            failedAuthorizations: '$failedAuthorizations',
            successfulPayments: '$successfulPayments',
            successfulAuthorizations: '$successfulAuthorizations',
          },
        },
      },
    ];

    const results: any = await this.caseRepository.applyAggregate(pipeline);
    if (results[0]?.caseHistory) {
      results[0].caseHistory = await this.filterAndPaginateCaseHistory(
        results[0]?.caseHistory,
        req
      );
    }

    return results.length ? results[0] : null;
  }
  async filterAndPaginateCaseHistory(caseHistory: [], req: Request) {
    let page = 1;
    let limit = 5;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    // Helper function to apply text search
    const applyTextSearch = (caseObj: any, text: string | RegExp) => {
      const regex = new RegExp(text, 'i');
      return regex.test(caseObj.creditorName) || regex.test(caseObj.caseOwner);
    };

    // Helper function to apply numeric/date filters
    const applyFilters = (caseObj: any, filters: any) => {
      if (
        filters.totalDebt &&
        (caseObj.totalDebt < filters.totalDebt.min ||
          caseObj.totalDebt > filters.totalDebt.max)
      ) {
        return false;
      }
      if (
        filters.lastPaymentAmount &&
        (caseObj.lastPayment < filters.lastPaymentAmount.min ||
          caseObj.lastPayment > filters.lastPaymentAmount.max)
      ) {
        return false;
      }
      if (
        filters.lastPaymentDate &&
        (new Date(caseObj.lastPaymentDate) < filters.lastPaymentDate.start ||
          new Date(caseObj.lastPaymentDate) > filters.lastPaymentDate.end)
      ) {
        return false;
      }
      if (
        filters.upcomingPaymentAmount &&
        (caseObj.upcomingPayment < filters.upcomingPaymentAmount.min ||
          caseObj.upcomingPayment > filters.upcomingPaymentAmount.max)
      ) {
        return false;
      }
      if (
        filters.upcomingPaymentDate &&
        (new Date(caseObj.upcomingPaymentDate) <
          filters.upcomingPaymentDate.start ||
          new Date(caseObj.upcomingPaymentDate) >
            filters.upcomingPaymentDate.end)
      ) {
        return false;
      }
      if (
        filters.outstandingDebt &&
        (caseObj.outstandingDebt < filters.outstandingDebt.min ||
          caseObj.outstandingDebt > filters.outstandingDebt.max)
      ) {
        return false;
      }
      return true;
    };
    let text = '',
      filters = {};
    if (req.query.search === 'true') {
      text = req.body.text;
    }
    if (req.query.filter === 'true') {
      filters = req.body.filters;
    }
    // Apply text search and filters
    let filteredCaseHistory = caseHistory.filter(caseObj => {
      const textMatches = !text || applyTextSearch(caseObj, text);
      const filtersMatch =
        Object.keys(filters).length === 0 || applyFilters(caseObj, filters);
      return textMatches && filtersMatch;
    });

    // Apply pagination
    const paginatedCaseHistory = filteredCaseHistory.slice(
      (page - 1) * limit,
      page * limit
    );

    return paginatedCaseHistory;
  }
  async getClientDetailsFilters(req: Request) {
    const filterConditions = [];

    if (req.query.filter === 'true') {
      const filters = req.body.filters;
      // Add filters for numeric/date ranges if provided
      if (filters.totalDebt) {
        filterConditions.push({
          totalDebt: {$gte: filters.totalDebt.min, $lte: filters.totalDebt.max},
        });
      }
      if (filters.lastPaymentAmount) {
        filterConditions.push({
          lastPayment: {
            $gte: filters.lastPaymentAmount.min,
            $lte: filters.lastPaymentAmount.max,
          },
        });
      }
      if (filters.lastPaymentDate) {
        filterConditions.push({
          lastPaymentDate: {
            $gte: filters.lastPaymentDate.start,
            $lte: filters.lastPaymentDate.end,
          },
        });
      }
      if (filters.upcomingPaymentAmount) {
        filterConditions.push({
          upcomingPayment: {
            $gte: filters.upcomingPaymentAmount.min,
            $lte: filters.upcomingPaymentAmount.max,
          },
        });
      }
      if (filters.upcomingPaymentDate) {
        filterConditions.push({
          upcomingPaymentDate: {
            $gte: filters.upcomingPaymentDate.start,
            $lte: filters.upcomingPaymentDate.end,
          },
        });
      }
      if (filters.outstandingDebt) {
        filterConditions.push({
          outstandingDebt: {
            $gte: filters.outstandingDebt.min,
            $lte: filters.outstandingDebt.max,
          },
        });
      }
    }

    if (req.query.search === 'true') {
      const text = req.body.text;
      console.log('i am hereeeeeee');
      console.log(text);
      if (text) {
        console.log('i am hereeeeeee');
        filterConditions.push({
          $or: [{creditorName: {$regex: text}}, {caseOwner: {$regex: text}}],
        });
      }
    }
    console.log(filterConditions, 'pplplplplp');
    return filterConditions;
  }

  async getClientListingPipeline(req: Request) {
    let page = 1;
    let limit = 5;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    const filters = await this.getClientListingFilters(req);
    const pipeline = [
      {
        $lookup: {
          from: 'debtors',
          localField: 'debtor',
          foreignField: '_id',
          as: 'debtor',
        },
      },
      {
        $unwind: '$debtor',
      },
      {
        $match: filters[1],
      },
      {
        $group: {
          _id: {$toString: '$debtor._id'},
          debtorName: {$first: '$debtor.basicInformation.fullName'},
          totalCases: {$sum: 1},
          totalCreditors: {$addToSet: '$creditor'},
          totalDebt: {$sum: '$totalDebt'},
          status: {$first: '$debtor.basicInformation.status'},
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          debtorName: 1,
          totalCases: 1,
          totalCreditors: {$size: '$totalCreditors'}, // Count unique creditors
          totalDebt: 1,
          status: 1,
        },
      },
      {
        $match: filters[0],
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ];
    return pipeline;
  }

  async getClientListingFilters(req: Request) {
    const queryFilter = {};
    const querySearch = {};
    if (req.query.filter === 'true') {
      let filter = req.body.filter;
      if (filter.totalDebt) {
        queryFilter['totalDebt'] = {
          $gte: filter.totalDebt.min,
          $lte: filter.totalDebt.max,
        };
      }
      if (filter.totalCases) {
        queryFilter['totalCases'] = {
          $gte: filter.totalCases.min,
          $lte: filter.totalCases.max,
        };
      }
      if (filter.totalCreditors) {
        queryFilter['totalCreditors'] = {
          $gte: filter.totalCreditors.min,
          $lte: filter.totalCreditors.max,
        };
      }
    }
    if (req.query.search === 'true') {
      querySearch['$or'] = [
        {'debtor.basicInformation.fullName': req.body.text},
        {'debtor.basicInformation.status': req.body.text},
      ];
    }
    return [queryFilter, querySearch];
  }

  async updateContacts(data: IContact[]) {
    for (const contact of data) {
      await this.contactRepository.updateById<IContact>(contact._id, {
        ...contact,
      });
    }
  }

  async updateDebtor(data: IDebtor) {
    return await this.debtRepository.updateById<IDebtor>(data._id, {...data});
  }

  async updateCreditor(data: ICreditor) {
    return await this.creditorRepository.updateById<ICreditor>(data._id, {
      ...data,
    });
  }
}
export default new CaseUtil();
