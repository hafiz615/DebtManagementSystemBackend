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
      undefined,
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
    for (let doc of findCase.debtor.documents) {
      const url = await this.uploadUtil.getS3FileSignedUrl(
        doc.key
        //'application/pdf'
      );
      doc.url = url;
    }
    const creditors = await caseUtil.getAllCreditorsOfDebtor(
      findCase.debtor as any
    );
    const uniqueResult = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorId, creditor])
      ).values()
    );
    const temp = await this.targetCFRepository.getOne<ITargetCustomFields>({
      target: 'case',
      caseId: req.params.id,
    });

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

    const tempCase: any = findCase;
    tempCase['creditors'] = uniqueResult;
    tempCase['customFields'] = temp ? temp.customFields : [];
    tempCase['notes'] = updateNotesForm ?? [];

    return [true, tempCase];
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
        totalCommission: req.body.totalCommission,
        weeklyCommission: req.body.commission,
      });
    }
    const checkCasePayment = await caseUtil.checkCasePayment(req.body);
    if (!checkCasePayment[0]) return checkCasePayment;
    const caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    if (req.body.intervals && req.body.intervals.length) {
      caseUtil.createPayment(caseUpdated);
    }
    await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, false, true);
    // if (req.body.intervals) {
    //   await caseUtil.createPayment(caseUpdated);
    // }
    const getDebtor = findCase.debtor;
    const allStrategyFalse = await this.caseRepository.updateById<ICase>(
      caseUpdated._id,
      {
        strategyOne_1: false,
        strategyOne_2: false,
        strategyOne_3: false,
        strategyTwo: false,
        strategyThree: false,
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
      caseUtil.getSettlementRange(caseUpdated);
      caseUtil.getLumpSumAmount(caseUpdated);
      caseUtil.getFullProfitSettlement(caseUpdated);
    }
    return [true, caseUpdated];
  };

  updateCaseAbout = async (
    req: Request
  ): Promise<[boolean, ICase | string]> => {
    let reqTemp: any = req;
    let findCase = await this.caseRepository.getById<ICase>(req.params.id);
    if (!findCase) return [false, constantsUtil.notFoundMessage('case')];
    const caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, true, false);

    return [true, caseUpdated];
  };

  async deleteCase(req: Request): Promise<[boolean, boolean | string]> {
    // const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    const result = await this.caseRepository.updateById<ICase>(req.params.id, {
      isDeleted: true,
    });
    await this.paymentRepository.updateMany<IPayment>(
      {caseId: req.params.id},
      {isDeleted: true}
    );
    let weeklyBudgetObj: {
      status: boolean;
      commission: number;
      totalCommission: number;
    };
    weeklyBudgetObj = await caseUtil.getUpdatedCommAndTotalComm(
      String(result.debtor)
    );
    if (!weeklyBudgetObj.status) {
      return [
        false,
        'Weekly budget is not fulfiling the payment plan of debtor',
      ];
    }
    await this.debtorRepository.updateById<IDebtor>(String(result.debtor), {
      totalCommission: weeklyBudgetObj.totalCommission,
      weeklyCommission: weeklyBudgetObj.commission,
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
    const newSummary = new ChatSummary();
    newSummary.chatId = caseTemp.chatId;
    const validatedSummary = DataCopier.copy(newSummary, response);
    await this.chatSummaryRepository.create(validatedSummary);
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
      await this.chatSummaryRepository.getAllWithoutPagination<IChatSummary>({
        chatId: caseTemp.chatId,
      });
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
          undefined,
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
      req,
      reqTemp.name,
      reqTemp.id
    );
    // if (!result[0]) return result;
    return result;
  };

  getScoresSettlementRange = async (req: Request) => {
    if (!req.query.all) {
      return [false, 'Query param missing'];
    }
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!caseTemp) return [false, constantsUtil.notFoundMessage('case')];
    const debtor: any = caseTemp.debtor;
    let getScores = null,
      creditorNames = null;
    let creditors = null;
    let settlementRange = null;
    let hardReload = 'false';
    let data = {};
    if (req.query.hardReload && req.query.hardReload === 'true')
      hardReload = 'true';
    creditors = await caseUtil.getAllCreditorsOfDebtor(debtor as any);
    creditors = await creditorUtil.checkCreditorsMapping(creditors);
    creditors = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorAccountTitle, creditor])
      ).values()
    );
    const result = await this.strategyRepository.getOne<IStrategy>({
      caseId: String(caseTemp._id),
      name: 'strategy_one',
    });
    data['creditors'] = creditors;
    data['debtor'] = debtor;
    if (
      hardReload !== 'true' &&
      caseTemp.strategyOne_1 &&
      result.data.creditorNames
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
    }
    if (req.query.all === 'true') {
      if (
        hardReload !== 'true' &&
        caseTemp.strategyOne_2 &&
        result.data.getScoresAIForAllCreditors
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
          data['settlementRange'] = null;
          return [true, data];
        }
      }
    } else {
      if (req.body.creditorNames.length) {
        const casesCreditors: any =
          await this.caseRepository.getAllWithoutPagination<ICase>(
            {creditor: {$in: req.body.creditorNames}, debtor: debtor},
            undefined,
            undefined,
            undefined,
            ['creditor']
          );
        getScores = await caseUtil.getScores(
          caseTemp,
          casesCreditors,
          debtor.commissionPercentage
        );
        data['getScores'] = getScores;
        if (typeof getScores === 'string') {
          data['settlementRange'] = null;
          return [true, data];
        }
      }
    }
    if (
      hardReload !== 'true' &&
      caseTemp.strategyOne_3 &&
      result.data.settlementRange
    ) {
      settlementRange = result.data.settlementRange;
      data['settlementRange'] = settlementRange;
    } else {
      settlementRange = await caseUtil.getSettlementRange(caseTemp);
      data['settlementRange'] = settlementRange;
    }
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

    if (typeof findCase.notes === 'string') {
      result = await this.caseRepository.updateById<ICase>(req.params.id, {
        $set: {
          notes: [
            {
              userId: reqTemp.id,
              value: req.body.notes,
              createdAt: commonUtil.getCurrentDate(),
            },
          ],
        },
      });
    } else result = await caseUtil.addNotes(req, reqTemp.id);

    if (!result) return [false, result];
    await emailUtil.sendEmailOrSmsByEvent(
      'case_details_update',
      result._id,
      '',
      reqTemp.id
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
    const caseTemp = await this.caseRepository.getById<ICase>(
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
    let debtor: any = caseTemp.debtor;
    creditors = await caseUtil.getAllCreditorsOfDebtor(caseTemp.debtor as any);
    creditors = await creditorUtil.checkCreditorsMapping(creditors);
    creditors = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorAccountTitle, creditor])
      ).values()
    );
    data['creditors'] = creditors;
    debtor = await this.debtorRepository.updateById<IDebtor>(debtor._id, {
      commissionPercentage: comm,
    });
    data['debtor'] = debtor;
    let extractedFieldsTemp = null;
    if (!debtor?.extractedFields && !debtor?.extractedFields?.length) {
      const extractedFields = await caseUtil.getExtractionMCA(debtor);
      if (extractedFields) {
        this.debtorRepository.updateById(debtor._id, {
          extractedFields: extractedFields.extracted_fields,
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
    } else {
      if (req.body.creditorNames.length) {
        const casesCreditors: any =
          await this.caseRepository.getAllWithoutPagination<ICase>(
            {creditor: {$in: req.body.creditorNames}, debtor: debtor},
            undefined,
            undefined,
            undefined,
            ['creditor']
          );
        getScores = await caseUtil.getScores(caseTemp, casesCreditors, comm);
        if (typeof getScores === 'string') {
          data['settlementRange'] = null;
          return [true, data];
        }
        data['getScores'] = getScores;
      }
    }
    settlementRange = await caseUtil.getSettlementRange(caseTemp);
    data['settlementRange'] = settlementRange;
    return [true, data];
  };
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
    return await emailUtil.sendEmail(
      sendTo,
      from,
      subject,
      content,
      cc,
      buffer
    );
  }
}

export default CaseService;
