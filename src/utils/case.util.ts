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
import {PaymentLoggingRepository} from '../api/repository/paymentLogging/paymentLogging.repository';
import {IPaymentLogging} from '../database/interfaces/paymentLogging.interface';
import {v4} from 'uuid';
import axios from 'axios';
import commonUtil from './common.util';
import UploadUtil from './upload.util';
import {AIAuth} from '../database/repomodels/global';
const baseUrlAI = 'https://dms-negotiation.hpdemos.co/';
class CaseUtil {
  private contactRepository: ContactRepository;
  private debtRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private debtorService: DebtorService;
  private creditorService: CreditorService;
  private paymentLoggingRepository: PaymentLoggingRepository;
  private uploadUtil: UploadUtil;

  constructor() {
    this.contactRepository = new ContactRepository();
    this.debtRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
    this.uploadUtil = new UploadUtil();
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
        tempPayment = await this.populatePayment(
          data._id,
          payment,
          interval,
          0
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
              i - 1
            );
          }
          tempPayment = await this.populatePayment(
            data._id,
            payment,
            interval,
            i
          );
          paymentsArray.push(tempPayment);
        }
      }
    }
    await this.paymentRepository.createMany<IPayment>(paymentsArray);
    await this.paymentLoggingRepository.createMany<IPaymentLogging>(
      paymentsArray
    );
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
    frequency: number
  ) {
    const uuid = v4();
    payment.amount = interval.amount;
    payment.frequency = frequency;
    payment.caseId = caseId;
    payment.intervalId = String(interval._id);
    payment.timePeriod = interval.timePeriod;
    payment.paymentReference = uuid;
    return {...payment};
  }

  async getCaseCode() {
    const count = await this.caseRepository.getCount<ICase>();
    if (!count) return 'CASE-001';
    // let caseCode = cases[cases.length - 1].caseCode;
    return 'CASE-' + (count + 1).toString().padStart(3, '0');
  }

  async getAllCreditorsOfDebtor(debtor: IDebtor) {
    const cases = await this.getAllCreditorsOfDebtorQuery(String(debtor._id));
    const tempCases: any = cases;
    return tempCases.map(obj => ({
      totalDebt: obj.totalDebt,
      caseCode: obj.caseCode,
      status: obj.status,
      name: obj.creditor.basicInformation.fullName,
      caseId: String(obj._id),
      creditorId: String(obj.creditor._id),
      creditorAccountTitle: obj.creditor.accountTitle
        ? obj.creditor.accountTitle
        : '',
    }));
  }

  async getAllCreditorsOfDebtorQuery(debtorId: string) {
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
      {debtor: debtorId, isDeleted: false},
      'totalDebt caseCode status remaining',
      undefined,
      undefined,
      {
        path: 'creditor',
        select: ['basicInformation.fullName', 'accountTitle'],
      }
    );
    return cases;
  }

  async createCase(body: any, name: string, id: string) {
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
    let weeklyBudgetObj: {
      status: boolean;
      commission: number;
      totalCommission: number;
    };
    if (!getDebtor) {
      if (body.feePayment === 'toPay') {
        weeklyBudgetObj = await this.checkWeeklyBudget(body, false, null);
        if (!weeklyBudgetObj.status) {
          return [
            false,
            'Weekly budget is not fulfiling the payment plan of debtor',
          ];
        }
        body.debtor.totalCommission = weeklyBudgetObj.totalCommission;
        body.debtor.weeklyCommission = weeklyBudgetObj.commission;
      }
      // contactIds = await this.createContacts(
      //   body.debtor.contacts as IContact[]
      // );
      // const debtorData = {
      //   ...body.debtor,
      // };
      debtor = await this.createDebtor(body.debtor as IDebtor);
    }
    if (!getCreditor) {
      // contactIds = await this.createContacts(
      //   body.creditor.contacts as IContact[]
      // );
      // const creditorData = {
      //   ...body.creditor,
      //   contacts: contactIds,
      // };
      creditor = await this.createCreditor(body.creditor as ICreditor);
    }
    if (getDebtor) {
      debtor = getDebtor;
      if (body.feePayment === 'toPay') {
        weeklyBudgetObj = await this.checkWeeklyBudget(body, true, getDebtor);
        if (!weeklyBudgetObj.status) {
          return [
            false,
            'Weekly budget is not fulfiling the payment plan of debtor',
          ];
        }
        body.debtor.totalCommission = weeklyBudgetObj.totalCommission;
        body.debtor.weeklyCommission = weeklyBudgetObj.commission;
      }
      await this.debtRepository.updateById<IDebtor>(getDebtor._id, body.debtor);
    }
    if (getCreditor) {
      creditor = getCreditor as ICreditor;
      await this.creditorRepository.updateById<ICreditor>(
        getCreditor._id,
        body.creditor
      );
    }
    body.debtor = debtor?._id;
    body.creditor = creditor?._id;
    const newCase = new Case();
    newCase.caseOwner = name;
    newCase.caseOwnerId = id;
    newCase.negotiator = name;
    newCase.negotiatorId = id;
    newCase.manager = name;
    newCase.managerId = id;
    newCase.chatId = v4();
    newCase.caseCode = await this.getCaseCode();
    const validatedCase = DataCopier.copy(newCase, body);
    const caseCreated = await this.caseRepository.create<ICase>(validatedCase);
    if (!caseCreated) {
      return [false, constantsUtil.failureAddMessage('case')];
    }
    await this.createPayment(caseCreated);
    if (body.paymentToken && body.paymentType) {
      await this.debtorService.createVault(
        body.paymentToken,
        String(caseCreated.debtor),
        body.paymentType
      );
    }
    if (body.paymentTokenCreditor && body.paymentTypeCreditor) {
      await this.creditorService.createVault(
        body.paymentTokenCreditor,
        String(caseCreated.creditor),
        body.paymentTypeCreditor
      );
    }
    console.log('i am going to call AI');
    const creditorNames: Array<string> = await this.getCreditorNames(
      caseCreated,
      debtor
    );
    console.log(creditorNames, 'creditonamess');
    const findCreditor = creditorNames.includes(
      creditor.businessInformation.companyName
    );
    console.log(findCreditor, 'findCrediotrrr');
    if (findCreditor) {
      await this.creditorRepository.updateById(creditor._id, {
        'businessInformation.accountTitle':
          creditor.businessInformation.companyName,
      });
    }
    return [true, {caseCreated, findCreditor, creditorNames}];
  }

  async checkWeeklyBudget(body: any, debtorFound: boolean, debtor: IDebtor) {
    let weeklyBudget = 0;
    let debt = 0;
    let amount = 0;
    if (!debtorFound) {
      const interval = body.intervals[0];
      weeklyBudget = body.debtor.basicInformation.weeklyBudget;
      debt = body.remaining;
      amount = await this.getWeeklyAmount(interval);
      return amount >= weeklyBudget
        ? {
            status: false,
            commission: 0,
            totalCommission: 0,
          }
        : {
            status: true,
            commission: weeklyBudget - amount,
            totalCommission: parseInt((debt * 0.19).toFixed(2)),
          };
    }
    if (debtorFound) {
      const interval = body.intervals[0];
      debt = body.remaining;
      amount = await this.getWeeklyAmount(interval);
    }
    weeklyBudget = body.debtor.basicInformation.weeklyBudget;
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>({
      debtor: debtor._id,
      isDeleted: false,
    });
    for (const caseTemp of cases) {
      amount += await this.getWeeklyAmount(caseTemp.intervals[0]);
      debt += caseTemp.remaining;
    }
    return amount >= weeklyBudget
      ? {
          status: false,
          commission: 0,
          totalCommission: 0,
        }
      : {
          status: true,
          commission: weeklyBudget - amount,
          totalCommission: parseInt((debt * 0.19).toFixed(2)),
        };
  }
  async getWeeklyAmount(interval: any) {
    switch (interval.timePeriod.toLowerCase()) {
      case 'custom':
        return interval.amount;
      case 'daily':
        return interval.amount * interval.frequency;
      case 'weekly':
        return interval.amount;
      case 'monthly':
        return parseInt((interval.amount / 4).toFixed(2));
      case 'fortnightly':
        return parseInt((interval.amount / 2).toFixed(2));
      default:
        throw new Error('Invalid time period');
    }
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
        if (interval.frequency) {
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

  async getClientDetails(req: Request) {
    const convertedDebtorId = new mongoose.Types.ObjectId(req.params.id);
    const pipeline = [
      {
        $match: {debtor: convertedDebtorId, isDeleted: {$ne: true}},
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
                $subtract: ['$remaining', {$sum: '$payments.amount'}],
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

    const results: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    if (results[0]?.caseHistory) {
      results[0].caseHistory = await this.filterCaseHistoryDebtor(
        results[0]?.caseHistory,
        req
      );
    }

    return results.length ? results[0] : null;
  }
  async filterCaseHistoryDebtor(caseHistory: [], req: Request) {
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
        (new Date(caseObj.lastPaymentDate) <
          new Date(filters.lastPaymentDate.start) ||
          new Date(caseObj.lastPaymentDate) >
            new Date(filters.lastPaymentDate.end))
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
          new Date(filters.upcomingPaymentDate.start) ||
          new Date(caseObj.upcomingPaymentDate) >
            new Date(filters.upcomingPaymentDate.end))
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

    return filteredCaseHistory;
  }

  async filterAndPaginateCaseHistoryCreditor(caseHistory: [], req: Request) {
    let page = 1;
    let limit = 10;

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
      return regex.test(caseObj.debtorName) || regex.test(caseObj.caseOwner);
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
        (new Date(caseObj.lastPaymentDate) <
          new Date(filters.lastPaymentDate.start) ||
          new Date(caseObj.lastPaymentDate) >
            new Date(filters.lastPaymentDate.end))
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
          new Date(filters.upcomingPaymentDate.start) ||
          new Date(caseObj.upcomingPaymentDate) >
            new Date(filters.upcomingPaymentDate.end))
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

  async getCreditorDetails(req: Request) {
    const convertedCreditorId = new mongoose.Types.ObjectId(req.params.id);
    const pipeline = [
      {
        $match: {creditor: convertedCreditorId, isDeleted: {$ne: true}},
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
          _id: '$creditor',
          caseHistory: {
            $push: {
              _id: '$_id',
              debtorName: '$debtorDetails.basicInformation.fullName',
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
                $subtract: ['$remaining', {$sum: '$payments.amount'}],
              },
            },
          },
          creditorDetails: {$first: '$creditorDetails'},
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
          creditor: {
            fullName: '$creditorDetails.basicInformation.fullName',
            email: '$creditorDetails.basicInformation.email',
            phone: '$creditorDetails.basicInformation.phone',
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

    const results: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    if (results[0]?.caseHistory) {
      results[0].caseHistory = await this.filterAndPaginateCaseHistoryCreditor(
        results[0]?.caseHistory,
        req
      );
    }

    return results.length ? results[0] : null;
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
      if (text) {
        filterConditions.push({
          $or: [{creditorName: {$regex: text}}, {caseOwner: {$regex: text}}],
        });
      }
    }
    return filterConditions;
  }

  async getClientListingPipeline(req: Request, match: {}) {
    const filters = await this.getClientListingFilters(req);
    const pipeline = [
      {
        $match: match, // Filter out isDeleted cases
      },
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
        $sort: {id: -1},
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
        {
          'debtor.basicInformation.fullName': {
            $regex: req.body.text,
            $options: 'i',
          },
        },
        {
          'debtor.basicInformation.status': {
            $regex: req.body.text,
            $options: 'i',
          },
        },
      ];
    }
    return [queryFilter, querySearch];
  }

  async getCreditorListingPipeline(req: Request, match: {}) {
    const filters = await this.getCreditorListingFilters(req);
    const pipeline = [
      {
        $match: match, // Filter out isDeleted cases
      },
      {
        $lookup: {
          from: 'creditors',
          localField: 'creditor',
          foreignField: '_id',
          as: 'creditor',
        },
      },
      {
        $unwind: '$creditor',
      },
      {
        $match: filters[1],
      },
      {
        $group: {
          _id: {$toString: '$creditor._id'},
          creditorName: {$first: '$creditor.basicInformation.fullName'},
          totalCases: {$sum: 1},
          totalDebtors: {$addToSet: '$debtor'}, // Collect unique debtors
          totalDebt: {$sum: '$totalDebt'},
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          creditorName: 1,
          totalCases: 1,
          totalDebtors: {$size: '$totalDebtors'}, // Count unique debtors
          totalDebt: 1,
        },
      },
      {
        $match: filters[0],
      },
      {
        $sort: {id: -1},
      },
    ];

    return pipeline;
  }

  async getCreditorListingFilters(req: Request) {
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
        queryFilter['totalDebtors'] = {
          $gte: filter.totalDebtors.min,
          $lte: filter.totalDebtors.max,
        };
      }
    }
    if (req.query.search === 'true') {
      querySearch['creditor.basicInformation.fullName'] = {
        $regex: req.body.text,
        $options: 'i',
      };
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

  async getUpdatedCommAndTotalComm(debtorId: string) {
    const debtor = await this.debtRepository.getById<IDebtor>(debtorId);
    const weeklyBudget = debtor.basicInformation.weeklyBudget;
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>({
      debtor: debtor._id,
      isDeleted: false,
    });
    let amount = 0,
      debt = 0;
    for (const caseTemp of cases) {
      amount += await this.getWeeklyAmount(caseTemp.intervals[0]);
      debt += caseTemp.remaining;
    }
    for (const caseTemp of cases) {
      console.log(caseTemp.intervals);
    }
    console.log(amount, 'amounttt');
    console.log(weeklyBudget, 'weeklyy budget');
    return amount >= weeklyBudget
      ? {
          status: false,
          commission: 0,
          totalCommission: 0,
        }
      : {
          status: true,
          commission: weeklyBudget - amount,
          totalCommission: parseInt((debt * 0.19).toFixed(2)),
        };
  }

  // async getAIWrapperData(req: any, caseTemp: ICase) {
  //   if (
  //     new Date(req.session.expires_in) <=
  //       new Date(commonUtil.getCurrentDate()) ||
  //     !req.session.auth_token
  //   ) {
  //     await this.storeAuthToken('test', 'test', req);
  //   }
  //   console.log(req.session.auth_token);
  //   const creditorNames = await this.getCreditorNames(
  //     caseTemp,
  //     req.session.auth_token
  //   );
  //   console.log(creditorNames);

  //   const getScores = await this.getScores(
  //     19,
  //     req.session.auth_token,
  //     caseTemp,
  //     creditorNames
  //   );
  //   console.log(getScores);
  //   const getSettlementRange = await this.getSettlementRange(
  //     caseTemp,
  //     req.session.auth_token
  //   );
  //   console.log(getSettlementRange, 'okokokok');
  //   // return 'ok';
  //   let getCreditorHistory = [];
  //   if (Object.keys(getSettlementRange).length) {
  //     getCreditorHistory = await this.getCreditorHistory(
  //       getSettlementRange.creditors_id,
  //       req.session.auth_token
  //     );
  //   }
  //   return {creditorNames, getScores, getSettlementRange, getCreditorHistory};
  // }

  async getCreditorNamesAI(
    caseTemp: any,
    token: string,
    debtorName: string,
    debtorId: string
  ) {
    const url = `${baseUrlAI}get-creditor-names?debtor_name=${debtorName}&debtor_id=${debtorId}`;
    const urls = [];
    try {
      for (let doc of caseTemp.documents) {
        const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
        urls.push(url);
      }
      // Data to be sent in the body of the request
      console.log(urls);
      const data = urls;
      const response = await axios.post(url, data, {
        headers: {
          accept: 'application/json',
          token: token,
          'Content-Type': 'application/json',
        },
      });
      console.log(response.data, 'creditorrr');
      return response.data.error ? [] : response.data.creditor_names;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getScoresAI(
    comm: number,
    token: string,
    caseTemp: any,
    additionalProps: Array<string>
  ) {
    const url = `${baseUrlAI}get-scores?debtor_id=${String(
      caseTemp.debtor._id
    )}&commision_percentage=${comm}`;
    console.log(url);
    // let data = {
    //   'Everest Businss Funding': {total_debt: 100000, remaining_debt: 50000},
    // };
    let data = {};
    if (additionalProps.length) {
      const cases: any =
        await this.caseRepository.getAllWithoutPagination<ICase>(
          {creditor: {$in: additionalProps}},
          undefined,
          undefined,
          undefined,
          ['creditor']
        );
      // for (let creditor of additionalProps) {
      // const matchedCreditorCases = cases.filter((caseTemp: any) => {
      //   return (
      //     caseTemp.creditor.businessInformation.accountTitle === creditor
      //   );
      // });
      // if (matchedCreditorCases.length) {
      //   matchedCreditors.push(...matchedCreditorCases);
      // } else {
      //   unMatchedNames += creditor + ' ';
      // }
      // }
      for (const matchedCreditor of cases) {
        data[`${matchedCreditor.creditor.accountTitle}`] = {
          total_debt: matchedCreditor.totalDebt,
          remaining_debt: matchedCreditor.remaining,
        };
      }
    }
    console.log(data);
    try {
      const response = await axios.post(url, data, {
        headers: {
          accept: 'application/json',
          token: token,
          'Content-Type': 'application/json',
        },
      });
      console.log(response.data, 'scoreeeee');
      if (response.data.error) {
        return [[], 'No data returned for the creditors'];
      }
      if (response.data) {
        return [response.data, 'Data returned for all creditors'];
        // if (unMatchedNames) {
        //   return [
        //     response.data,
        //     `Data returned for the creditors except ${unMatchedNames}`,
        //   ];
        // }
      }
      return response.data.error ? [] : response.data;
    } catch (error) {
      return [[], 'No data returned for the creditors'];
    }
  }

  async getSettlementRangeAI(caseTemp: any, token: string) {
    const url = `${baseUrlAI}get-settlement-range?debtor_id=${String(
      caseTemp.debtor._id
    )}`;
    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            accept: 'application/json',
            token: token,
          },
        }
      );
      return response.data.error ? [] : response.data;
    } catch (error) {
      return [];
    }
  }

  async getCreditorHistoryAI(creditorId: string, token: string) {
    const url = `${baseUrlAI}get-creditor-history?creditor_id=${creditorId}`;
    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            accept: 'application/json',
            token: token,
          },
        }
      );
      console.log(response.data, 'historyyyy');
      return response.data.error ? [] : response.data;
    } catch (error) {
      return [];
    }
  }

  async getSummary(req: any, caseTemp: any) {
    if (
      !req.session.auth_token ||
      new Date(req.session.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const url = `${baseUrlAI}negotiator?human_input=${req.body.humanInput}&debtor_id=123&chat_id=${caseTemp.chatId}`;

    const data = {
      debtor_budget: caseTemp.debtor.basicInformation.weeklyBudget,
      financial_health_summary: req.body.financialHealthSummary,
    };
    try {
      const response = await axios.post(url, data, {
        headers: {
          accept: 'application/json',
          token: req.session.auth_token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data.error ? [] : response.data.response;
    } catch (error) {
      return [];
    }
  }

  async getAIToken(username: string, partnerToken: string) {
    const url = `${baseUrlAI}get-auth-token?username=${username}&partner_token=${partnerToken}`;
    try {
      const response = await axios.get(url);
      return response.data.error ? [] : response.data;
    } catch (error) {
      return [];
    }
  }

  async getCreditorNames(caseTemp: any, debtor: IDebtor) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const creditorNames = await this.getCreditorNamesAI(
      caseTemp,
      AIAuth.auth_token,
      debtor.businessInformation.companyName,
      debtor.id
    );
    console.log(creditorNames);
    return creditorNames;
  }

  async getScores(req: Request, caseTemp: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const getScores = await this.getScoresAI(
      19,
      AIAuth.auth_token,
      caseTemp,
      req.body.creditorNames
    );
    console.log(getScores);
    return getScores;
  }

  async getSettlementRange(caseTemp: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const getSettlementRange = await this.getSettlementRangeAI(
      caseTemp,
      AIAuth.auth_token
    );
    console.log(getSettlementRange);

    return getSettlementRange;
  }

  async getCreditorHistory(req: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const getCreditorHistory = await this.getCreditorHistoryAI(
      req.params.id,
      AIAuth.auth_token
    );
    console.log(getCreditorHistory);

    return getCreditorHistory;
  }

  async storeAuthToken(username: string, partnerToken: string): Promise<void> {
    const url = `${baseUrlAI}get-auth-token?username=${username}&partner_token=${partnerToken}`;
    try {
      const response = await axios.get(url);
      if (response && response.data) {
        AIAuth.auth_token = response.data.auth_token;
        AIAuth.expires_in = response.data.expires_in;
      }
    } catch (error) {
      AIAuth.auth_token = '';
      AIAuth.expires_in = commonUtil.getCurrentDate();
    }
  }
}
export default new CaseUtil();
