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

class CaseService {
  private caseRepository: CaseRepository;
  private uploadUtil: UploadUtil;
  private targetCFRepository: TargetCFRepository;
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private chatSummaryRepository: ChatSummaryRepository;
  private userRepository: UserRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.uploadUtil = new UploadUtil();
    this.targetCFRepository = new TargetCFRepository();
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.chatSummaryRepository = new ChatSummaryRepository();
    this.userRepository = new UserRepository();
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
        return [false, constantsUtil.notFoundMessage('Creditor')];
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

    if (req.body?.intervals) {
      let weeklyBudgetObj: {
        status: boolean;
        commission: number;
        totalCommission: number;
      };
      if (req.body.feePayment && req.body.feePayment === 'toPay') {
        weeklyBudgetObj = await caseUtil.checkWeeklyBudget(
          req.body,
          true,
          findCase.debtor
        );
        if (!weeklyBudgetObj.status) {
          return [
            false,
            'Weekly budget is not fulfiling the payment plan of debtor',
          ];
        }
        await this.debtorRepository.updateById<IDebtor>(findCase.debtor._id, {
          totalCommission: weeklyBudgetObj.totalCommission,
          weeklyCommission: weeklyBudgetObj.commission,
        });
      }
    }
    const checkCasePayment = await caseUtil.checkCasePayment(req.body);
    if (!checkCasePayment[0]) return checkCasePayment;
    const caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (req.body.intervals) {
      await caseUtil.createPayment(caseUpdated);
    }
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    return [true, caseUpdated];
  };

  updateCaseAbout = async (
    req: Request
  ): Promise<[boolean, ICase | string]> => {
    const caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
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
    const caseTemp = await this.caseRepository.getById<ICase>(
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
      getScores = await caseUtil.getScores(req, caseTemp, creditors);
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

  createCreditorsCases = async (
    req: Request
  ): Promise<[boolean, {} | string]> => {
    const reqTemp: any = req;

    const checkCasePayment = await caseUtil.checkCasePayment(req.body);
    if (!checkCasePayment[0]) return checkCasePayment;
    const result = await caseUtil.createCreditorsCases(
      req,
      reqTemp.name,
      reqTemp.id
    );
    if (!result[0]) return [false, result[1] as string];
    return [true, result[1]];
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
    let getScores = null;
    let creditors = null;
    const response = await caseUtil.getAllCreditorsOfDebtor(
      caseTemp.debtor as any
    );
    creditors = Array.from(
      new Map(
        response.map(creditor => [creditor.creditorId, creditor])
      ).values()
    );
    if (req.query.all === 'true') {
      getScores = await caseUtil.getScoresForAllCreditors(caseTemp, creditors);
    } else {
      if (req.body.creditorNames.length) {
        const casesCreditors: any =
          await this.caseRepository.getAllWithoutPagination<ICase>(
            {creditor: {$in: req.body.creditorNames}, debtor: caseTemp.debtor},
            undefined,
            undefined,
            undefined,
            ['creditor']
          );
        console.log(casesCreditors);
        getScores = await caseUtil.getScores(req, caseTemp, casesCreditors);
      }
    }
    const settlementRange = await caseUtil.getSettlementRange(caseTemp);
    if (req.query.hardReload && req.query.hardReload === 'true') {
      const debtor: any = caseTemp.debtor;
      const extractedFields = await caseUtil.getExtractionMCA(debtor);
      const creditorNames = await caseUtil.getCreditorNames(
        debtor,
        extractedFields.extracted_fields
          ? extractedFields.extracted_fields
          : null
      );
      return [
        true,
        {
          getScores: getScores,
          settlementRange: settlementRange,
          creditors,
          debtor: caseTemp.debtor,
          creditorNames,
        },
      ];
    }
    return [
      true,
      {
        getScores: getScores,
        settlementRange: settlementRange,
        creditors,
        debtor: caseTemp.debtor,
      },
    ];
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
    return [true, result];
  };
}

export default CaseService;
