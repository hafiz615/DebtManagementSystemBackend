import {Request} from 'express';
import {DataCopier} from '../../utils/dataCopier.util';
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
import {UserRepository} from '../repository/user/user.repository';
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
class CaseService {
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
  constructor() {
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
        findCase.debtor.businessInformation.companyName
      );
      this.caseRepository.updateById<ICase>(req.params.id, {
        getCaseIdPercentage: true,
      });
    }
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
    await debtorUtil.updateDebtorTotalCommission(findCase.debtor);
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

    return [true, findCase];
  };

  updateCase = async (req: Request): Promise<[boolean, ICase | string]> => {
    let reqTemp: any = req;
    let findCase: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    if (!findCase) return [false, constantsUtil.notFoundMessage('case')];
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
      await this.debtorRepository.updateById<IDebtor>(findCase.debtor._id, {
        weeklyCommission: req.body.commission,
        updatedAt: commonUtil.getCurrentDate(),
      });
      findCase.intervals = req.body?.intervals;
      findCase.isExempt = req.body.isExempt;
      const checkCasePayment = await caseUtil.checkCasePayment(findCase);
      if (!checkCasePayment[0]) return checkCasePayment;
    }
    req.body.updatedAt = commonUtil.getCurrentDate();
    if (req.body.paidAmount) {
      req.body.remaining = req.body.totalDebt - req.body.paidAmount;
      if (req.body.remaining < 0) req.body.remaining = 0;
      req.body.remainingAmountPaid = req.body.paidAmount;
    }
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
    const getDebtor = findCase.debtor;
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

    const checkCasePayment = await caseUtil.checkCasePayment(req.body);
    if (!checkCasePayment[0]) return checkCasePayment;
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
      // await creditorUtil.addWeeklyTrueAmount(creditors, settlementRange);
      // await creditorUtil.replaceSettlementRangeAndWeeksTillPaid(
      //   creditors,
      //   settlementRange
      // );
      // data['settlementRange'] = settlementRange;
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
      // await creditorUtil.addWeeklyTrueAmount(creditors, settlementRange);
      // data['settlementRange'] = settlementRange;
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
    caseTemp.debtor = await debtorUtil.saveWeeklyBudget(caseTemp, req.body);
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
    const buffer = await emailUtil.generatePdfFromHtml(content);
    const caseId = req.params.id;
    const caseTemp = await this.caseRepository.getById<ICase>(caseId);
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
    return await emailUtil.sendEmail(
      sendTo,
      from,
      subject,
      content,
      cc,
      buffer,
      caseId
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
    if (caseTemp.justifications) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'justifications',
      });
      if (result?.data?.justifications)
        return [true, result.data.justifications];
    }
    const models = await caseUtil.getJustificationModels();
    const justifications = await caseUtil.getSettlementJustifications(
      caseTemp,
      models
    );
    return justifications;
  };
}

export default CaseService;
