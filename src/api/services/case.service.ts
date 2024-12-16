import {Request} from 'express';
import {DataCopier} from '../../utils/dataCopier.util';
import asyncLocalStorage from '../../utils/localStorage.util';
import { Twilio } from 'twilio';
import { UserRepository } from '../repository/user/user.repository';
import {CaseRepository} from '../repository/case/case.repository';
import caseUtil from '../../utils/case.util';
import {IContact} from '../../database/interfaces/contact.interface';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import {Case} from '../../database/repomodels/case.repomodel';
import {ICase} from '../../database/interfaces/case.interface';
import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';
import DebtorService from './debtor.service';
import CreditorService from './creditor.service';
import {ITargetCustomFields} from '../../database/interfaces/customField.interface';
import {TargetCFRepository} from '../repository/targetCustomFields/targetCF.repository';
import {PaymentRepository} from '../repository/payment/payment.repository';
import {IPayment} from '../../database/interfaces/payment.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import mongoose from 'mongoose';
import {ChatSummary} from '../../database/repomodels/chatSummary.repomodel';
import {ChatSummaryRepository} from '../repository/chatSummary/chatSummary.repository';
import {IChatSummary} from '../../database/interfaces/chatSummary.interface';
import {IUser} from '../../database/interfaces/user.interface';
import commonUtil from '../../utils/common.util';
import {StrategyRepository} from '../repository/strategy/strategy.repository';
import {IStrategy} from '../../database/interfaces/strategy.interface';
import creditorUtil from '../../utils/creditor.util';
import emailUtil from '../../utils/email.util';
import {ICaseHistory} from '../../database/interfaces/caseHistory.interface';
import {CaseHistoryRepository} from '../repository/caseHistory/caseHistory.repository';
import {Justification} from '../../database/repomodels/justification.repomodel';
import {JustificationRepository} from '../repository/justification/justification.repository';
import {IJustification} from '../../database/interfaces/justification.interface';
import {Creditor} from '../../database/repomodels/creditor.repomodel';
import {BulkUploadRepository} from '../repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../../database/interfaces/bulkUpload.interface';
import debtorUtil from '../../utils/debtor.util';
import moneyThumbUtil from '../../utils/moneyThumb.util';
import {Inbox} from '../../database/repomodels/inbox.repomodel';
import {IInbox} from '../../database/interfaces/inbox.interface';
import {InboxRepository} from '../repository/inbox/inbox.repository';
import {v4} from 'uuid';
const {
  jwt: {AccessToken},
} = require('twilio');
const VoiceGrant = AccessToken.VoiceGrant;

class CaseService {
  private twilioClient: any;
  private caseRepository: CaseRepository;
  private uploadUtil: UploadUtil;
  private targetCFRepository: TargetCFRepository;
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private chatSummaryRepository: ChatSummaryRepository;
  private userRepository: UserRepository;
  private strategyRepository: StrategyRepository;
  private caseHistoryRepository: CaseHistoryRepository;
  private justificationRepository: JustificationRepository;
  private bulkUploadRepository: BulkUploadRepository;
  private inboxRepository: InboxRepository;
  constructor() {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.caseRepository = new CaseRepository();
    this.uploadUtil = new UploadUtil();
    this.targetCFRepository = new TargetCFRepository();
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.chatSummaryRepository = new ChatSummaryRepository();
    this.userRepository = new UserRepository();
    this.strategyRepository = new StrategyRepository();
    this.caseHistoryRepository = new CaseHistoryRepository();
    this.justificationRepository = new JustificationRepository();
    this.bulkUploadRepository = new BulkUploadRepository();
    this.inboxRepository = new InboxRepository();
  }
  createCase = async (req: Request): Promise<[boolean, {} | string]> => {
    const reqTemp: any = req;
    if (req.query.bulk === 'true') {
      const casesArray = [];
      for (const tempCase of req.body.cases) {
        const checkCasePayment = await caseUtil.checkCasePayment(tempCase);
        if (!checkCasePayment[0]) return checkCasePayment;
        const result = await caseUtil.createCase(
          tempCase,
          reqTemp.role,
          reqTemp.email
        );
        if (result[0]) {
          casesArray.push(result[1]);
        }
      }
      if (!casesArray.length)
        return [false, constantsUtil.failureAddMessage('cases')];
      return [true, casesArray];
    }
    const checkCasePayment = await caseUtil.checkCasePayment(req.body);
    if (!checkCasePayment[0]) return checkCasePayment;
    const result = await caseUtil.createCase(
      req.body,
      reqTemp.name,
      reqTemp.id
    );
    if (!result[0]) return [false, result[1] as string];
    return [true, result[1]];
  };

  getAllCases = async (req: Request): Promise<[boolean, ICase[] | string]> => {
    let cases = await this.caseRepository.getAll<ICase>(
      {isDeleted: false},
      undefined,
      undefined,
      {_id: -1},
      undefined,
      undefined,
      Number(req.query.page),
      Number(req.query.limit)
    );
    if (!cases.length) {
      return [false, constantsUtil.notFoundMessage('Cases')];
    }
    // for (let temp of cases) {
    //   for (let doc of temp.documents) {
    //     const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
    //     doc.url = url;
    //   }
    // }
    return [true, cases];
  };

