import {parse} from 'path';
import CallUploadUtil from './callUpload.util';
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
import {AnyLengthString} from 'aws-sdk/clients/comprehend';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import FormData from 'form-data';
import {StrategyRepository} from '../api/repository/strategy/strategy.repository';
import {CaseHistoryRepository} from '../api/repository/caseHistory/caseHistory.repository';
import {ICaseHistory} from '../database/interfaces/caseHistory.interface';
import {JustificationRepository} from '../api/repository/justification/justification.repository';
import {IJustification} from '../database/interfaces/justification.interface';
import paynoteUtil from './paynote.util';
import {nanoid} from 'nanoid';
import creditorUtil from './creditor.util';
import emailUtil from './email.util';
import debtorUtil from './debtor.util';
import {IStrategy} from '../database/interfaces/strategy.interface';
import {paymentPlatform} from '../enums';
import twilio from 'twilio'

dotenv.config();
class CaseUtil {
  private callUploadUtil: CallUploadUtil;
  private contactRepository: ContactRepository;
  private debtRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private debtorService: DebtorService;
  private creditorService: CreditorService;
  private paymentLoggingRepository: PaymentLoggingRepository;
  private uploadUtil: UploadUtil;
  private strategyRepository: StrategyRepository;
  private caseHistoryRepository: CaseHistoryRepository;
  private justificationRepository: JustificationRepository;
  constructor() {
    this.callUploadUtil = new CallUploadUtil();
    this.contactRepository = new ContactRepository();
    this.debtRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
    this.uploadUtil = new UploadUtil();
    this.strategyRepository = new StrategyRepository();
    this.caseHistoryRepository = new CaseHistoryRepository();
    this.justificationRepository = new JustificationRepository();
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

  async createDebtor(data: IDebtor, createdBy: string) {
    console.log(createdBy, 'plplplpl');
    // let data = req.body as IDebtor;
    // const reqTemp: any = req;
    const newDebtor = new Debtor();
    newDebtor.createdBy = createdBy;
    // newDebtor.emailKey = `[${nanoid(10).toUpperCase().replace(/[_-]/g, '')}]`;
    // newDebtor.createdBy = reqTemp.id;
    // if (!data?.basicInformation?.weeklyBudget)
    //   data.basicInformation.weeklyBudget = 1;
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
          0,
          String(data.debtor)
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
            i,
            String(data.debtor)
          );
          paymentsArray.push(tempPayment);
        }
      }
    }
    await this.paymentRepository.createMany<IPayment>(paymentsArray);
    // await this.paymentLoggingRepository.createMany<IPaymentLogging>(
    //   paymentsArray
    // );
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
    debtor: string
  ) {
    // const uuid = v4();
    payment.amount = interval.amount;
    payment.frequency = frequency;
    payment.caseId = caseId;
    payment.intervalId = String(interval._id);
    payment.timePeriod = interval.timePeriod;
    // payment.paymentReference = uuid;
    payment.debtorId = debtor;
    return {...payment};
  }

  async getCaseCode() {
    const count = await this.caseRepository.getCount<ICase>();
    if (!count) return 'CASE-001';
    // let caseCode = cases[cases.length - 1].caseCode;
    return 'CASE-' + (count + 1).toString().padStart(3, '0');
  }

  async getAllCreditorsOfDebtor(debtor: IDebtor) {
    console.log(debtor, 'debtorrrrs');
    const cases = await this.getAllCreditorsOfDebtorQuery(String(debtor._id));
    console.log(cases);
    return await this.getAllCreditorsMapping(cases);
  }

  async getAllCreditorsMapping(cases: any) {
    return cases.map(obj => ({
      totalDebt: obj.totalDebt,
      caseCode: obj.caseCode,
      remaining: obj.remaining,
      status: obj.status,
      name: obj.creditor.basicInformation.fullName,
      caseId: String(obj._id),
      creditorId: String(obj.creditor._id),
      creditorAccountTitle: obj.creditor.accountTitle
        ? obj.creditor.accountTitle
        : '',
      accountTitleMapping: obj.creditor.accountTitleMapping
        ? obj.creditor.accountTitleMapping
        : [],
      contractDetails: obj.contractDetails ? obj.contractDetails : null,
      remainingAmountPaid: obj.remainingAmountPaid
        ? obj.remainingAmountPaid
        : 0,
      previousAmountPaid: obj.paidAmount,
      aggression: obj.creditor.aggression,
    }));
  }

  async getAllCreditorsByCaseIds(caseIds: string[]) {
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
      {_id: caseIds, isDeleted: false},
      'totalDebt caseCode status remaining contractDetails remainingAmountPaid paidAmount',
      undefined,
      {_id: -1},
      {
        path: 'creditor',
        select: [
          'basicInformation.fullName',
          'accountTitle',
          'accountTitleMapping',
        ],
      }
    );
    return await this.getAllCreditorsMapping(cases);
  }

  async getAllCreditorsOfDebtorQuery(debtorId: string) {
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
      {debtor: debtorId, isDeleted: false},
      'totalDebt caseCode status remaining contractDetails remainingAmountPaid paidAmount',
      undefined,
      {_id: -1},
      {
        path: 'creditor',
        select: [
          'basicInformation.fullName',
          'accountTitle',
          'accountTitleMapping',
          'aggression',
        ],
      }
    );
    return cases;
  }

  async getAllCreditorsOfDebtorForCase(debtorId: string, creditorId: string) {
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
      {debtor: debtorId, isDeleted: false, creditor: {$ne: creditorId}},
      undefined,
      undefined,
      {_id: -1},
      {
        path: 'creditor',
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
      debtor = await this.createDebtor(body, '');
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
    // if (body.paymentToken && body.paymentType) {
    //   await this.createVault(
    //     body.paymentToken,
    //     String(caseCreated.debtor),
    //     body.paymentType
    //   );
    // }
    // if (body.paymentTokenCreditor && body.paymentTypeCreditor) {
    //   await this.creditorService.createVault(
    //     body.paymentTokenCreditor,
    //     String(caseCreated.creditor),
    //     body.paymentTypeCreditor
    //   );
    // }
    console.log('i am going to call AI');
    const creditorNames: Array<string> = await this.getCreditorNames(
      debtor,
      '',
      ''
    );
    console.log(creditorNames, 'creditonamess');
    const findCreditor = creditorNames.includes(
      creditor.businessInformation.companyName
    );
    console.log(findCreditor, 'findCrediotrrr');
    if (findCreditor) {
      await this.creditorRepository.updateById<ICreditor>(creditor._id, {
        'businessInformation.accountTitle':
          creditor.businessInformation.companyName,
        updatedAt: commonUtil.getCurrentDate(),
      });
    }
    return [true, {caseCreated, findCreditor, creditorNames}];
  }

  async checkWeeklyBudget(body: any, debtorFound: boolean, debtor: IDebtor) {
    let weeklyBudget = 0;
    let debt = 0;
    let amount = 0;
    // if (!debtorFound) {
    //   const interval = body.intervals[0];
    //   weeklyBudget = body.debtor.basicInformation.weeklyBudget;
    //   debt = body.remaining;
    //   amount = await this.getWeeklyAmount(interval);
    //   return amount >= weeklyBudget
    //     ? {
    //         status: false,
    //         commission: 0,
    //         totalCommission: 0,
    //       }
    //     : {
    //         status: true,
    //         commission: weeklyBudget - amount,
    //         totalCommission: parseInt((debt * 0.19).toFixed(2)),
    //       };
    // }
    // let commisionPercentage = body.commisionPercentage
    //   ? body.commisionPercentage / 100
    //   : 0.19;
    let commisionPercentage = debtor.commissionPercentage / 100;
    if (debtorFound && body.intervals) {
      const interval = body.intervals[0];
      debt = body.remaining ? body.remaining : 0;
      amount = await this.getWeeklyAmount(interval);
    }
    weeklyBudget = debtor.basicInformation.weeklyBudget;
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>({
      _id: {$ne: body._id},
      debtor: debtor._id,
      isDeleted: false,
    });
    for (const caseTemp of cases) {
      if (caseTemp.intervals.length) {
        amount += await this.getWeeklyAmount(caseTemp.intervals[0]);
        debt += caseTemp.remaining;
      }
    }
    console.log(cases, 'casessss');
    console.log(weeklyBudget, 'weeklyBudget');
    console.log(amount, 'amounttttt');
    console.log(debt, 'debteeee');
    return amount >= weeklyBudget
      ? {
          status: false,
          commission: 0,
          totalCommission: 0,
        }
      : {
          status: true,
          commission: weeklyBudget - amount,
          totalCommission: parseInt(
            (debt * (commisionPercentage / 100)).toFixed(2)
          ),
        };
  }
  async getWeeklyAmount(interval: any) {
    switch (interval.timePeriod.toLowerCase()) {
      case 'custom':
        return interval.amount;
      case 'daily':
        let multiple = interval.frequency;
        if (interval.frequency > 7) multiple = 7;
        return interval.amount * multiple;
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
  async checkCasePayment(
    body: any,
    commission = 0
  ): Promise<[boolean, string]> {
    let isExempt = body?.isExempt ? body?.isExempt : true;
    if (
      !isExempt &&
      body.remaining &&
      body.remaining !== body.totalDebt - body.paidAmount
    ) {
      return [false, constantsUtil.Messages.PAYMENT_CALCULATION_ERROR];
    }
    if (body && body.intervals && body.intervals.length && !isExempt) {
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
      const amountEqual = commission ? commission : body.remaining;
      if (amount !== amountEqual) {
        return [
          false,
          constantsUtil.Messages.INTERVALS_PAYMENT_CALCULATION_ERROR,
        ];
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
                  cond: {$eq: ['$$payment.status', 'Success']},
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
              remaining: '$remaining',
              pipeLineStatus: '$status',
            },
          },
          debtorDetails: {$first: '$debtorDetails'},
          totalRemaining: {$sum: {$ifNull: ['$remaining', 0]}}, // Handle null cases for 'remaining'
          failedCaptures: {
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
                  cond: {$eq: ['$$payment.status', 'Success']},
                },
              },
            },
          },
          successfulCaptures: {
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
            weeklyBudget: '$debtorDetails.basicInformation.weeklyBudget',
            outstandingDebt: {
              $sum: '$caseHistory.outstandingDebt',
            },
            totalDebt: {
              $sum: '$caseHistory.totalDebt',
            },
            totalCommission: '$debtorDetails.totalCommission',
            totalRemaining: '$totalRemaining', // Include the calculated totalRemaining here
          },
          paymentCounts: {
            failedCaptures: '$failedCaptures',
            successfulCaptures: '$successfulCaptures',
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
                  cond: {$eq: ['$$payment.status', 'Success']},
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
          failedCaptures: {
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
                  cond: {$eq: ['$$payment.status', 'Success']},
                },
              },
            },
          },
          successfulCaptures: {
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
            failedCaptures: '$failedCaptures',
            failedAuthorizations: '$failedAuthorizations',
            successfulPayments: '$successfulPayments',
            successfulCaptures: '$successfulCaptures',
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

  async getClientListingPipeline(req: Request, keyword: string) {
    let match = {isDeleted: {$ne: true}};
    let reqTemp: any = req;
    if (keyword === 'viewClientsForSelf') {
      match['$or'] = [
        {caseOwnerId: reqTemp.id},
        {negotiatorId: reqTemp.id},
        {managerId: reqTemp.id},
      ];
    }
    // const filters = await this.getClientListingFilters(req);
    const pipeline: any = [
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
        $group: {
          _id: {$toString: '$debtor._id'},
          companyName: {$first: '$debtor.businessInformation.companyName'},
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
          companyName: 1,
          totalCases: 1,
          totalCreditors: {$size: '$totalCreditors'}, // Count unique creditors
          totalDebt: 1,
          status: 1,
        },
      },
    ];
    let clientDetails: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    // let allDebtors = [];
    // const clientIds = clientDetails.map(client => {
    //   return client.id;
    // });
    // if (keyword === 'viewClientsForSelf') {
    //   const remainingDebtors =
    //     await this.debtRepository.getAllWithoutPagination<IDebtor>({
    //       _id: {$nin: clientIds},
    //       createdBy: reqTemp.id,
    //     });
    //   console.log(remainingDebtors);
    //   const remainingDebtorsFiltered = remainingDebtors.map(debtor => {
    //     return {
    //       companyName: debtor.businessInformation.companyName,
    //       totalCases: 0,
    //       totalDebt: 0,
    //       status: debtor.basicInformation.status,
    //       id: String(debtor._id),
    //       totalCreditors: 0,
    //     };
    //   });
    //   allDebtors = [...clientDetails, ...remainingDebtorsFiltered];
    // } else {
    //   const remainingDebtors =
    //     await this.debtRepository.getAllWithoutPagination<IDebtor>({
    //       _id: {$nin: clientIds},
    //     });
    //   const remainingDebtorsFiltered = remainingDebtors.map(debtor => {
    //     return {
    //       companyName: debtor.businessInformation.companyName,
    //       totalCases: 0,
    //       totalDebt: 0,
    //       status: debtor.basicInformation.status,
    //       id: String(debtor._id),
    //       totalCreditors: 0,
    //     };
    //   });
    //   allDebtors = [...clientDetails, ...remainingDebtorsFiltered];
    // }
    // if (allDebtors.length) {
    //   allDebtors = await this.filterClientsListing(allDebtors, req);
    // }
    // allDebtors.sort((a, b) => (a.id < b.id ? 1 : -1));
    // return allDebtors.length ? allDebtors : [];
    if (clientDetails.length) {
      clientDetails = await this.filterClientsListing(clientDetails, req);
    }
    clientDetails.sort((a, b) => (a.id < b.id ? 1 : -1));
    return clientDetails.length ? clientDetails : [];
  }

  async filterClientsListing(clients: any[], req: Request) {
    // Helper function to apply text search
    const applyTextSearch = (client: any, text: string | RegExp) => {
      const regex = new RegExp(text, 'i');
      return regex.test(client.companyName) || regex.test(client.status);
    };

    // Helper function to apply numeric/date filters
    const applyFilters = (client: any, filters: any) => {
      if (
        filters.totalDebt &&
        (client.totalDebt < filters.totalDebt.min ||
          client.totalDebt > filters.totalDebt.max)
      ) {
        return false;
      }
      if (
        filters.totalCases &&
        (client.totalCases < filters.totalCases.min ||
          client.totalCases > filters.totalCases.max)
      ) {
        return false;
      }
      if (
        filters.totalCreditors &&
        (client.totalCreditors < filters.totalCreditors.min ||
          client.totalCreditors > filters.totalCreditors.max)
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
      filters = req.body.filter;
    }
    console.log(filters);
    // Apply text search and filters
    let filteredCaseHistory = clients.filter(client => {
      const textMatches = !text || applyTextSearch(client, text);
      const filtersMatch =
        Object.keys(filters).length === 0 || applyFilters(client, filters);
      return textMatches && filtersMatch;
    });

    return filteredCaseHistory;
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
          companyName: {$first: '$creditor.businessInformation.companyName'},
          totalCases: {$sum: 1},
          totalDebtors: {$addToSet: '$debtor'}, // Collect unique debtors
          totalDebt: {$sum: '$totalDebt'},
        },
      },
      {
        $project: {
          id: '$_id',
          _id: 0,
          companyName: 1,
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
    data.updatedAt = commonUtil.getCurrentDate();
    return await this.debtRepository.updateById<IDebtor>(data._id, {...data});
  }

  async updateCreditor(data: ICreditor) {
    data.updatedAt = commonUtil.getCurrentDate();
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

  async getCreditorNamesAI(
    documents: any,
    token: string,
    debtorName: string,
    debtorId: string,
    extractedFields: any,
    caseId: string
  ) {
    const url = `${process.env.baseUrlAI}get-creditor-names?debtor_name=${debtorName}&debtor_id=${debtorId}`;
    const urls = [];
    try {
      for (let doc of documents) {
        const url = await this.uploadUtil.getS3FileSignedUrl(doc.key, true);
        urls.push(url);
      }
      // Data to be sent in the body of the request
      const data = {bank_statements: urls, extracted_fields: extractedFields};
      console.log('I am in getCreditorNamesAI');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: token,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data.error && caseId) {
        this.strategyRepository.upsert(
          {caseId: caseId, name: 'strategy_one'},
          {
            'data.creditorNames': response.data,
            updatedAt: commonUtil.getCurrentDate(),
          }
        );
        this.caseRepository.updateById(caseId, {
          strategyOne_1: true,
          updatedAt: commonUtil.getCurrentDate(),
        });
      }
      if (response.data.error && caseId) {
        this.caseRepository.updateById(caseId, {
          strategyOne_1: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
      }
      return response.data.error ? response.data.error : response.data;
    } catch (error) {
      console.log(error.message);
      return error.message;
    }
  }

  async getScoresAI(
    comm: number,
    token: string,
    caseTemp: any,
    creditors: any
  ) {
    const url = `${process.env.baseUrlAI}get-scores?debtor_id=${String(
      caseTemp.debtor._id
    )}&commision_percentage=${comm}`;
    let data = {};
    for (const creditor of creditors) {
      const accountTitles = creditor.creditor.accountTitleMapping
        ? creditor.creditor.accountTitleMapping
        : [];
      const accTitleObj = accountTitles.find(temp => {
        return temp.caseId === String(creditor._id);
      });
      let accountTitle = '';
      accountTitle =
        accTitleObj && accTitleObj?.accountTitle
          ? accTitleObj.accountTitle
          : creditor.creditor.accountTitle;
      // let weekly_budget = Math.max(
      //   (creditor.remaining * 0.09) / 4,
      //   caseTemp.debtor.basicInformation.weeklyBudget
      // );
      let weekly_budget = caseTemp.debtor.weeklyBudgetStrategy1;
      let amount = this.getCleanAmount(creditor?.contractDetails?.loan_amount);
      if (accountTitle && weekly_budget && creditor.remaining) {
        data[`${accountTitle}`] = {
          total_debt: creditor.totalDebt,
          remaining_debt: creditor.remaining,
          weekly_budget: weekly_budget,
          principle_amount: amount,
        };
      }
    }
    if (!Object.keys(data).length) data = [];
    console.log('I am in getScoresAIForSelectedCreditors');
    console.log('URL: ', url);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: token,
          'Content-Type': 'application/json',
        },
      });
      return response.data.error ? response.data.error : response.data;
    } catch (error) {
      return error.message;
    }
  }

  getCleanAmount(data: string) {
    if (!data) return 0;
    const cleanedAmount = data.replace(/\$|,/g, '');
    let amount = parseInt(cleanedAmount, 10);
    if (isNaN(amount)) {
      amount = 0;
    }
    return amount;
  }

  async getSettlementRangeAI(caseTemp: any, token: string) {
    const url = `${
      process.env.baseUrlAI
    }get-settlement-range?debtor_id=${String(caseTemp.debtor._id)}`;
    console.log('I am in getSettlementRangeAI');
    console.log('URL: ', url);
    console.log('Payload: ', 'No payload for this call');
    try {
      const response = await axiosInstance.post(
        url,
        {},
        {
          headers: {
            accept: 'application/json',
            token: token,
          },
        }
      );
      return response.data.error ? response.data.error : response.data;
    } catch (error) {
      return error.message;
    }
  }

  async getCreditorHistoryAI(creditorId: string, token: string) {
    const url = `${process.env.baseUrlAI}get-creditor-history?creditor_id=${creditorId}`;
    try {
      const response = await axiosInstance.post(
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

  async getSettlementJustifications(caseTemp: ICase, models: string[]) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const result = await this.strategyRepository.getOne<IStrategy>({
      caseId: String(caseTemp._id),
      name: 'strategy_one',
    });

    let settlementRange = result.data?.settlementRange?.settlement_range;

    if (settlementRange && Object.keys(settlementRange).length) {
      delete settlementRange.Summary;
    } else {
      settlementRange = {};
    }

    const url = `${
      process.env.baseUrlAI
    }get-settlement-justifications?debtor_id=${String(
      caseTemp.debtor
    )}&enable_cache=${false}&ucc_score=${
      result.data.getScoresAIForAllCreditors.Scores['UCC Score']
    }&default_risk_score=${
      result.data.getScoresAIForAllCreditors.Scores['Default Risk Score']
    }`;

    const data = {
      llm_options: {LLMs: models},
      settlements: {creditors: settlementRange},
    };
    try {
      console.log('I am in get-settlement-justifications');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: AIAuth.auth_token,
        },
      });
      console.log('response:------------------- ', response.data);
      if (response.data && response.data.error) {
        this.caseRepository.updateById(caseTemp._id, {
          justifications: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
        return [false, response.data.error];
      }
      this.strategyRepository.upsert(
        {caseId: caseTemp._id, name: 'justifications'},
        {
          'data.justifications': response.data,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      this.caseRepository.updateById(caseTemp._id, {
        justifications: true,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return [true, response.data];
    } catch (error) {
      return [false, error.message];
    }
  }

  async lumpSumJustifications(caseTemp: any, models: string[], lupmSum: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    console.log(lupmSum);
    const result = await this.strategyRepository.getOne<IStrategy>({
      caseId: String(caseTemp._id),
      name: 'strategy_one',
    });
    const url = `${
      process.env.baseUrlAI
    }get-lump-sum-justifications?debtor_id=${String(
      caseTemp.debtor._id
    )}&enable_cache=${true}&ucc_score=${
      result.data.getScoresAIForAllCreditors.Scores['UCC Score']
    }&default_risk_score=${
      result.data.getScoresAIForAllCreditors.Scores['Default Risk Score']
    }`;
    const data = {
      llm_options: {LLMs: models},
      lumpsum_settlement: {creditors: lupmSum},
    };
    try {
      console.log('I am in get-lump-sum-justifications');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: AIAuth.auth_token,
        },
      });
      if (response.data && response.data.error) {
        this.caseRepository.updateById(caseTemp._id, {
          lumpSumJustifications: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
        return [false, response.data.error];
      }
      this.strategyRepository.upsert(
        {caseId: caseTemp._id, name: 'lumpSumJustifications'},
        {
          'data.justifications': response.data,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      this.caseRepository.updateById(caseTemp._id, {
        lumpSumJustifications: true,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return [true, response.data];
    } catch (error) {
      return [false, error.message];
    }
  }

  async fullProfitJustifications(caseTemp: ICase, models: string[]) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const result = await this.strategyRepository.getOne<IStrategy>({
      caseId: String(caseTemp._id),
      name: 'strategy_one',
    });
    const url = `${
      process.env.baseUrlAI
    }get-full-profit-justifications?debtor_id=${String(
      caseTemp.debtor
    )}&enable_cache=${true}&ucc_score=${
      result.data.getScoresAIForAllCreditors.Scores['UCC Score']
    }&default_risk_score=${Math.round(
      result.data.getScoresAIForAllCreditors.Scores['Default Risk Score']
    )}`;
    const data = {LLMs: models};
    try {
      console.log('I am in get-full-profit-justifications');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: AIAuth.auth_token,
        },
      });
      if (response.data && response.data.error) {
        this.caseRepository.updateById(caseTemp._id, {
          fullProfitJustifications: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
        return [false, response.data.error];
      }
      this.strategyRepository.upsert(
        {caseId: caseTemp._id, name: 'fullProfitJustifications'},
        {
          'data.justifications': response.data,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      this.caseRepository.updateById(caseTemp._id, {
        fullProfitJustifications: true,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return [true, response.data];
    } catch (error) {
      return [false, error.message];
    }
  }

  async getLumpSumAmount(caseTemp: ICase) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const url = `${process.env.baseUrlAI}get-lump-sum-amount?debtor_id=${String(
      caseTemp.debtor
    )}`;
    try {
      console.log('I am in getLumpSumAmount');
      console.log('URL: ', url);
      console.log('Payload: ', 'No payload for this call');
      const response = await axiosInstance.post(
        url,
        {},
        {
          headers: {
            accept: 'application/json',
            token: AIAuth.auth_token,
          },
        }
      );
      if (response.data && response.data.error) {
        this.caseRepository.updateById(caseTemp._id, {
          strategyTwo: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
        return [false, response.data.error];
      }
      const creditors = await debtorUtil.getCreditorsMapping({
        _id: String(caseTemp.debtor),
      } as any);
      let lumpSum = response.data;
      const lumpsum_settlement = lumpSum.lumpsum_settlement;
      for (const creditor of creditors) {
        if (lumpsum_settlement[creditor.creditorAccountTitle]) {
          const repaidDebt =
            lumpsum_settlement[creditor.creditorAccountTitle].repaid_debt;
          console.log(
            this.getCleanAmount(creditor.contractDetails.funded_amount)
          );
          lumpsum_settlement[
            creditor.creditorAccountTitle
          ].remaining_principle_amount = parseFloat(
            (
              this.getCleanAmount(creditor.contractDetails.funded_amount) -
              repaidDebt
            ).toFixed(2)
          );
        }
      }
      this.strategyRepository.upsert(
        {caseId: caseTemp._id, name: 'strategy_two'},
        {
          'data.lumpSumAmount': lumpSum,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      this.caseRepository.updateById(caseTemp._id, {
        strategyTwo: true,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return [true, response.data];
    } catch (error) {
      return [false, error.message];
    }
  }

  async getFullProfitSettlement(caseTemp: ICase) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const url = `${
      process.env.baseUrlAI
    }get-full-profit-settlement?debtor_id=${String(caseTemp.debtor)}`;
    try {
      console.log('I am in getFullProfitSettlement');
      console.log('URL: ', url);
      console.log('Payload: ', 'No payload for this call');
      const response = await axiosInstance.post(
        url,
        {},
        {
          headers: {
            accept: 'application/json',
            token: AIAuth.auth_token,
          },
        }
      );
      if (response.data && response.data.error) {
        this.caseRepository.updateById(caseTemp._id, {
          strategyThree: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
        return [false, response.data.error];
      }
      const thirdStrategy = await this.getSettlementMapping(response.data);
      this.strategyRepository.upsert(
        {caseId: caseTemp._id, name: 'strategy_three'},
        {
          'data.fullProfitSettlement': thirdStrategy,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      // const profitPercent = response.data['true_profit'] * 0.67;
      // await this.debtRepository.updateById<IDebtor>(String(caseTemp.debtor), {
      //   strategy3MaxProfit: profitPercent,
      // });
      this.caseRepository.updateById(caseTemp._id, {
        strategyThree: true,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return [true, response.data];
    } catch (error) {
      console.log(error);
      return [false, error.message];
    }
  }

  async getSettlementMapping(data: any) {
    if (data.settlement_range) {
      data.settlement_range = await this.getSettlementRangeSummery(
        data.settlement_range
      );
    }
    if (data?.option_2_stats?.settlement_range) {
      data.option_2_stats.settlement_range =
        await this.getSettlementRangeSummery(
          data.option_2_stats.settlement_range
        );
    }
    if (data.percentage_settlement_over_weekly_true_revenue) {
      data.percentage_settlement_over_weekly_true_revenue =
        await this.getSettlementRangeSummery(
          data.percentage_settlement_over_weekly_true_revenue
        );
    }
    if (data?.option_2_stats?.percentage_settlement_over_weekly_true_revenue) {
      data.option_2_stats.percentage_settlement_over_weekly_true_revenue =
        await this.getSettlementRangeSummery(
          data.option_2_stats.percentage_settlement_over_weekly_true_revenue
        );
    }
    if (data.percentage_settlement_over_weekly_budget) {
      data.percentage_settlement_over_weekly_budget =
        await this.getSettlementRangeSummery(
          data.percentage_settlement_over_weekly_budget
        );
    }
    if (data?.option_2_stats?.percentage_settlement_over_weekly_budget) {
      data.option_2_stats.percentage_settlement_over_weekly_budget =
        await this.getSettlementRangeSummery(
          data.option_2_stats.percentage_settlement_over_weekly_budget
        );
    }
    if (data.new_default_risk_score) {
      data.new_default_risk_score = await this.riskScoreMapping(
        data.new_default_risk_score
      );
    }
    if (data.weeks_till_paid) {
      data.weeks_till_paid = await this.transformData(data.weeks_till_paid);
      const result = await this.getSummaryInverse(data.weeks_till_paid);
      data.weeks_till_paid.Summary = result;
    }
    if (data?.option_2_stats?.weeks_till_paid) {
      data.option_2_stats.weeks_till_paid = await this.transformData(
        data.option_2_stats.weeks_till_paid
      );
      const result = await this.getSummaryInverse(
        data.option_2_stats.weeks_till_paid
      );
      data.option_2_stats.weeks_till_paid.Summary = result;
    }
    if (data.commission_range) {
      data.commission_range = await this.transformData(data.commission_range);
      const result = await this.getSummaryInverse(data.commission_range);
      data.commission_range.Summary = result;
    }
    if (data?.option_2_stats?.commission_range) {
      data.option_2_stats.commission_range = await this.transformData(
        data.option_2_stats.commission_range
      );
      const result = await this.getSummaryInverse(
        data.option_2_stats.commission_range
      );
      data.option_2_stats.commission_range.Summary = result;
    }
    if (data.weekly_budget) {
      const sum = await this.sumOfWeeklyBudgetValues(data.weekly_budget);
      data.weekly_budget.Summary = sum;
    }
    return data;
  }

  async sumOfWeeklyBudgetValues(weekly_budget: any) {
    const total = Object.values(weekly_budget).reduce(
      (sum: number, value: string) => sum + value,
      0
    );
    return total;
  }

  async getSummary(req: any, caseTemp: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const url = `${process.env.baseUrlAI}negotiator?human_input=${
      req.body.humanInput
    }&debtor_id=${String(caseTemp.debtor._id)}&chat_id=${caseTemp.chatId}`;

    const data = {
      debtor_budget: caseTemp.debtor.basicInformation.weeklyBudget,
      financial_health_summary: req.body.financialHealthSummary,
    };
    try {
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: AIAuth.auth_token,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if (response.data && response.data.error) {
        return [false, response.data.error];
      }
      return [true, response.data.response];
    } catch (error) {
      return [false, error.message];
    }
  }

  async getAIToken(username: string, partnerToken: string) {
    const url = `${process.env.baseUrlAI}get-auth-token?username=${username}&partner_token=${partnerToken}`;
    try {
      const response = await axiosInstance.get(url);
      return response.data.error ? [] : response.data;
    } catch (error) {
      return [];
    }
  }

  async getCreditorNames(debtor: IDebtor, extractedFields: any, caseId = '') {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const creditorNames = await this.getCreditorNamesAI(
      debtor.documents,
      AIAuth.auth_token,
      debtor.businessInformation.companyName,
      debtor._id,
      extractedFields,
      caseId
    );
    console.log(creditorNames);
    return creditorNames;
  }

  async getExtractionMCA(debtor: IDebtor) {
    console.log('hahahahahah');
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const extractedFields = await this.getExtractionMCA_AI(
      debtor.documents,
      AIAuth.auth_token
    );
    return extractedFields;
  }

  async getExtractionMCABuffer(documents: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const extractedFields = await this.getExtractionMCA_AIBuffer(
      documents,
      AIAuth.auth_token
    );
    return extractedFields;
  }

  async findMCASubStr(str: string) {
    const regex = /mca/i;
    const match = str.match(regex);
    return match ? true : false;
  }
  async findCsvSubStr(str: string) {
    const regex = /csv/i;
    const match = str.match(regex);
    return match ? true : false;
  }

  async getExtractionMCA_AI(documents: any, token: string) {
    const url = `${process.env.baseUrlAI}extract-fields-multiple-files?enable_cache=false`;
    try {
      const form = new FormData();
      for (let doc of documents) {
        if (await this.findCsvSubStr(doc.originalFileName)) {
          continue;
        }
        const contents = await this.uploadUtil.getPdfBytesFromS3(doc.key);
        form.append('MCA_pdf', Buffer.from(contents), {
          filename: doc.originalFileName,
          contentType: 'application/pdf',
        });
      }
      form.getLength((err, length) => {
        if (err) return null;
      });
      console.log('I am in getExtractionMCA_AI');
      console.log('URL: ', url);
      console.log('Payload: ', form);
      const response = await axiosInstance.post(url, form, {
        headers: {
          accept: 'application/json',
          token: token,
          ...form.getHeaders(),
        },
      });
      console.log('Response Data', response.data);
      return response.data.error ? null : response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getExtractionMCA_AIBuffer(documents: any, token: string) {
    const url = `${process.env.baseUrlAI}extract-fields-multiple-files?enable_cache=false`;
    try {
      const form = new FormData();
      for (let doc of documents) {
        form.append('MCA_pdf', doc.buffer, {
          filename: doc.originalname,
          contentType: 'application/pdf',
        });
      }
      // form.getLength((err, length) => {
      //   if (err) return 'null';
      //   return ''
      // });
      console.log('I am in getExtractionMCA_AIBuffer');
      console.log('URL: ', url);
      console.log('Payload: ', form);
      const response = await axiosInstance.post(url, form, {
        headers: {
          accept: 'application/json',
          token: token,
          ...form.getHeaders(),
        },
      });
      console.log('Response Data', response.data);
      return response.data.error ? response.data.error : response.data;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  }

  async getScores(caseTemp: any, creditors: any, comm: number) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const getScores = await this.getScoresAI(
      comm,
      AIAuth.auth_token,
      caseTemp,
      creditors
    );
    if (typeof getScores !== 'string') {
      const sum: any = await this.sumOfWeeklyBudgetValues(
        getScores.Scores['Weekly Budget']
      );
      getScores.Scores['Weekly Budget'].Summary = sum;
      // if (sum > 0) {
      //   await this.debtRepository.updateById<IDebtor>(caseTemp.debtor._id, {
      //     'basicInformation.weeklyBudget': sum,
      //     weeklyBudgetUpdated: true,
      //   });
      // }
    }
    return getScores;
  }

  async getScoresForAllCreditors(caseTemp: any, creditors: any, comm: number) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    const getScores = await this.getScoresAIForAllCreditors(
      comm,
      AIAuth.auth_token,
      caseTemp,
      creditors
    );
    if (typeof getScores !== 'string') {
      const sum: any = await this.sumOfWeeklyBudgetValues(
        getScores.Scores['Weekly Budget']
      );
      getScores.Scores['Weekly Budget'].Summary = sum;
      // if (sum > 0) {
      //   await this.debtRepository.updateById<IDebtor>(caseTemp.debtor._id, {
      //     'basicInformation.weeklyBudget': sum,
      //     weeklyBudgetUpdated: true,
      //   });
      // }
    }
    return getScores;
  }

  async getSettlementRange(caseTemp: any) {
    if (
      !AIAuth.auth_token ||
      new Date(AIAuth.expires_in) <= new Date(commonUtil.getCurrentDate())
    ) {
      await this.storeAuthToken('test', 'test');
    }
    let getSettlementRange = await this.getSettlementRangeAI(
      caseTemp,
      AIAuth.auth_token
    );
    if (typeof getSettlementRange === 'string') {
      this.caseRepository.updateById(caseTemp._id, {
        strategyOne_3: false,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return getSettlementRange;
    }
    getSettlementRange = await this.getSettlementMapping(getSettlementRange);
    // const profitPercent = getSettlementRange['true_profit'] * 0.67;
    // await this.debtRepository.updateById<IDebtor>(String(caseTemp.debtor._id), {
    //   strategy1MaxProfit: profitPercent,
    // });
    this.strategyRepository.upsert(
      {caseId: caseTemp._id, name: 'strategy_one'},
      {
        'data.settlementRange': getSettlementRange,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    this.caseRepository.updateById(caseTemp._id, {
      strategyOne_3: true,
      updatedAt: commonUtil.getCurrentDate(),
    });
    return getSettlementRange;
  }

  async riskScoreMapping(data: any) {
    if (Object.keys(data).length) {
      for (const key of Object.keys(data)) {
        data[key] = {
          min: Math.min(...data[key]),
          max: Math.max(...data[key]),
        };
      }
    }
    return data;
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

  async getScoresAIForAllCreditors(
    comm: number,
    token: string,
    caseTemp: any,
    creditors: any
  ) {
    const url = `${process.env.baseUrlAI}get-scores?debtor_id=${String(
      caseTemp.debtor._id
    )}&commision_percentage=${comm}`;
    let data = {};
    for (const creditor of creditors) {
      const accountTitles = creditor.accountTitleMapping
        ? creditor.accountTitleMapping
        : [];
      const accTitleObj = accountTitles.find(temp => {
        return temp.caseId === creditor.caseId;
      });
      let accountTitle = '';
      accountTitle =
        accTitleObj && accTitleObj?.accountTitle
          ? accTitleObj.accountTitle
          : creditor.creditorAccountTitle;
      // let weekly_budget = Math.max(
      //   (creditor.remaining * 0.09) / 4,
      //   caseTemp.debtor.basicInformation.weeklyBudget
      // );
      let weekly_budget = caseTemp.debtor.weeklyBudgetStrategy1;
      let amount = this.getCleanAmount(creditor.contractDetails.loan_amount);
      if (accountTitle && creditor.remaining && weekly_budget) {
        data[`${accountTitle}`] = {
          total_debt: creditor.totalDebt,
          remaining_debt: creditor.remaining,
          weekly_budget: weekly_budget,
          principle_amount: amount,
        };
      }
    }
    if (!Object.keys(data).length) data = [];
    console.log('I am in getScoresAIForAllCreditors');
    console.log('URL: ', url);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(url, data, {
        headers: {
          accept: 'application/json',
          token: token,
          'Content-Type': 'application/json',
        },
      });
      if (!response.data.error) {
        this.strategyRepository.upsert(
          {caseId: caseTemp._id, name: 'strategy_one'},
          {
            'data.getScoresAIForAllCreditors': response.data,
            updatedAt: commonUtil.getCurrentDate(),
          }
        );
        this.caseRepository.updateById(caseTemp._id, {
          strategyOne_2: true,
          updatedAt: commonUtil.getCurrentDate(),
        });
      }
      if (response.data.error) {
        this.caseRepository.updateById(caseTemp._id, {
          strategyOne_2: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
      }
      return response.data.error ? response.data.error : response.data;
    } catch (error) {
      return error.message;
    }
  }

  async storeAuthToken(username: string, partnerToken: string): Promise<void> {
    const url = `${process.env.baseUrlAI}get-auth-token?username=${username}&partner_token=${partnerToken}`;
    try {
      const response = await axiosInstance.get(url);
      if (response && response.data) {
        AIAuth.auth_token = response.data.auth_token;
        AIAuth.expires_in = response.data.expires_in;
      }
    } catch (error) {
      AIAuth.auth_token = '';
      AIAuth.expires_in = commonUtil.getCurrentDate();
    }
  }

  async createCreditorsCases(
    body: any,
    name: string,
    id: string,
    debtorId: string
  ) {
    let creditor: ICreditor = null;
    let dataArray = body.data;
    const createdCases = [];
    const debtor = await this.debtRepository.getById<IDebtor>(debtorId);
    if (!debtor) return [false, constantsUtil.notFoundMessage('debtor')];
    const getCreditorsEmail: any =
      await creditorUtil.getCreditorsEmailForDebtor(debtorId);
    const creditorsPaidAmount =
      await debtorUtil.getPaidAmountOfCreditors(debtor);
    for (const body of dataArray) {
      body.creditor.basicInformation.email =
        body.creditor.basicInformation.email.toLowerCase();
      const getCreditor = await this.creditorRepository.getOne<ICreditor>({
        'businessInformation.companyName':
          body.creditor.businessInformation.companyName,
      });
      if (!getCreditor) {
        creditor = await this.createCreditor(body.creditor as ICreditor);
        await paynoteUtil.createCustomer(creditor);
      }
      if (getCreditor) {
        body.updatedAt = commonUtil.getCurrentDate();
        creditor = await this.creditorRepository.updateById<ICreditor>(
          getCreditor._id,
          body.creditor
        );
      }
      if (creditor) {
        body.debtor = debtor?._id;
        body.creditor = creditor?._id;
        const newCase = new Case();
        newCase.caseOwner = name;
        newCase.caseOwnerId = id;
        newCase.negotiator = name;
        newCase.negotiatorId = id;
        newCase.manager = name;
        newCase.managerId = id;
        if (creditorsPaidAmount[creditor.accountTitle])
          body.lastPaymentDate =
            creditorsPaidAmount[creditor.accountTitle].last_withdrawal_date;
        if (!body.paidAmount && creditorsPaidAmount[creditor.accountTitle]) {
          body.paidAmount =
            creditorsPaidAmount[creditor.accountTitle].withdrawal_total;
          body.remaining =
            Math.round((body.totalDebt - body.paidAmount) * 100) / 100;
          if (body.totalDebt - body.paidAmount < 0) body.remaining = 0;
        }
        newCase.remainingAmountPaid = body.paidAmount;
        body.notes = body?.notes
          ? [
              {
                userId: id,
                value: body?.notes,
                createdAt: commonUtil.getCurrentDate(),
              },
            ]
          : [];
        newCase.chatId = v4();
        newCase.caseCode = await this.getCaseCode();
        const validatedCase = DataCopier.copy(newCase, body);
        console.log(validatedCase, 'validated caseeee');
        const caseCreated =
          await this.caseRepository.create<ICase>(validatedCase);
        // if (!caseCreated) {
        //   return [false, constantsUtil.failureAddMessage('case')];
        // }
        if (caseCreated) {
          createdCases.push(caseCreated);
          const accountTitles = creditor.accountTitleMapping;
          if (creditor.accountTitle) {
            accountTitles.push({
              caseId: String(caseCreated._id),
              accountTitle: creditor.accountTitle,
            });
            await this.creditorRepository.updateById<ICreditor>(creditor._id, {
              accountTitleMapping: accountTitles,
              updatedAt: commonUtil.getCurrentDate(),
            });
          }
          await this.addInHistory(
            {
              Time: new Date(commonUtil.getCurrentDate()),
              Action: 'Case Created',
              'Created By': name,
            },
            caseCreated._id
          );
        }
        // if (getCreditorsEmail.length && createdCases.length) {
        //   emailUtil.sendEmailIfDebtorGetsAdditionalDebt(
        //     createdCases,
        //     debtor,
        //     getCreditorsEmail
        //   );
        // }
        if (caseCreated?.intervals && caseCreated?.intervals?.length) {
          await this.createPayment(caseCreated);
        }
      }
    }
    await debtorUtil.updateDebtorTotalCommission(debtor);
    if (!createdCases.length) return [false, createdCases];

    return [true, createdCases];
  }

  async createCreditorsCasesFromExtraction(
    dataArray: any,
    name: string,
    id: string,
    debtorId: string
  ) {
    let creditor: ICreditor = null;
    const createdCases = [];
    for (const body of dataArray) {
      body.creditor.basicInformation.email =
        body.creditor.basicInformation.email.toLowerCase();
      const getCreditor = await this.creditorRepository.getOne<ICreditor>({
        'businessInformation.companyName':
          body.creditor.businessInformation.companyName,
      });
      if (!getCreditor) {
        creditor = await this.createCreditor(body.creditor as ICreditor);
      }
      if (getCreditor) {
        body.updatedAt = commonUtil.getCurrentDate();
        creditor = await this.creditorRepository.updateById<ICreditor>(
          getCreditor._id,
          body.creditor
        );
      }
      if (creditor) {
        body.debtor = debtorId;
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
        const caseCreated =
          await this.caseRepository.create<ICase>(validatedCase);
        // if (!caseCreated) {
        //   return [false, constantsUtil.failureAddMessage('case')];
        // }
        if (caseCreated) {
          createdCases.push(caseCreated);
          const accountTitles = creditor.accountTitleMapping;
          if (creditor.accountTitle) {
            accountTitles.push({
              caseId: String(caseCreated._id),
              accountTitle: creditor.accountTitle,
            });
            await this.creditorRepository.updateById<ICreditor>(creditor._id, {
              accountTitleMapping: accountTitles,
              updatedAt: commonUtil.getCurrentDate(),
            });
          }
          await this.addInHistory(
            {
              Time: new Date(commonUtil.getCurrentDate()),
              Action: 'Case Created',
              'Created By': name,
            },
            caseCreated._id
          );
        }
      }
    }
    if (!createdCases.length) return [false, createdCases];

    return [true, createdCases];
  }

  async createVault(
    paymentToken: string,
    debtorName: string,
    platform: string
  ): Promise<[boolean, string]> {
    const names = await commonUtil.getFirstAndLastNameByFullName(debtorName);
    const urlSecurityKey = await this.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const params = {
      customer_vault: 'add_customer',
      security_key: urlSecurityKey.securityKey,
      payment_token: paymentToken,
      first_name: names.firstName,
      last_name: names.lastName,
    };
    console.log(params, 'kjkjk');
    console.log(url, 'urlll');
    const response = await axiosInstance.get(url, {params});
    console.log(response.data, 'okoko');
    const responseNum = new URLSearchParams(response.data).get('response');
    if (responseNum === '1') {
      const customerVault = new URLSearchParams(response.data).get(
        'customer_vault_id'
      );
      return [true, customerVault];
    }
    return [false, 'Unable to create customer vault'];
  }

  async getUrlAndSecurityKeyPlatform(platform: string) {
    let securityKey = '';
    let url = '';
    switch (platform) {
      case paymentPlatform.easypay:
        securityKey = process.env.easypaySecurityKey;
        url = process.env.easypayUrl;
        break;
      case paymentPlatform.seamlesschex:
        securityKey = process.env.seamlesschexSecurityKey;
        url = process.env.seamlesschexUrl;
        break;
    }
    return {securityKey, url};
  }

  async getSettlementRangeSummery(
    data: Record<string, Record<string, number[]>>
  ) {
    console.log(' getSettlementRangeSummery ---- data: ', data);
    const result: Record<string, any> = {Summary: {}};
    if (data) {
      for (const key of Object.keys(data)) {
        for (const [recKey, values] of Object.entries(data[key])) {
          if (Array.isArray(values) && values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);

            if (!result[key]) {
              result[key] = {};
            }

            result[key][recKey] = {min, max};

            // Initialize the summary if not already done
            if (!result.Summary[recKey]) {
              result.Summary[recKey] = {min: 0, max: 0};
            }

            // Accumulate the values for summary
            result.Summary[recKey].min += min;
            result.Summary[recKey].max += max;
            console.log('max: ', max);
            console.log(
              ' result.Summary[recKey].max += max: ',
              (result.Summary[recKey].max += max)
            );
            console.log(
              'result.Summary[recKey].max: ',
              result.Summary[recKey].max
            );
          }
        }
      }
    }

    return result;
  }

  async getSummaryInverse(weeksTillPaid: any) {
    const summary = {};
    if (Object.keys(weeksTillPaid).length) {
      Object.values(weeksTillPaid).forEach(company => {
        for (const key of Object.keys(company)) {
          if (company[key]) {
            summary[key] = {min: 0, max: 0};
            summary[key].min = Math.max(summary[key].min, company[key].min);
            summary[key].max = Math.max(summary[key].max, company[key].max);
          }
        }
        // for (let i = 1; i <= Object.keys(company).length; i++) {
        //   const key = `Weeks remaining based on recommendation ${i}`;
        //   console.log(company[i - 0]);
        //   if (company[key]) {
        //     summary[key].min = Math.max(summary[key].min, company[key][0]);
        //     summary[key].max = Math.max(summary[key].max, company[key][1]);
        //   }
        // }
      });
    }
    return summary;
  }

  async transformData(weeksTillPaid: any) {
    if (Object.keys(weeksTillPaid).length) {
      Object.values(weeksTillPaid).forEach(company => {
        for (const key of Object.keys(company)) {
          if (company[key]) {
            company[key] = {
              max: Math.min(...company[key]),
              min: Math.max(...company[key]),
            };
          }
        }
      });
    }
    return weeksTillPaid;
  }

  async addNotes(req: Request, id: string) {
    return await this.caseRepository.updateById<ICase>(req.params.id, {
      $push: {
        notes: {
          userId: id,
          value: req.body.notes,
          createdAt: commonUtil.getCurrentDate(),
        },
      },
      updatedAt: commonUtil.getCurrentDate(),
    });
  }

  async addInHistory(history: any, id: string) {
    const res = await this.caseHistoryRepository.upsert<ICaseHistory>(
      {caseId: id},
      {
        $push: {caseHistory: {$each: [history], $position: 0}},
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
  }

  async getJustificationModels() {
    const justification =
      await this.justificationRepository.getOne<IJustification>({});
    console.log(justification, 'justification');
    const defaultModels = ['chatgpt', 'claude', 'gemini', 'llama'];
    if (!justification) return defaultModels;
    const arrayModels = Array<string>();
    if (justification.llama) arrayModels.push('llama');
    if (justification.chatgpt) arrayModels.push('chatgpt');
    if (justification.gemini) arrayModels.push('gemini');
    if (justification.claude) arrayModels.push('claude');
    return arrayModels.length ? arrayModels : defaultModels;
  }

  async getCreditorsForDebtor(debtorId: string, creditorId = '') {
    const match = {
      debtor: new mongoose.Types.ObjectId(debtorId),
    };
    if (creditorId) {
      match['creditor'] = {$ne: new mongoose.Types.ObjectId(creditorId)};
    }

    return await this.caseRepository.applyAggregate([
      {
        $match: match, // Filter for a specific debtor
      },
      {
        $group: {
          _id: '$creditor', // Group by creditor to get unique creditors
          totalDebt: {$sum: '$totalDebt'}, // Sum totalDebt for each creditor
          remaining: {$sum: '$remaining'}, // Sum remaining for each creditor
          caseCodes: {$addToSet: '$caseCode'}, // Collect all caseCodes for unique list
          statuses: {$addToSet: '$status'}, // Collect all statuses for unique list
        },
      },
      {
        $lookup: {
          from: 'creditors', // Name of the creditors collection
          localField: '_id', // Field in the cases (creditor reference)
          foreignField: '_id', // Field in the creditors collection (creditor _id)
          as: 'creditorDetails', // Output field containing the matched creditor details
        },
      },
      {
        $unwind: '$creditorDetails', // Unwind the creditorDetails array to get individual creditor details
      },
      {
        $project: {
          _id: 1, // Exclude the default _id field
          creditorEmail: '$creditorDetails.basicInformation.email', // Include creditor's email
          creditorName: '$creditorDetails.basicInformation.fullName',
          totalDebt: 1, // Total debt for the creditor from the group stage
          remaining: 1, // Remaining for the creditor from the group stage
          caseCode: 1, // Case codes collected from the group stage
          status: 1, // Statuses collected from the group stage
        },
      },
    ]);
  }

  async addWeekRemainingToCases(clientDetails) {
    if (
      !clientDetails ||
      !Array.isArray(clientDetails.caseHistory) ||
      !clientDetails.debtor
    ) {
      console.error(
        'Invalid clientDetails structure. Ensure caseHistory is an array and debtor details are present.'
      );
      return clientDetails;
    }

    const totalRemaining = clientDetails.debtor.totalRemaining || 0;
    const weeklyBudget = clientDetails.debtor.weeklyBudget || 0;

    if (totalRemaining <= 0 || weeklyBudget <= 0) {
      console.warn(
        'Invalid totalRemaining or weeklyBudget; skipping weekRemaining calculation.'
      );
      return clientDetails;
    }

    let maxWeekRemaining = 0;

    const updatedCaseHistory = clientDetails.caseHistory.map(caseHistory => {
      const remaining = caseHistory.remaining || 0;

      // Calculate weekRemaining
      const proportionOfTotal = remaining / totalRemaining;
      const weeklyAmount = proportionOfTotal * weeklyBudget;
      const weekRemaining =
        weeklyAmount > 0 ? Math.ceil(remaining / weeklyAmount) : null;

      // Update maxWeekRemaining if the current weekRemaining is greater
      if (weekRemaining !== null && weekRemaining > maxWeekRemaining) {
        maxWeekRemaining = weekRemaining;
      }

      console.log(
        `Case Remaining: ${remaining}, Proportion: ${proportionOfTotal}, Weekly Amount: ${weeklyAmount}, Week Remaining: ${weekRemaining}`
      );

      // Return updated case object with weekRemaining
      return {
        ...caseHistory,
        weekRemaining,
      };
    });

    console.log('Max Week Remaining:', maxWeekRemaining);

    return {
      ...clientDetails,
      caseHistory: updatedCaseHistory,
      maxWeekRemaining,
    };
  }

  async fetchRecording (recordingSid) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;

    try {
        const response = await fetch(recordingUrl, {
            headers: {
                Authorization: `Basic ${btoa(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`)}`,
            },
        });

        console.log('response',response)

        if (response.ok) {
            const fileBlob = await response.blob();
            const arrayBuffer = await fileBlob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `${recordingSid}`;
            try {
              console.log('fileNameasas', fileName)
                await this.callUploadUtil.uploadFile(fileName, buffer);   
            } catch (uploadError) {
                console.error('Error uploading file to S3:', uploadError);
            }

           return "File uploaded to S3";
        } else {
            console.error("Failed to fetch recording. Status:", response.status);
            return null;
        }
    } catch (error) {
        console.error("Error fetching the Twilio recording:", error);
        return null;
    }
  };
  async getAllEmailsOfCase(caseTemp: any, creditorsCases: any) {
    const allEmails = Array<string>();
    allEmails.push(caseTemp?.debtor?.basicInformation.email);
    allEmails.push(caseTemp?.creditor?.basicInformation.email);
    for (const contact of caseTemp.debtor.contacts) {
      allEmails.push(contact.email);
    }
    for (const contact of caseTemp.creditor.contacts) {
      allEmails.push(contact.email);
    }

    for (const caseTemp of creditorsCases) {
      allEmails.push(caseTemp.creditor.basicInformation.email);
    }

    return allEmails.filter(str => str.trim() !== '');
  }

  async createTranscript(recordingSID: string) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const transcript = await client.intelligence.v2.transcripts.create({
      channel: {"media_properties":{
          "source_sid": recordingSID
       }},
     serviceSid: process.env.TWILIO_Service_SID,
    });
    return transcript.links.sentences;
  }
}
export default new CaseUtil();