  getCaseById = async (req: Request): Promise<[boolean, ICase | string]> => {
    let findCase: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'creditor'}, {path: 'debtor'}]
    );
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    if (
      !findCase?.getCaseIdPercentage &&
      !findCase?.debtor?.strategy1MaxProfit &&
      !findCase?.debtor?.strategy3MaxProfit
    ) {
      await moneyThumbUtil.run(
        findCase.debtor,
        await debtorUtil.normalizeCompanyName(
          findCase.debtor.businessInformation.companyName
        )
      );
      this.caseRepository.updateById<ICase>(req.params.id, {
        getCaseIdPercentage: true,
      });
    }
    const amountNotDelivered = await this.getAmountNotDeliveredToCreditor(
      req.params.id
    );
    const amountDelivered = await this.getAmountNotDeliveredToCreditor(
      req.params.id
    );
    for (let doc of findCase.debtor.documents) {
      const url = await this.uploadUtil.getS3FileSignedUrl(
        doc.key
        //'application/pdf'
      );
      doc.url = url;
    }
    const cases: any = await caseUtil.getAllCreditorsOfDebtorForCase(
      findCase.debtor._id,
      findCase.creditor._id
    );
    // const creditors: any = cases.map(caseTemp => {
    //   return caseTemp.creditor;
    // });
    const uniqueResult: any = Array.from(
      new Map(
        cases.map(caseTemp => [String(caseTemp.creditor._id), caseTemp])
      ).values()
    );
    const temp = await this.targetCFRepository.getOne<ITargetCustomFields>({
      target: 'case',
      caseId: req.params.id,
    });
    // await debtorUtil.updateDebtorTotalCommission(findCase.debtor);
    const updateNotesForm =
      findCase.notes.length !== 0
        ? await Promise.all(
            findCase.notes.map(async note => {
              const userName = await this.userRepository.getById<IUser>(
                note.userId
              );
              return {
                ...note,
                userName: userName?.name ?? 'Unknown User', // Add a default name if user is not found
              };
            })
          )
        : [];

    findCase['creditors'] = uniqueResult;
    findCase['customFields'] = temp ? temp.customFields : [];
    findCase['notes'] = updateNotesForm ?? [];
    findCase['amountDeliveredToCreditor'] = amountDelivered;
    findCase['amountNotDeliveredToCreditor'] = amountNotDelivered;
    return [true, findCase];
  };

  async getAmountDeliveredToCreditor(caseId: string) {
    const getPayments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        authorized: 'Success',
        captured: 'Success',
        sendViaPaynote: 'Success',
        caseId: caseId,
        isDeleted: false,
      });
    return getPayments.reduce((sum, obj) => sum + obj.amount, 0);
  }

  async getAmountNotDeliveredToCreditor(caseId: string) {
    const getPayments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        authorized: 'Success',
        captured: 'Success',
        sendViaPaynote: 'Pending',
        caseId: caseId,
        isDeleted: false,
      });
    return getPayments.reduce((sum, obj) => sum + obj.amount, 0);
  }

  updateCase = async (req: Request): Promise<[boolean, ICase | string]> => {
    let reqTemp: any = req;
    let findCase: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    if (!findCase) return [false, constantsUtil.notFoundMessage('case')];
    const getDebtor = findCase.debtor;
    if (req.body.creditor) {
      const getCreditor = await this.creditorRepository.getById<ICreditor>(
        req.body.creditor._id
      );

      if (!getCreditor) {
        return [false, constantsUtil.notFoundMessage('creditor')];
      }
      if (req.body.creditor.businessInformation) {
        const alreadyPresent = await this.creditorRepository.getOne<ICreditor>({
          _id: {$ne: req.body.creditor._id},
          'businessInformation.companyName':
            req.body.creditor.businessInformation.companyName,
        });
        if (alreadyPresent) {
          return [
            false,
            constantsUtil.alreadyExistsMessage(
              `Creditor with companyName ${req.body.creditor.businessInformation.companyName}`
            ),
          ];
        }
        req.body.creditor.updatedAt = commonUtil.getCurrentDate();
        await this.creditorRepository.updateById<ICreditor>(
          req.body.creditor._id,
          req.body.creditor
        );
      }
      await caseUtil.updateCreditor(req.body.creditor as ICreditor);
      delete req.body.creditor;
    }
    if (
      req.body?.intervals &&
      req.body?.intervals.length &&
      findCase.intervals.length
    ) {
      return [false, 'Payment plan already exist!'];
    }

    if (req.body?.intervals?.length && req.body?.commission) {
      // let weeklyBudgetObj: {
      //   status: boolean;
      //   commission: number;
      //   totalCommission: number;
      // };
      // if (req.body.feePayment && req.body.feePayment === 'toPay') {
      //   weeklyBudgetObj = await caseUtil.checkWeeklyBudget(
      //     req.body,
      //     true,
      //     findCase.debtor
      //   );
      // if (!weeklyBudgetObj.status) {
      //   return [
      //     false,
      //     'Weekly budget is not fulfiling the payment plan of debtor',
      //   ];
      // }
      //   await this.debtorRepository.updateById<IDebtor>(findCase.debtor._id, {
      //     totalCommission: weeklyBudgetObj.totalCommission,
      //     weeklyCommission: weeklyBudgetObj.commission,
      //   });
      // }
      if (!getDebtor?.intervals && !getDebtor.intervals?.length) {
        await this.debtorRepository.updateById<IDebtor>(findCase.debtor._id, {
          weeklyCommission: req.body.commission,
          updatedAt: commonUtil.getCurrentDate(),
        });
      }
      findCase.intervals = req.body?.intervals;
      findCase.isExempt = req.body.isExempt;
      const checkCasePayment = await caseUtil.checkCasePayment(findCase);
      if (!checkCasePayment[0]) return checkCasePayment;
    }
    req.body.updatedAt = commonUtil.getCurrentDate();
    if (req.body.paidAmount && req.body.paidAmount > 0) {
      req.body.remaining = req.body.totalDebt - req.body.paidAmount;
      if (req.body.remaining < 0) req.body.remaining = 0;
      req.body.remainingAmountPaid = req.body.paidAmount;
    }
    if (req.body?.paidAmount && req.body.paidAmount === 0)
      req.body.remainingAmountPaid = 0;
    let caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    await caseUtil.addInHistory(
      {
        Time: new Date(commonUtil.getCurrentDate()),
        Action: 'Case Updated',
        'Updated By': reqTemp.name,
      },
      caseUpdated._id
    );
    if (req.body.intervals && req.body.intervals.length) {
      caseUtil.createPayment(caseUpdated);
    }
    // await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, false, true);
    // if (req.body.intervals) {
    //   await caseUtil.createPayment(caseUpdated);
    // }
    caseUpdated = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    const allStrategyFalse = await this.caseRepository.updateById<ICase>(
      caseUpdated._id,
      {
        strategyOne_1: false,
        strategyOne_2: false,
        strategyOne_3: false,
        strategyTwo: false,
        strategyThree: false,
        justifications: false,
        lumpSumJustifications: false,
        fullProfitJustifications: false,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    if (allStrategyFalse) {
      const response = await caseUtil.getAllCreditorsOfDebtor(getDebtor);
      const creditors = Array.from(
        new Map(
          response.map(creditor => [creditor.creditorId, creditor])
        ).values()
      );
      let extractedFieldsTemp = null;
      if (!getDebtor?.extractedFields && !getDebtor?.extractedFields?.length) {
        const extractedFields = await caseUtil.getExtractionMCA(getDebtor);
        if (extractedFields) {
          this.debtorRepository.updateById(getDebtor._id, {
            extractedFields: extractedFields.extracted_fields,
            updatedAt: commonUtil.getCurrentDate(),
          });
          extractedFieldsTemp = extractedFields.extracted_fields;
        }
      }
      caseUtil.getCreditorNames(
        getDebtor,
        getDebtor.extractedFields
          ? getDebtor.extractedFields
          : extractedFieldsTemp,
        String(findCase._id)
      );
      caseUtil.getScoresForAllCreditors(
        caseUpdated,
        creditors,
        getDebtor.commissionPercentage
      );
      caseUtil.getSettlementRange(findCase);
      caseUtil.getLumpSumAmount(caseUpdated);
      // caseUtil.getFullProfitSettlement(caseUpdated);
    }
    return [true, caseUpdated];
  };

  updateCaseAbout = async (
    req: Request
  ): Promise<[boolean, ICase | string]> => {
    let reqTemp: any = req;
    let findCase = await this.caseRepository.getById<ICase>(req.params.id);
    if (!findCase) return [false, constantsUtil.notFoundMessage('case')];
    req.body.updatedAt = commonUtil.getCurrentDate();
    const caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    // await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, true, false);
    await caseUtil.addInHistory(
      {
        Time: new Date(commonUtil.getCurrentDate()),
        Action: 'Case Updated',
        'Updated By': reqTemp.name,
      },
      caseUpdated._id
    );
    return [true, caseUpdated];
  };

  async deleteCase(req: Request): Promise<[boolean, boolean | string]> {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) return [false, constantsUtil.notFoundMessage('case')];
    if (caseTemp?.intervals?.length) {
      return [false, constantsUtil.failureDeleteMessage('case with payments')];
    }
    const result = await this.caseRepository.updateById<ICase>(req.params.id, {
      isDeleted: true,
      updatedAt: commonUtil.getCurrentDate(),
    });
    if (!result) {
      return [false, constantsUtil.failureDeleteMessage('case')];
    }
    return [true, true];
  }

  // getAIIntegrationData = async (
  //   req: Request
  // ): Promise<[boolean, {} | string]> => {
  //   const caseTemp = await this.caseRepository.getById<ICase>(
  //     req.params.id,
  //     undefined,
  //     undefined,
  //     ['debtor']
  //   );
  //   const response = await caseUtil.getAIWrapperData(req, caseTemp);
  //   return [true, response];
  // };

  getSummary = async (req: Request) => {
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    const response = await caseUtil.getSummary(req, caseTemp);
    if (response[0]) {
      const newSummary = new ChatSummary();
      newSummary.chatId = caseTemp.chatId;
      newSummary.prompt = req.body.humanInput;
      newSummary.chat = response[1];
      await this.chatSummaryRepository.create(newSummary as any);
    }
    return response;
  };

  getAIToken = async (req: Request): Promise<[boolean, {} | string]> => {
    const response = await caseUtil.getAIToken('test', 'test');
    return [true, response];
  };

  getCaseSummaries = async (
    req: Request
  ): Promise<[boolean, IChatSummary[] | string]> => {
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      'chatId',
      undefined,
      ['debtor']
    );
    const response =
      await this.chatSummaryRepository.getAllWithoutPagination<IChatSummary>(
        {
          chatId: caseTemp.chatId,
        },
        undefined,
        undefined
      );
    if (!response.length) {
      return [false, constantsUtil.notFoundMessage('Summaries')];
    }
    return [true, response];
  };

  getCreditorNames = async (
    req: Request
  ): Promise<[boolean, {} | [] | string]> => {
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    const response = await caseUtil.getAllCreditorsOfDebtor(
      caseTemp.debtor as any
    );
    const uniqueResult = Array.from(
      new Map(
        response.map(creditor => [creditor.creditorId, creditor])
      ).values()
    );
    return [true, uniqueResult];
  };

  getScores = async (req: Request) => {
    const caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    let getScores = null;
    if (req.body.creditorNames.length) {
      const cases: any =
        await this.caseRepository.getAllWithoutPagination<ICase>(
          {creditor: {$in: req.body.creditorNames}},
          undefined,
          undefined,
          {_id: -1},
          ['creditor']
        );
      const creditors = cases.map(obj => ({
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
      }));
      getScores = await caseUtil.getScores(
        caseTemp,
        creditors,
        caseTemp.debtor.commissionPercentage
      );
    }
    return getScores;
  };

  getSettlementRange = async (
    req: Request
  ): Promise<[boolean, {} | [] | string]> => {
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    const response = await caseUtil.getSettlementRange(caseTemp);
    return [true, response];
  };

  getCreditorHistory = async (
    req: Request
  ): Promise<[boolean, {} | [] | string]> => {
    if (!String(req.query.creditorId)) {
      return [false, 'Creditor id is missing'];
    }
    const response = await caseUtil.getCreditorHistory(req);
    return [true, response];
  };

  createCreditorsCases = async (req: Request) => {
    const reqTemp: any = req;

    let dataArray = req.body.data;
    for (const body of dataArray) {
      const checkCasePayment = await caseUtil.checkCasePayment(body);
      if (!checkCasePayment[0]) return checkCasePayment;
    }
    const result = await caseUtil.createCreditorsCases(
      req.body,
      reqTemp.name,
      reqTemp.id,
      req.params.id
    );
    // if (!result[0]) return result;
    return result;
  };

  getScoresSettlementRange = async (
    all: string,
    hardReload: string,
    body: any,
    caseId: string
  ) => {
    console.log(caseId, 'llklklk');
    const caseTemp: any = await this.caseRepository.getById<ICase>(
      caseId,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!caseTemp) return [false, constantsUtil.notFoundMessage('case')];
    let getScores = null,
      creditorNames = null;
    let creditors = null;
    let settlementRange = null;
    // let hardReload = 'false';
    let data = {};
    // if (req.query.hardReload && req.query.hardReload === 'true')
    //   hardReload = 'true';
    const moneyThumb = await debtorUtil.getScoreCard(caseTemp.debtor);
    if (hardReload === 'true') {
      await this.caseRepository.updateById<ICase>(caseTemp._id, {
        strategyTwo: false,
        strategyThree: false,
        justifications: false,
        lumpSumJustifications: false,
        fullProfitJustifications: false,
        updatedAt: commonUtil.getCurrentDate(),
      });
      await moneyThumbUtil.saveData(
        moneyThumb.appid,
        moneyThumb.scoreCard,
        caseTemp.debtor
      );
      caseTemp.debtor = await debtorUtil.saveWeeklyBudget(caseTemp, body);
    }
    const debtor: any = caseTemp.debtor;
    creditors = await caseUtil.getAllCreditorsOfDebtor(debtor as any);
    creditors = await creditorUtil.checkCreditorsMapping(creditors);
    creditors = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorAccountTitle, creditor])
      ).values()
    );
    const commisionPercentage =
      await creditorUtil.addCreditorPercentagesAndGetPercentageCommission(
        creditors,
        debtor,
        moneyThumb.scoreCard
      );
    await creditorUtil.addBreakEven(creditors);
    data['percentageReceivableCommission'] = commisionPercentage[0];
    data['maxProfitCommission'] = commisionPercentage[1];
    data['percentageReceivableCommissionAmount'] = commisionPercentage[2];
    data['totalCommission'] = debtor.totalCommission;
    data['creditorsContractDetailsSum'] =
      await this.calculateContractDetailsSum(creditors);
    const result = await this.strategyRepository.getOne<IStrategy>({
      caseId: String(caseTemp._id),
      name: 'strategy_one',
    });
    data['creditors'] = creditors;
    data['debtor'] = debtor;
    // return [true, data];
    const values = await moneyThumbUtil.getMonthlyProfitValues(
      moneyThumb.scoreCard,
      debtor
    );
    data['averageMonthlyProfitExcludingPayments'] =
      values.averageMonthlyProfitExcludingPayments;
    data['averageMonthlyProfitIncludingPayments'] =
      values.averageMonthlyProfitIncludingPayments;
    data['currentMonthlyProfitExcludingPayments'] =
      values.currentMonthlyProfitExcludingPayments;
    data['currentMonthlyProfitIncludingPayments'] =
      values.currentMonthlyProfitIncludingPayments;
    if (
      hardReload !== 'true' &&
      caseTemp.strategyOne_1 &&
      result?.data?.creditorNames
    ) {
      creditorNames = result.data.creditorNames;
      data['creditorNames'] = creditorNames;
    }
    if (hardReload === 'true') {
      let extractedFieldsTemp = [];
      if (!debtor?.extractedFields?.length) {
        const extractedFields = await caseUtil.getExtractionMCA(debtor);
        if (extractedFields) {
          this.debtorRepository.updateById(debtor._id, {
            extractedFields: extractedFields.extracted_fields,
            updatedAt: commonUtil.getCurrentDate(),
          });
          extractedFieldsTemp = extractedFields.extracted_fields;
        }
      }
      creditorNames = await caseUtil.getCreditorNames(
        debtor,
        debtor.extractedFields ? debtor.extractedFields : extractedFieldsTemp,
        String(caseTemp._id)
      );
      data['creditorNames'] = creditorNames;
      if (typeof creditorNames === 'string') {
        data['getScores'] = null;
        data['settlementRange'] = await moneyThumbUtil.getSettlementValues(
          debtor,
          creditors,
          moneyThumb.scoreCard,
          caseId
        );
        return [true, data];
      }
    }
    if (all === 'true') {
      if (
        hardReload !== 'true' &&
        caseTemp.strategyOne_2 &&
        result?.data?.getScoresAIForAllCreditors
      ) {
        getScores = result.data.getScoresAIForAllCreditors;
        data['getScores'] = getScores;
      } else {
        getScores = await caseUtil.getScoresForAllCreditors(
          caseTemp,
          creditors,
          debtor.commissionPercentage
        );
        data['getScores'] = getScores;
        if (typeof getScores === 'string') {
          data['settlementRange'] = await moneyThumbUtil.getSettlementValues(
            debtor,
            creditors,
            moneyThumb.scoreCard,
            caseId
          );
          return [true, data];
        }
        data['debtor'] = await this.debtorRepository.getById<IDebtor>(
          debtor._id
        );
      }
    } else {
      if (body.creditorNames.length) {
        const casesCreditors: any =
          await this.caseRepository.getAllWithoutPagination<ICase>(
            {creditor: {$in: body.creditorNames}, debtor: debtor},
            undefined,
            undefined,
            {_id: -1},
            ['creditor']
          );
        getScores = await caseUtil.getScores(
          caseTemp,
          casesCreditors,
          debtor.commissionPercentage
        );
        data['getScores'] = getScores;
        if (typeof getScores === 'string') {
          data['settlementRange'] = await moneyThumbUtil.getSettlementValues(
            debtor,
            creditors,
            moneyThumb.scoreCard,
            caseId
          );
          return [true, data];
        }
        data['debtor'] = await this.debtorRepository.getById<IDebtor>(
          debtor._id
        );
      }
    }
    if (
      hardReload !== 'true' &&
      caseTemp.strategyOne_3 &&
      result?.data?.settlementRange
    ) {
      settlementRange = result.data.settlementRange;
    } else {
      settlementRange = await caseUtil.getSettlementRange(caseTemp);
      if (typeof settlementRange === 'string') {
        settlementRange = await moneyThumbUtil.getSettlementValues(
          debtor,
          creditors,
          moneyThumb.scoreCard,
          caseId
        );
      }
    }
    await creditorUtil.addWeeklyTrueAmount(creditors, settlementRange);
    await creditorUtil.replaceSettlementRangeAndWeeksTillPaid(
      creditors,
      settlementRange,
      caseId
    );
    data['settlementRange'] = settlementRange;
    return [true, data];
  };

  addNotes = async (req: Request): Promise<[boolean, ICase | string]> => {
    let result;
    const reqTemp: any = req;
    let findCase: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );

    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    let Action = 'Add Notes';
    const notes = req.body.notes;
    if (typeof findCase.notes === 'string') {
      result = await this.caseRepository.updateById<ICase>(req.params.id, {
        $set: {
          notes: [
            {
              userId: reqTemp.id,
              value: notes,
              createdAt: commonUtil.getCurrentDate(),
            },
          ],
        },
        updatedAt: commonUtil.getCurrentDate(),
      });
      Action = 'Update Notes';
    } else result = await caseUtil.addNotes(req, reqTemp.id);

    if (!result) return [false, result];
    // await emailUtil.sendEmailOrSmsByEvent(
    //   'case_details_update',
    //   result._id,
    //   '',
    //   reqTemp.id
    // );
    await caseUtil.addInHistory(
      {
        Action,
        Username: reqTemp.name,
        Content: notes,
        Time: new Date(commonUtil.getCurrentDate()),
      },
      findCase._id
    );
    return [true, result];
  };


  createCall = async (req: Request): Promise<[boolean, ICase | string]> => {
    const reqTemp: any = req;
    const findCase: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    const callData = {
      from: '+17756307412',
      to: reqTemp.body.toNumber, // For testing Purposes Added My Number
      url: 'https://debt-staging.hpdemos.co/api/v1/case/twilio/voice',
      record: true,
      statusCallback: 'https://7276-139-135-36-105.ngrok-free.app/api/v1/case/twilio/recording-status',
      statusCallbackEvent: ['completed'],
    };
    try {
      const call = await this.twilioClient.calls.create(callData);
      console.log("Call", call);
      const result = await this.caseRepository.updateById<ICase>(req.params.id, {
        $push: {
          calls: {
            callSid: call.sid,
            callerName: reqTemp.name,
            accountSid: call.accountSid,
            callTo: call.to,
            callFrom: call.from,
            callStartDate: call.startTime,
            callDuration: null, // Placeholder for later update
            callStatus: 'initiated', // Initial status
            callRecordingSid: '',
            callTranscription: '',

          },
        },
        updatedAt: commonUtil.getCurrentDate(),
      });
      
      if (!result) return [false, 'Failed to update case with call SID'];
      return [true, call.sid];
    } catch (err) {
      console.log("Error Creating Call", err);
      return [false, 'Error creating call.'];
    }
  };
  
  getCalls = async (req: Request) => {
    const findCase: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{ path: 'debtor' }]
    );
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    if (!Array.isArray(findCase.calls) || findCase.calls.length === 0) {
      return [true, []]; 
    }
    return [true, findCase.calls] 
  };

  callTwiml = async (req: Request) => {
    const ADJECTIVES = [
      "Awesome",
      "Bold",
      "Creative",
      "Dapper",
      "Eccentric",
      "Fiesty",
      "Golden",
      "Holy",
      "Ignominious",
      "Jolly",
      "Kindly",
      "Lucky",
      "Mushy",
      "Natural",
      "Oaken",
      "Precise",
      "Quiet",
      "Rowdy",
      "Sunny",
      "Tall",
      "Unique",
      "Vivid",
      "Wonderful",
      "Xtra",
      "Yawning",
      "Zesty",
    ];

    const FIRST_NAMES = [
      "Anna",
      "Bobby",
      "Cameron",
      "Danny",
      "Emmett",
      "Frida",
      "Gracie",
      "Hannah",
      "Isaac",
      "Jenova",
      "Kendra",
      "Lando",
      "Mufasa",
      "Nate",
      "Owen",
      "Penny",
      "Quincy",
      "Roddy",
      "Samantha",
      "Tammy",
      "Ulysses",
      "Victoria",
      "Wendy",
      "Xander",
      "Yolanda",
      "Zelda",
    ];
    
    const LAST_NAMES = [
      "Anchorage",
      "Berlin",
      "Cucamonga",
      "Davenport",
      "Essex",
      "Fresno",
      "Gunsight",
      "Hanover",
      "Indianapolis",
      "Jamestown",
      "Kane",
      "Liberty",
      "Minneapolis",
      "Nevis",
      "Oakland",
      "Portland",
      "Quantico",
      "Raleigh",
      "SaintPaul",
      "Tulsa",
      "Utica",
      "Vail",
      "Warsaw",
      "XiaoJin",
      "Yale",
      "Zimmerman",
    ];
    const isAValidPhoneNumber = (number) => {
      return /^[\d\+\-\(\) ]+$/.test(number);
    }
    
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomGenerator = () => rand(ADJECTIVES) + rand(FIRST_NAMES) + rand(LAST_NAMES);
  let identity = randomGenerator();
  const toNumberOrClientName = req.body.To;
  const callerId = req.body.From;
  const VoiceResponse = require("twilio").twiml.VoiceResponse;
  let twiml = new VoiceResponse();

  // If the request to the /voice endpoint is TO your Twilio Number, 
  // then it is an incoming call towards your Twilio.Device.
  if (toNumberOrClientName == callerId) {
    let dial = twiml.dial();

    // This will connect the caller with your Twilio.Device/client 
    dial.client(identity);

  } else if (req.body.To) {
    // This is an outgoing call

    // set the callerId
    let dial = twiml.dial({ callerId });

    // Check if the 'To' parameter is a Phone Number or Client Name
    // in order to use the appropriate TwiML noun 
    const attr = isAValidPhoneNumber(toNumberOrClientName)
      ? "number"
      : "client";
    dial[attr]({}, toNumberOrClientName);
  } else {
    twiml.say("Thanks for calling!");
  }

  return [true, twiml.toString()];

    // try {
    //   console.log(req, 'hello request')
    //   const VoiceResponse  = require('twilio').twiml.VoiceResponse;
    //   console.log("VoiceResponse", VoiceResponse)
    //   if (!VoiceResponse) {
    //     throw new Error('Twilio VoiceResponse is not available.');
    //   }
    //   const response = new VoiceResponse();
    //   console.log("Response", response)
  
    //   // Configure recording and transcription
    //   response.record({
    //     transcribe: true,
    //     transcribeCallback: 'https://7276-139-135-36-105.ngrok-free.app/api/v1/case/twilio/transcription-status',
    //   });
  
    //   // Return successful response
    //   return [true, response.toString()];
    // } catch (err) {
    //   console.error('Error generating TwiML:', err);
    //   return [false, 'Error generating TwiML.'];
    // }
  };    
  
  callTranscriptionStatus = async (req: Request) => {
    try {
      const callSid = req.body.CallSid;
      const transcriptionText = req.body.TranscriptionText;
      const result = await this.caseRepository.updateByOne(
        { 'calls.callSid': callSid }, 
        {
          $set: {
            'calls.$.callTranscription': transcriptionText
          },
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      if (!result) {
        return [false, 'Failed to update case with recording details.'];
      }
      return [true, 'Recording status received and updated successfully.'];
    } catch (err) {
      return [false, 'Error handling recording status.'];
    }

  }


  callHangUp = async (req: Request) => {
    try {
      const callSid = req.params.callSid;
      if (!callSid) {
        return [false, 'Call SID is required.'];
      }
      await this.twilioClient.calls(callSid).update({ status: 'completed' });
      return [true, 'Call hung up successfully.'];
    } catch (err) {
      console.error('Error hanging up the call:', err);
      return [false, 'Error hanging up the call.'];
    }
  };

  getToken = async (req: Request) => {
    const ADJECTIVES = [
      "Awesome",
      "Bold",
      "Creative",
      "Dapper",
      "Eccentric",
      "Fiesty",
      "Golden",
      "Holy",
      "Ignominious",
      "Jolly",
      "Kindly",
      "Lucky",
      "Mushy",
      "Natural",
      "Oaken",
      "Precise",
      "Quiet",
      "Rowdy",
      "Sunny",
      "Tall",
      "Unique",
      "Vivid",
      "Wonderful",
      "Xtra",
      "Yawning",
      "Zesty",
    ];

    const FIRST_NAMES = [
      "Anna",
      "Bobby",
      "Cameron",
      "Danny",
      "Emmett",
      "Frida",
      "Gracie",
      "Hannah",
      "Isaac",
      "Jenova",
      "Kendra",
      "Lando",
      "Mufasa",
      "Nate",
      "Owen",
      "Penny",
      "Quincy",
      "Roddy",
      "Samantha",
      "Tammy",
      "Ulysses",
      "Victoria",
      "Wendy",
      "Xander",
      "Yolanda",
      "Zelda",
    ];
    
    const LAST_NAMES = [
      "Anchorage",
      "Berlin",
      "Cucamonga",
      "Davenport",
      "Essex",
      "Fresno",
      "Gunsight",
      "Hanover",
      "Indianapolis",
      "Jamestown",
      "Kane",
      "Liberty",
      "Minneapolis",
      "Nevis",
      "Oakland",
      "Portland",
      "Quantico",
      "Raleigh",
      "SaintPaul",
      "Tulsa",
      "Utica",
      "Vail",
      "Warsaw",
      "XiaoJin",
      "Yale",
      "Zimmerman",
    ];
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomGenerator = () => rand(ADJECTIVES) + rand(FIRST_NAMES) + rand(LAST_NAMES);
    let identity = randomGenerator();
    const AccessToken = require("twilio").jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
  const accessToken = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );
  console.log(accessToken, 'accessToken1')
  accessToken.identity = "user";
  console.log(accessToken, 'accessToken2')
  const grant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
    incomingAllow: true,
  });
  accessToken.addGrant(grant);

  // Include identity and token in a JSON response
   return [true, {
    identity: "user",
    token: accessToken.toJwt(),
  }];
  }


  callRecordingStatus = async (req: Request) => {
    try {
      const callSid = req.body.CallSid;
      const recordingSid = req.body.RecordingSid;
      const status = req.body.CallStatus;
      const callDuration = req.body.RecordingDuration;
      const callStartTime = req.body.Timestamp;
      const result = await this.caseRepository.updateByOne(
        { 'calls.callSid': callSid }, 
        {
          $set: {
            'calls.$.callRecordingSid': recordingSid,
            'calls.$.callDuration': callDuration,
            'calls.$.callStatus': status,
            'calls.$.callStartDate': callStartTime
          },
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
      if (!result) {
        return [false, 'Failed to update case with recording details.'];
      }
      return [true, 'Recording status received and updated successfully.'];
    } catch (err) {
      return [false, 'Error handling recording status.'];
    }
  };
  
  getScoresSettlementByCommPercentage = async (req: Request) => {
    if (
      !req.body.commissionPercentage ||
      isNaN(req.body.commissionPercentage)
    ) {
      return [false, 'Invalid commission percentage'];
    }
    const comm = Number(req.body.commissionPercentage);
    const caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!caseTemp) return [false, constantsUtil.notFoundMessage('case')];
    let getScores = null,
      creditorNames = null;
    let creditors = null;
    let settlementRange = null;
    let data = {};
    // caseTemp.debtor = await debtorUtil.saveWeeklyBudget(caseTemp, req.body);
    let debtor: any = caseTemp.debtor;
    const moneyThumb = await debtorUtil.getScoreCard(debtor);
    await moneyThumbUtil.saveData(
      moneyThumb.appid,
      moneyThumb.scoreCard,
      debtor
    );
    await this.caseRepository.updateById<ICase>(caseTemp._id, {
      strategyTwo: false,
      strategyThree: false,
      justifications: false,
      lumpSumJustifications: false,
      fullProfitJustifications: false,
      updatedAt: commonUtil.getCurrentDate(),
    });
    creditors = await caseUtil.getAllCreditorsOfDebtor(caseTemp.debtor as any);
    creditors = await creditorUtil.checkCreditorsMapping(creditors);
    creditors = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorAccountTitle, creditor])
      ).values()
    );
    const commisionPercentage =
      await creditorUtil.addCreditorPercentagesAndGetPercentageCommission(
        creditors,
        debtor,
        moneyThumb.scoreCard
      );
    await creditorUtil.addBreakEven(creditors);
    data['percentageReceivableCommission'] = commisionPercentage[0];
    data['percentageReceivableCommissionAmount'] = commisionPercentage[1];
    data['creditorsContractDetailsSum'] =
      await this.calculateContractDetailsSum(creditors);
    data['creditors'] = creditors;
    debtor = await this.debtorRepository.updateById<IDebtor>(debtor._id, {
      commissionPercentage: comm,
      updatedAt: commonUtil.getCurrentDate(),
    });
    await debtorUtil.updateDebtorTotalCommission(debtor);
    data['debtor'] = debtor;
    let extractedFieldsTemp = null;
    if (!debtor?.extractedFields && !debtor?.extractedFields?.length) {
      const extractedFields = await caseUtil.getExtractionMCA(debtor);
      if (extractedFields) {
        this.debtorRepository.updateById(debtor._id, {
          extractedFields: extractedFields.extracted_fields,
          updatedAt: commonUtil.getCurrentDate(),
        });
        extractedFieldsTemp = extractedFields.extracted_fields;
      }
    }
    creditorNames = await caseUtil.getCreditorNames(
      debtor,
      debtor.extractedFields ? debtor.extractedFields : extractedFieldsTemp,
      String(caseTemp._id)
    );
    data['creditorNames'] = creditorNames;
    if (typeof creditorNames === 'string') {
      data['getScores'] = null;
      data['settlementRange'] = null;
      return [true, data];
    }
    if (req.query.all === 'true') {
      getScores = await caseUtil.getScoresForAllCreditors(
        caseTemp,
        creditors,
        comm
      );
      data['getScores'] = getScores;
      if (typeof getScores === 'string') {
        data['settlementRange'] = null;
        return [true, data];
      }
      data['debtor'] = await this.debtorRepository.getById<IDebtor>(debtor._id);
    } else {
      if (req.body.creditorNames.length) {
        const casesCreditors: any =
          await this.caseRepository.getAllWithoutPagination<ICase>(
            {creditor: {$in: req.body.creditorNames}, debtor: debtor},
            undefined,
            undefined,
            {_id: -1},
            ['creditor']
          );
        getScores = await caseUtil.getScores(caseTemp, casesCreditors, comm);
        data['getScores'] = getScores;
        if (typeof getScores === 'string') {
          data['settlementRange'] = null;
          return [true, data];
        }
        data['debtor'] = await this.debtorRepository.getById<IDebtor>(
          debtor._id
        );
      }
    }
    settlementRange = await caseUtil.getSettlementRange(caseTemp);
    await creditorUtil.addWeeklyTrueAmount(creditors, settlementRange);
    data['settlementRange'] = settlementRange;
    return [true, data];
  };

  async calculateContractDetailsSum(creditors: any) {
    let payableAmount = 0;
    let loanAmount = 0;
    for (const creditor of creditors) {
      payableAmount += caseUtil.getCleanAmount(
        creditor?.contractDetails?.payable_amount
      );
      loanAmount += caseUtil.getCleanAmount(
        creditor?.contractDetails?.loan_amount
      );
    }
    return {payableAmount, loanAmount};
  }
  async sendCaseEmails(
    userId: string,
    previousCase: ICase,
    updatedCase: ICase,
    caseAbout: boolean,
    caseUpdate: boolean
  ) {
    if (caseAbout) {
      if (previousCase.caseOwnerId !== updatedCase.caseOwnerId) {
        await emailUtil.sendEmailOrSmsByEvent(
          'case_owner_changed',
          previousCase._id,
          '',
          userId
        );
      }
      if (previousCase.negotiatorId !== updatedCase.negotiatorId) {
        await emailUtil.sendEmailOrSmsByEvent(
          'case_negotiator_changed',
          previousCase._id,
          '',
          userId
        );
      }
      if (previousCase.managerId !== updatedCase.managerId) {
        await emailUtil.sendEmailOrSmsByEvent(
          'case_manager_changed',
          previousCase._id,
          '',
          userId
        );
      }
    }
    if (caseUpdate) {
      await emailUtil.sendEmailOrSmsByEvent(
        'case_details_update',
        previousCase._id,
        '',
        userId
      );
    }
  }

  async getWeeklyAndTotalCommission(req: Request) {
    const findCase = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    if (findCase.intervals.length) {
      return [false, 'Payment plan already exist!'];
    }
    findCase.intervals = req.body.intervals;

    let weeklyBudgetObj: {
      status: boolean;
      commission: number;
      totalCommission: number;
    };
    const debtor: any = findCase.debtor;
    weeklyBudgetObj = await caseUtil.checkWeeklyBudget(findCase, true, debtor);
    if (!weeklyBudgetObj.status) {
      return [
        false,
        'Weekly budget is not fulfiling the payment plan of debtor.Please updated weekly budget',
      ];
    }
    return [
      true,
      {
        commission: weeklyBudgetObj.commission,
        totalCommission: weeklyBudgetObj.totalCommission,
        commissionPercentage: debtor.commissionPercentage,
      },
    ];
  }

  async sendSettlementEmail(req: Request) {
    const {from, sendTo, subject, content, cc} = req.body;
    const threadId = v4();
    const buffer = await emailUtil.generatePdfFromHtml(content);
    const caseId = req.params.id;
    const caseTemp = await this.caseRepository.getById<ICase>(
      caseId,
      undefined,
      undefined,
      [
        {path: 'debtor', select: ['businessInformation.companyName']},
        {path: 'creditor', select: ['businessInformation.companyName']},
      ]
    );
    if (!caseTemp) return [false, constantsUtil.notFoundMessage('case')];
    const time = new Date(commonUtil.getCurrentDate());
    await caseUtil.addInHistory(
      {
        From: from,
        To: sendTo,
        Content: content,
        Time: time,
        Action: 'EMAIL',
        Subject: subject,
      },
      caseId
    );
    const emailData = {
      from,
      to: sendTo,
      subject,
      text: content,
      textAsHtml: content,
      cc: cc,
    };
    emailUtil.createInbox(caseTemp, 'sent', emailData, threadId);

    return await emailUtil.sendEmail(
      sendTo,
      from,
      subject,
      content,
      cc,
      buffer,
      caseId,
      threadId
    );
  }

  async caseHistory(req: Request) {
    const findCase = await this.caseRepository.getById<ICase>(req.params.id);
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    const result = await this.caseHistoryRepository.getOne<ICaseHistory>({
      caseId: req.params.id,
    });
    return [true, result?.caseHistory ?? []];
  }

  async saveJustification(req: Request) {
    req.body.updatedAt = commonUtil.getCurrentDate();
    const justification =
      await this.justificationRepository.upsert<IJustification>({}, req.body);
    if (!justification) {
      return [false, constantsUtil.notFoundMessage('justification')];
    }
    this.caseRepository.updateMany(
      {},
      {justifications: false, updatedAt: commonUtil.getCurrentDate()}
    );
    return [true, justification];
  }

  async calculateIntervalsAmount(req: Request) {
    const findCase = await this.caseRepository.getById<ICase>(req.params.id);
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    let amount = 0;
    for (const interval of findCase.intervals) {
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
    return [true, amount];
  }

  getSettlementJustifications = async (req: Request) => {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    // Commenting this Code, so everytime, it will pass this to Ai to get the justification.
    // if (caseTemp.justifications) {
    //   const result = await this.strategyRepository.getOne<IStrategy>({
    //     caseId: String(caseTemp._id),
    //     name: 'justifications',
    //   });
    //   if (result?.data?.justifications)
    //     return [true, result.data.justifications];
    // }
    const models = await caseUtil.getJustificationModels();
    const justifications = await caseUtil.getSettlementJustifications(
      caseTemp,
      models
    );
    return justifications;
  };

  deleteFile = async (req: Request) => {
    // Fetch the case and populate debtor field
    let caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );

    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }

    // Extract the key from the request body
    const {key} = req.body;
    if (!key) {
      return [false, 'Key is required in the request body.'];
    }

    // Update the debtor's documents by removing the document with the matching key
    const response: any = await this.debtorRepository.updateById(
      caseTemp.debtor._id,
      {
        $pull: {documents: {key}},
      }
    );

    if (response.documents.length === caseTemp.debtor.documents.length) {
      return [false, `No document found with key: ${key}`];
    }

    return [true, `${key} is deleted successfully`];
  };

  async updateContractDetails(req: Request) {
    const caseTemp = await this.caseRepository.getById(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    const updateCase = await this.caseRepository.updateById<ICase>(
      req.params.id,
      {$set: {[`contractDetails.${req.body.label}`]: req.body.value}}
    );
    if (!updateCase) {
      return [false, constantsUtil.failureUpdateMessage('contract details')];
    }
    return [true, updateCase];
  }
  deleteCreditor = async (req: Request) => {
    let caseTemp: any = await this.caseRepository.getById<ICase>(req.params.id);

    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }

    const updateCase = await this.caseRepository.updateById<ICase>(
      req.params.id,
      {isDeleted: true}
    );

    if (!updateCase.isDeleted) {
      return [false, constantsUtil.failureDeleteMessage('Creditor')];
    }

    return [true, constantsUtil.successDeleteMessage('Creditor')];
  };
}

export default CaseService;
