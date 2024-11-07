import constants from '../../utils/constants.util';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {CaseRepository} from '../repository/case/case.repository';
import {Request} from 'express';
import caseUtil from '../../utils/case.util';
import {ICase} from '../../database/interfaces/case.interface';
import axios from 'axios';
import {URLSearchParams} from 'url';
import {IPayment} from '../../database/interfaces/payment.interface';
import {PaymentRepository} from '../repository/payment/payment.repository';
import PaymentService from './payment.service';
import {PaymentLogging} from '../../database/repomodels/paymentLogging.repomodel';
import commonUtil from '../../utils/common.util';
import {PaymentLoggingRepository} from '../repository/paymentLogging/paymentLogging.repository';
import {DataCopier} from '../../utils/dataCopier.util';
import {IPaymentLogging} from '../../database/interfaces/paymentLogging.interface';
import constantsUtil from '../../utils/constants.util';
import uploadUtil from '../../utils/upload.util';
import UploadUtil from '../../utils/upload.util';
import {StrategyRepository} from '../repository/strategy/strategy.repository';
import {IStrategy} from '../../database/interfaces/strategy.interface';
import emailUtil from '../../utils/email.util';
import {BulkUploadRepository} from '../repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../../database/interfaces/bulkUpload.interface';
import {BulkUpload} from '../../database/repomodels/bulkUpload.repomodel';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import paymentUtil from '../../utils/payment.util';
import moneyThumbUtil from '../../utils/moneyThumb.util';
import creditorUtil from '../../utils/creditor.util';
import debtorUtil from '../../utils/debtor.util';
import bulkUploadCronjob from '../../cron-job/bulkUpload.cronjob';
import googleDriveUtil from '../../utils/googleDrive.util';
import {cloneDeep} from 'lodash';
import CaseService from './case.service';

class DebtorService {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private paymentLoggingRepository: PaymentLoggingRepository;
  private strategyRepository: StrategyRepository;
  private bulkUploadRepository: BulkUploadRepository;
  private caseService: CaseService;
  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.paymentService = new PaymentService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
    this.strategyRepository = new StrategyRepository();
    this.bulkUploadRepository = new BulkUploadRepository();
    this.caseService = new CaseService();
  }

  async getDebtor(text: string): Promise<[boolean, IDebtor[] | string]> {
    const debtor = await this.debtorRepository.getAll<IDebtor>(
      {
        $or: [
          {
            'basicInformation.email': {
              $regex: new RegExp(text, 'i'), // Case-insensitive match for email
            },
          },
          {
            'basicInformation.fullName': {
              $regex: new RegExp(text, 'i'), // Case-insensitive match for email
            },
          },
          {
            'basicInformation.SSID': {
              $regex: new RegExp(text), // Case-insensitive match for SSID
            },
          },
          {
            'basicInformation.phone': {
              $regex: new RegExp(text), // Case-insensitive match for phone
            },
          },
          {
            'businessInformation.EIN': {
              $regex: new RegExp(text), // Case-insensitive match for phone
            },
          },
          {
            'businessInformation.companyName': {
              $regex: new RegExp(text, 'i'), // Case-insensitive match for phone
            },
          },
        ],
      },
      undefined,
      undefined,
      {_id: -1}
    );
    // const uploadUtil = new UploadUtil();
    // for (let doc of debtor[0].documents) {
    //   const url = await uploadUtil.getS3FileSignedUrl(doc.key);
    //   console.log(url);
    // }
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }

  async listingDetails(req: Request) {
    let casesCount = 0;
    const findCase = await this.caseRepository.getOne<ICase>(
      {
        debtor: req.params.id,
      },
      undefined,
      undefined,
      ['debtor']
    );
    if (!findCase) {
      const debtor = await this.debtorRepository.getById<IDebtor>(
        req.params.id
      );
      const paymentCounts = {
        failedPayments: 0,
        failedAuthorizations: 0,
        successfulPayments: 0,
        successfulAuthorizations: 0,
      };
      const caseHistory = [];
      const debtorObj = {
        SSN: debtor.basicInformation.SSID ? debtor.basicInformation.SSID : '',
        fullName: debtor.basicInformation.fullName
          ? debtor.basicInformation.fullName
          : '',
        companyName: debtor.businessInformation.companyName
          ? debtor.businessInformation.companyName
          : '',
        email: debtor.basicInformation.email
          ? debtor.basicInformation.email
          : '',
        status: debtor.basicInformation.status
          ? debtor.basicInformation.status
          : '',
        address: debtor.basicInformation.address
          ? debtor.basicInformation.address
          : '',
        outstandingDebt: 0,
        totalDebt: 0,
      };
      return [
        true,
        {
          paymentCounts,
          caseHistory,
          debtor: debtorObj,
          _id: debtor._id ? String(debtor._id) : '',
          debtorTotalCases: casesCount,
        },
      ];
    }
    const debtor: any = findCase.debtor;
    const token = await moneyThumbUtil.authenticateUser();
    const moneyThumbApp = await moneyThumbUtil.createNewApp(
      token,
      await debtorUtil.normalizeCompanyName(
        debtor.businessInformation.companyName
      )
    );
    if (!debtor?.totalStatements && moneyThumbApp['totalStatements']) {
      await this.debtorRepository.updateById(debtor._id, {
        totalStatements: moneyThumbApp['totalStatements'],
        updatedAt: commonUtil.getCurrentDate(),
      });
    }
    let page = 1;
    let limit = 5;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    let clientDetails = await caseUtil.getClientDetails(req);
    // if (req.query.filter === 'true' || req.query.search === 'true') {
    //   casesCount = clientDetails.caseHistory.length;
    // } else {
    //   casesCount = await this.caseRepository.getCount<ICase>({
    //     debtor: req.params.id,
    //     isDeleted: false,
    //   });
    // }
    casesCount = clientDetails.caseHistory.length;
    if (!clientDetails) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    clientDetails.caseHistory = clientDetails?.caseHistory?.slice(
      (page - 1) * limit,
      page * limit
    );
    return [true, {...clientDetails, debtorTotalCases: casesCount}];
  }

  async searchListing(req: Request, keyword: string) {
    let debtorsCount: number = 0;
    let page = 1;
    let limit = 10;
    // let reqTemp: any = req;
    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    // let match = {isDeleted: {$ne: true}};
    // let countFilter = {};
    // if (keyword === 'viewClientsForSelf') {
    //   countFilter['$or'] = [
    //     {caseOwnerId: reqTemp.id},
    //     {negotiatorId: reqTemp.id},
    //     {managerId: reqTemp.id},
    //   ];
    // }
    const clientDetails: any = await caseUtil.getClientListingPipeline(
      req,
      keyword
    );
    // const clientDetails: any =
    //   await this.caseRepository.applyAggregate<ICase>(pipeline);
    // const clientIds = clientDetails.map(client => {
    //   return client.id;
    // });
    // console.log(clientIds, 'clientIds');
    // const remainingDebtors =
    //   await this.debtorRepository.getAllWithoutPagination<ICase>({
    //     _id: {$nin: clientIds},
    //   });
    // const remainingDebtorsFiltered = remainingDebtors.map(debtor => {
    //   return {
    //     companyName: debtor.businessInformation.companyName,
    //     totalCases: 0,
    //     totalDebt: 0,
    //     status: debtor.basicInformation.status,
    //     id: String(debtor._id),
    //     totalCreditors: 0,
    //   };
    // });
    // const allDebtors = [...clientDetails, ...remainingDebtorsFiltered];
    // console.log(allDebtors);
    // if (req.query.filter === 'true' || req.query.search === 'true') {
    //   debtorsCount = clientDetails.length;
    // } else {
    //   if (keyword === 'viewClientsForSelf') {
    //     const cases =
    //       await this.caseRepository.getAllWithoutPagination<ICase>(countFilter);
    //     const setCount = new Set<string>();
    //     for (const caseTemp of cases) {
    //       setCount.add(String(caseTemp.debtor));
    //     }
    //     debtorsCount = setCount.size;
    //   } else {
    //     debtorsCount = await this.debtorRepository.getCount<IDebtor>();
    //   }
    // }
    debtorsCount = clientDetails.length;
    const paginatedDetails = clientDetails.slice(
      (page - 1) * limit,
      page * limit
    );
    return [
      true,
      {clientDetails: paginatedDetails, debtorsCount: debtorsCount},
    ];
  }

  async updateDebtor(req: Request): Promise<[boolean, IDebtor | string]> {
    let debtor = null;
    // const getDebtor = await this.debtorRepository.getById<IDebtor>(
    //   req.params.id
    // );
    // if (!getDebtor) {
    //   return [false, constants.notFoundMessage('Debtor')];
    // }
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!caseTemp) {
      return [false, constants.notFoundMessage('case')];
    }
    const getDebtor: any = caseTemp.debtor;
    if (req.body.businessInformation) {
      const alreadyPresent = await this.debtorRepository.getOne<IDebtor>({
        _id: {$ne: getDebtor._id},
        $or: [
          {
            'businessInformation.companyName':
              req.body.businessInformation.companyName,
          },
          {
            'businessInformation.EIN': req.body.businessInformation.EIN,
          },
        ],
      });
      if (alreadyPresent) {
        if (
          alreadyPresent.businessInformation.companyName ===
          req.body.businessInformation.companyName
        ) {
          return [
            false,
            constants.alreadyExistsMessage(
              `Debtor with companyName ${req.body.businessInformation.companyName}`
            ),
          ];
        }
        if (
          alreadyPresent.businessInformation.EIN ===
          req.body.businessInformation.EIN
        ) {
          return [
            false,
            constants.alreadyExistsMessage(
              `Debtor with EIN ${req.body.businessInformation.EIN}`
            ),
          ];
        }
      }
      // if (
      //   getDebtor &&
      //   req.body.basicInformation &&
      //   req.body.basicInformation.weeklyBudget !==
      //     getDebtor.basicInformation.weeklyBudget
      // ) {
      //   const response = await caseUtil.checkWeeklyBudget(
      //     {debtor: req.body},
      //     true,
      //     getDebtor
      //   );
      //   if (!response.status) {
      //     return [
      //       false,
      //       'Weekly budget is not fulfiling the payment plan of debtor',
      //     ];
      //   }
      //   req.body.weeklyCommission = response.commission;
      // }
      // if (!req.body.basicInformation.weeklyBudget)
      //   req.body.basicInformation.weeklyBudget = 1;
      req.body.updatedAt = commonUtil.getCurrentDate();
      debtor = await this.debtorRepository.updateById<IDebtor>(
        getDebtor._id,
        req.body
      );
      if (
        getDebtor.basicInformation.weeklyBudget !==
          debtor.basicInformation.weeklyBudget ||
        getDebtor.profitMargin !== debtor.profitMargin
      ) {
        await this.caseRepository.updateById<ICase>(req.params.id, {
          settlementRange: false,
          updatedAt: commonUtil.getCurrentDate(),
        });
      }
    }
    if (req.body.contact && req.query.contact === 'add') {
      debtor = await this.debtorRepository.updateById<IDebtor>(getDebtor._id, {
        $push: {contacts: req.body.contact},
        updatedAt: commonUtil.getCurrentDate(),
      });
    }
    if (req.body.contact && req.query.contact === 'edit') {
      debtor = await this.debtorRepository.updateByOne<IDebtor>(
        {
          _id: getDebtor._id,
          contacts: {$elemMatch: {_id: req.body.contact._id}},
        },
        {
          $set: {'contacts.$': req.body.contact},
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
    }
    if (req.body.paymentToken && req.body.paymentType) {
      const customerVaultResponse = await caseUtil.createVault(
        req.body.paymentToken
      );
      if (!customerVaultResponse[0]) return customerVaultResponse;

      debtor = await this.debtorRepository.updateById<IDebtor>(getDebtor._id, {
        $push: {
          accounts: {
            $each: [
              {
                paymentType: req.body.paymentType,
                customerVaultId: customerVaultResponse[1],
              },
            ],
          },
        },
        updatedAt: commonUtil.getCurrentDate(),
      });
    }
    // const allStrategyFalse = await this.caseRepository.updateById<ICase>(
    //   req.params.id,
    //   {
    //     strategyOne_1: false,
    // strategyOne_2: false,
    // strategyOne_3: false,
    // strategyTwo: false,
    // strategyThree: false,
    // justifications: false,
    // lumpSumJustifications: false,
    // fullProfitJustifications: false,
    //     updatedAt: commonUtil.getCurrentDate(),
    //   }
    // );
    // if (allStrategyFalse) {
    //   const response = await caseUtil.getAllCreditorsOfDebtor(getDebtor);
    //   const creditors = Array.from(
    //     new Map(
    //       response.map(creditor => [creditor.creditorId, creditor])
    //     ).values()
    //   );
    //   let extractedFieldsTemp = null;
    //   if (!debtor?.extractedFields && !debtor?.extractedFields?.length) {
    //     const extractedFields = await caseUtil.getExtractionMCA(debtor);
    //     if (extractedFields) {
    //       this.debtorRepository.updateById(getDebtor._id, {
    //         extractedFields: extractedFields.extracted_fields,
    //         updatedAt: commonUtil.getCurrentDate(),
    //       });
    //       extractedFieldsTemp = extractedFields.extracted_fields;
    //     }
    //   }
    //   caseUtil.getCreditorNames(
    //     getDebtor,
    //     getDebtor.extractedFields
    //       ? getDebtor.extractedFields
    //       : extractedFieldsTemp,
    //     String(caseTemp._id)
    //   );
    //   caseUtil.getScoresForAllCreditors(
    //     caseTemp,
    //     creditors,
    //     getDebtor.commissionPercentage
    //   );
    //   caseUtil.getSettlementRange(caseTemp);
    //   caseUtil.getLumpSumAmount(caseTemp);
    //   caseUtil.getFullProfitSettlement(caseTemp);
    // }
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }

  async updateDebtorBulk(req: Request): Promise<[boolean, IDebtor | string]> {
    let debtor = null;
    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );
    if (!getDebtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    const alreadyPresent = await this.debtorRepository.getOne<IDebtor>({
      _id: {$ne: getDebtor._id},
      $or: [
        {
          'businessInformation.companyName':
            req.body.businessInformation.companyName,
        },
        {
          'businessInformation.EIN': req.body.businessInformation.EIN,
        },
      ],
    });
    if (alreadyPresent) {
      if (
        alreadyPresent.businessInformation.companyName ===
        req.body.businessInformation.companyName
      ) {
        return [
          false,
          constants.alreadyExistsMessage(
            `Debtor with companyName ${req.body.businessInformation.companyName}`
          ),
        ];
      }
      if (
        alreadyPresent.businessInformation.EIN ===
        req.body.businessInformation.EIN
      ) {
        return [
          false,
          constants.alreadyExistsMessage(
            `Debtor with EIN ${req.body.businessInformation.EIN}`
          ),
        ];
      }
    }
    req.body.updatedAt = commonUtil.getCurrentDate();
    debtor = await this.debtorRepository.updateById<IDebtor>(
      getDebtor._id,
      req.body
    );
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }

  async retryAuth(paymentId: string): Promise<[boolean, string]> {
    let result = false;
    const payment: any = await this.paymentRepository.getById<IPayment>(
      paymentId,
      undefined,
      undefined,
      {path: 'caseId', populate: [{path: 'debtor'}, {path: 'creditor'}]}
    );
    if (!payment) {
      return [false, constantsUtil.notFoundMessage('payment')];
    }
    if (payment.authorized === 'Success') {
      return [false, 'Payment already authorized'];
    }
    let response: any;
    if (payment.caseId.debtor.paymentType === 'cc') {
      response = await this.paymentService.authorizeCreditCard(
        payment.amount,
        payment.caseId.debtor.customerVaultId
      );
    }
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    // const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      // updateObjPayment['status'] = 'Pending';
      // paymentLogging.successReason = responseText;
      result = true;
      // await emailUtil.sendEmailOrSmsByEvent(
      //   'successful_authorization',
      //   '',
      //   paymentId,
      //   ''
      // );
    } else {
      updateObjPayment['failedReasonAuthorization'] = responseText;
      // paymentLogging.failReason = responseText;
      // await emailUtil.sendEmailOrSmsByEvent(
      //   'failed_authorization',
      //   '',
      //   paymentId,
      //   ''
      // );
    }
    if (Object.keys(updateObjPayment).length) {
      // const newPayment = new PaymentLogging();
      // const populatedPayment = DataCopier.copy(newPayment, payment);
      // const verifiedPayment = DataCopier.copy(
      //   populatedPayment,
      //   updateObjPayment
      // );
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
      // await this.paymentLoggingRepository.create<IPaymentLogging>(
      //   verifiedPayment
      // );
    }
    // paymentLogging.caseId = String(payment.caseId);
    // paymentLogging.createdAt = commonUtil.getCurrentDate();
    // paymentLogging.paymentId = String(payment._id);
    // paymentLogging.paymentType = 'Credit Auth';
    // paymentLogging.debtor = String(payment.caseId.debtor._id);
    // paymentLogging.creditor = String(payment.caseId.creditor._id);
    if (result) return [true, 'Payment authorized successfully!'];
    return [false, 'Unable to authorize payment!'];
  }

  async retryCapture(paymentId: string) {
    let result = false;
    const payment: any = await this.paymentRepository.getById<IPayment>(
      paymentId,
      undefined,
      undefined,
      {path: 'caseId', populate: [{path: 'debtor'}, {path: 'creditor'}]}
    );
    if (!payment) {
      return [false, constantsUtil.notFoundMessage('payment')];
    }
    if (payment.captured === 'Success') {
      return [false, 'Payment already captured'];
    }
    let response: any;
    if (payment.caseId.debtor.paymentType === 'cc') {
      response = await this.paymentService.captureCreditCard(
        payment.caseId.debtor.customerVaultId,
        payment.debtorTransId,
        payment.caseId.creditor.creditorSecurityKey
      );
    }
    if (payment.caseId.debtor.paymentType === 'ck') {
      response = await this.paymentService.achCredit(
        payment.caseId.debtor.customerVaultId,
        payment.amount,
        payment.caseId.creditor.creditorSecurityKey
      );
    }
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    // const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      if (payment.caseId.debtor.paymentType === 'ck') {
        updateObjPayment['debtorTransId'] = transactionId;
      }
      // paymentLogging.successReason = responseText;
      result = true;
      // await emailUtil.sendEmailOrSmsByEvent(
      //   'successful_payment',
      //   '',
      //   paymentId,
      //   ''
      // );
    } else {
      updateObjPayment['failedReasonCaptured'] = responseText;
      // paymentLogging.failReason = responseText;

      // await emailUtil.sendEmailOrSmsByEvent(
      //   'failed_payment',
      //   '',
      //   paymentId,
      //   ''
      // );
    }
    if (Object.keys(updateObjPayment).length) {
      // const newPayment = new PaymentLogging();
      // const populatedPayment = DataCopier.copy(newPayment, payment);
      // const verifiedPayment = DataCopier.copy(
      //   populatedPayment,
      //   updateObjPayment
      // );
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
      // await this.paymentLoggingRepository.create<IPaymentLogging>(
      //   verifiedPayment
      // );
    }
    // paymentLogging.caseId = String(payment.caseId);
    // paymentLogging.createdAt = commonUtil.getCurrentDate();
    // paymentLogging.paymentId = String(payment._id);
    // paymentLogging.paymentType = 'Credit Capture';
    // paymentLogging.debtor = String(payment.caseId.debtor._id);
    // paymentLogging.creditor = String(payment.caseId.creditor._id);
    // await this.paymentLoggingRepository.create(paymentLogging as any);
    if (result) return [true, 'Payment captured successfully!'];
    return [false, 'Unable to capture payment!'];
  }

  getAllDebtors = async (
    req: Request
  ): Promise<[boolean, Partial<IDebtor[]> | string]> => {
    let debtors = await this.debtorRepository.getAllWithoutPagination<IDebtor>(
      {},
      undefined,
      undefined,
      {_id: -1}
    );
    if (!debtors.length) {
      return [false, constantsUtil.notFoundMessage('debtors')];
    }
    return [true, debtors];
  };

  async createDebtor(body: any, id: string) {
    // const reqTemp: any = req;
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      $or: [
        {
          'businessInformation.companyName':
            body.businessInformation.companyName,
        },
        {
          'businessInformation.EIN': body.businessInformation.EIN,
        },
      ],
    });
    let debtor: IDebtor = null;
    let account = [];
    if (body.paymentToken && body.paymentType) {
      const customerVaultResponse = await caseUtil.createVault(
        body.paymentToken
      );
      if (!customerVaultResponse[0]) return customerVaultResponse;
      // req.body.customerVaultId = customerVaultResponse[1];
      account.push({
        paymentType: body.paymentType,
        customerVaultId: customerVaultResponse[1],
      });
    }
    if (!getDebtor) {
      if (account.length) body.accounts = account;
      if (body.basicInformation.weeklyBudget) {
        body.weeklyBudgetStrategy1 = body.basicInformation.weeklyBudget;
      }
      debtor = await caseUtil.createDebtor(body, id);
    }
    if (getDebtor) {
      if (account.length) body.accounts = getDebtor.accounts.concat(account);
      // if (!req.body.basicInformation?.weeklyBudget)
      //   req.body.basicInformation.weeklyBudget = 1;
      body.updatedAt = commonUtil.getCurrentDate();
      // if (body?.documents && body?.documents?.length)
      //   body.documents = getDebtor.documents.concat(body.documents);
      debtor = await this.debtorRepository.updateById<IDebtor>(
        getDebtor._id,
        body
      );
    }
    if (!debtor) {
      return [false, constantsUtil.failureAddMessage('debtor')];
    }
    moneyThumbUtil.run(debtor, debtor.businessInformation.companyName);
    const creditorNames = await caseUtil.getCreditorNames(
      debtor,
      body.extractedFields
    );
    return [true, {debtor, creditorNames}];
  }

  async addDocumentsToDebtor(req: Request) {
    if (!req.body.documents) {
      return [false, 'Documents are missing'];
    }
    // if (!req.body.extractedFields) {
    //   return [false, 'Extracted fields are missing'];
    // }
    const caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!caseTemp) {
      return [false, constants.notFoundMessage('case')];
    }
    const updatedDebtor = await this.debtorRepository.updateById<IDebtor>(
      caseTemp.debtor._id,
      {
        $push: {
          documents: {
            $each: req.body.documents,
          },
        },
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    if (!updatedDebtor) {
      return [false, constants.failureUpdateMessage('debtor')];
    }
    this.caseRepository.updateById<ICase>(req.params.id, {
      settlementRange: false,
      updatedAt: commonUtil.getCurrentDate(),
    });
    await moneyThumbUtil.run(
      updatedDebtor,
      updatedDebtor.businessInformation.companyName
    );
    // const statements = caseTemp.debtor?.totalStatements;
    // if (caseTemp.intervals) {
    //   debtorUtil.percentageChangeEmail(
    //     updatedDebtor.businessInformation.companyName,
    //     String(updatedDebtor._id),
    //     statements ? statements : 0,
    //     caseTemp.debtor?.basicInformation?.fullName
    //   );
    // }

    // for (let doc of findCase.documents) {
    //   const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
    //   doc.url = url;
    // }
    // const allStrategyFalse = await this.caseRepository.updateById<ICase>(
    //   caseTemp._id,
    //   {
    //     strategyOne_1: false,
    //     strategyOne_2: false,
    //     strategyOne_3: false,
    //     strategyTwo: false,
    //     strategyThree: false,
    //     justifications: false,
    //     lumpSumJustifications: false,
    //     fullProfitJustifications: false,
    //     updatedAt: commonUtil.getCurrentDate(),
    //   }
    // );
    // if (allStrategyFalse) {
    //   const response = await caseUtil.getAllCreditorsOfDebtor(updatedDebtor);
    //   const creditors = Array.from(
    //     new Map(
    //       response.map(creditor => [creditor.creditorId, creditor])
    //     ).values()
    //   );
    //   const extractedFields = await caseUtil.getExtractionMCA(updatedDebtor);
    //   if (extractedFields) {
    //     this.debtorRepository.updateById(caseTemp.debtor._id, {
    //       extractedFields: extractedFields.extracted_fields,
    //       updatedAt: commonUtil.getCurrentDate(),
    //     });
    //   }
    //   if (extractedFields)
    //     caseUtil.getCreditorNames(
    //       updatedDebtor,
    //       extractedFields
    //         ? extractedFields.extracted_fields
    //         : updatedDebtor.extractedFields,
    //       String(caseTemp._id)
    //     );

    //   caseUtil.getScoresForAllCreditors(
    //     caseTemp,
    //     creditors,
    //     updatedDebtor.commissionPercentage
    //   );
    //   caseUtil.getSettlementRange(caseTemp);
    //   caseUtil.getLumpSumAmount(caseTemp);
    //   caseUtil.getFullProfitSettlement(caseTemp);
    // }
    return [true, updatedDebtor];
  }

  getLumpSumAmount = async (req: Request) => {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    if (caseTemp.strategyTwo) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'strategy_two',
      });
      if (result?.data?.lumpSumAmount) return [true, result.data.lumpSumAmount];
    }
    const lumpSumResult = await caseUtil.getLumpSumAmount(caseTemp);
    return lumpSumResult;
  };

  getFullProfitSettlement = async (req: Request) => {
    // const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    // await caseUtil.getExtractionMCA(debtor);
    // if (!debtor) {
    //   return [false, constantsUtil.notFoundMessage('debtor')];
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    if (caseTemp.strategyThree) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'strategy_three',
      });
      if (result?.data?.fullProfitSettlement)
        return [true, result.data.fullProfitSettlement];
    }
    const fullProfitResult = await caseUtil.getFullProfitSettlement(caseTemp);
    return fullProfitResult;
  };

  lumpSumJustifications = async (req: Request) => {
    const caseTemp = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor']
    );
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    let creditors = null;
    creditors = await caseUtil.getAllCreditorsOfDebtor(caseTemp.debtor as any);
    creditors = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorAccountTitle, creditor])
      ).values()
    );
    let lumpSum = {};
    if (caseTemp.strategyTwo) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'strategy_two',
      });
      lumpSum = result.data.lumpSumAmount.lumpsum_settlement;
      console.log(lumpSum);
      for (const creditor of creditors) {
        console.log(
          creditor.creditorAccountTitle,
          'creditor.creditorAccountTitle'
        );
        const repaidDebt = lumpSum[creditor.creditorAccountTitle].repaid_debt;
        lumpSum[creditor.creditorAccountTitle].remaining_principle_amount =
          parseFloat(
            (
              caseUtil.getCleanAmount(creditor.contractDetails.funded_amount) -
              repaidDebt
            ).toFixed(2)
          );
      }
    }
    if (caseTemp.lumpSumJustifications) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'lumpSumJustifications',
      });
      if (result?.data?.justifications)
        return [true, result.data.justifications];
    }
    const models = await caseUtil.getJustificationModels();
    const justifications = await caseUtil.lumpSumJustifications(
      caseTemp,
      models,
      lumpSum
    );
    return justifications;
  };

  fullProfitJustifications = async (req: Request) => {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    if (caseTemp.fullProfitJustifications) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'fullProfitJustifications',
      });
      if (result?.data?.justifications)
        return [true, result.data.justifications];
    }
    const models = await caseUtil.getJustificationModels();
    const justifications = await caseUtil.fullProfitJustifications(
      caseTemp,
      models
    );
    return justifications;
  };

  async getExtractedFields(req: Request) {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    const extractedFields = await caseUtil.getExtractionMCA(req.body);
    if (!extractedFields) {
      return [false, constantsUtil.notFoundMessage('extrcated data')];
    }
    return [true, extractedFields];
  }

  async createMultipleDebtors(req: Request) {
    const debtors = req.body.debtors;
    const reqTemp: any = req;
    let bulkCount = 0;
    for (const body of debtors) {
      let getDebtor = null;
      if (
        body?.businessInformation?.companyName ||
        body?.businessInformation?.EIN
      ) {
        getDebtor = await this.debtorRepository.getOne<IDebtor>({
          $or: [
            {
              'businessInformation.companyName':
                body.businessInformation.companyName,
            },
            {
              'businessInformation.EIN': body.businessInformation.EIN,
            },
          ],
        });
      }

      let debtor: IDebtor = null;
      // let account = [];
      // if (body.paymentToken && body.paymentType) {
      //   const customerVaultResponse = await caseUtil.createVault(
      //     body.paymentToken
      //   );
      //   if (!customerVaultResponse[0]) return customerVaultResponse;
      //   // req.body.customerVaultId = customerVaultResponse[1];
      //   account.push({
      //     paymentType: body.paymentType,
      //     customerVaultId: customerVaultResponse[1],
      //   });
      // }
      if (!getDebtor) {
        // if (account.length) body.accounts = account;
        body.bulkUpload = true;
        debtor = await caseUtil.createDebtor(body, reqTemp.id);
      }
      if (getDebtor) {
        // if (account.length) body.accounts = getDebtor.accounts.concat(account);
        // if (!body.basicInformation?.weeklyBudget)
        //   body.basicInformation.weeklyBudget = 1;
        // body.updatedAt = commonUtil.getCurrentDate();
        // debtor = await this.debtorRepository.updateById<IDebtor>(
        //   getDebtor._id,
        //   body
        // );
        debtor = getDebtor;
      }
      if (body.driveUrl) {
        const getDebtorBulk =
          await this.bulkUploadRepository.getOne<IBulkUpload>({
            driveUrl: body.driveUrl,
          });
        const newBulkUpload = new BulkUpload();
        newBulkUpload.driveUrl = body.driveUrl;
        newBulkUpload.debtor = debtor._id;
        newBulkUpload.createdByName = reqTemp.name;
        newBulkUpload.createdById = reqTemp.id;
        if (getDebtorBulk) {
          newBulkUpload.status = 'Duplicate';
        }
        if (!getDebtorBulk) {
          const caseTemp = await this.caseRepository.getOne<ICase>({
            debtor: debtor._id,
          });
          // const newBulkUpload = new BulkUpload();
          // newBulkUpload.driveUrl = body.driveUrl;
          // newBulkUpload.debtor = debtor._id;
          if (caseTemp) newBulkUpload.status = 'Duplicate';
          // newBulkUpload.createdByName = reqTemp.name;
          // newBulkUpload.createdById = reqTemp.id;
          // await this.bulkUploadRepository.create<IBulkUpload>(
          //   newBulkUpload as any
          // );
        }
        await this.bulkUploadRepository.create<IBulkUpload>(
          newBulkUpload as any
        );
        bulkCount += 1;
      }
    }
    if (!bulkCount) {
      return [
        false,
        constantsUtil.alreadyExistsMessage('Bulk upload with same drive urls'),
      ];
    }
    return [true, constants.successAddMessage('Debtors')];
  }

  async addDebtorAccount(req: Request) {
    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    const customerVaultResponse = await caseUtil.createVault(
      req.body.paymentToken
    );
    if (!customerVaultResponse[0]) return customerVaultResponse;

    await this.debtorRepository.updateById<IDebtor>(getDebtor._id, {
      $push: {
        accounts: {
          $each: [
            {
              paymentType: req.body.paymentType,
              customerVaultId: customerVaultResponse[1],
            },
          ],
        },
      },
      updatedAt: commonUtil.getCurrentDate(),
    });
    return [true, constants.successAddMessage('Debtor account details')];
  }

  async getDebtorSummery(req: Request) {
    const reqTemp: any = req;
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      userId: reqTemp.id,
    });
    console.log(getDebtor);
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    let getAllCreditor: Array<ICreditor | any> | any =
      await caseUtil.getCreditorsForDebtor(String(getDebtor._id));

    let payments = await paymentUtil.getPaymentsByStatusAndDebtor(
      'Upcoming',
      String(getDebtor._id)
    );
    let pendingPayments: Array<IPayment | any> | any =
      await paymentUtil.getPaymentsByStatusAndDebtor(
        'Pending',
        String(getDebtor._id)
      );

    return [
      true,
      {
        creditorList: getAllCreditor,
        totalCreditor: getAllCreditor?.length ?? 0,
        totalDebt: getAllCreditor.reduce(
          (sum, creditor) => sum + creditor.totalDebt,
          0
        ),

        weeklyRemainingPayments: pendingPayments?.length ?? 0,
        companyName: getDebtor?.businessInformation?.companyName,
        upComingPayments: payments,
      },
    ];
  }

  async saveWeeklyBudgetValues(req: Request) {
    const caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [{path: 'debtor'}]
    );
    if (!caseTemp) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    const debtor = await debtorUtil.saveWeeklyBudget(caseTemp, req.body);
    if (!debtor) {
      return [true, constants.failureUpdateMessage('weekly budget info')];
    }
    return [true, constants.successUpdateMessage('Weekly budget info')];
  }

  async getMcaAndFinancials(req: Request) {
    const reqTemp: any = req;
    const {mca, bankStatements} = req.body;
    const documents = mca.concat(bankStatements);
    const extractedFields = await caseUtil.getExtractionMCA({
      documents: documents,
    } as any);
    if (!extractedFields)
      return [false, 'Could not extract data from documents'];
    const debtorBody = await debtorUtil.mapDebtor(
      extractedFields.extracted_fields
    );
    debtorBody['extractedFields'] = extractedFields.extracted_fields;
    const createDebtor = await this.createDebtor(debtorBody, reqTemp.id);
    let finalObj = {};
    const finalArray = [];
    if (createDebtor[0]) {
      await this.debtorRepository.updateById<IDebtor>(
        String(createDebtor[1]['debtor']._id),
        {userId: reqTemp.id}
      );
      const caseTemp = await googleDriveUtil.mapCreditorsCases(
        extractedFields.extracted_fields,
        createDebtor[1]['creditorNames']
      );
      for (const bin of caseTemp) {
        bin['platform'] = true;
        bin.creditor.platform = true;
      }
      const copyCaseTemp = cloneDeep(caseTemp);
      const result = await caseUtil.createCreditorsCases(
        {data: caseTemp},
        reqTemp.name,
        reqTemp.id,
        String(createDebtor[1]['debtor']._id)
      );
      if (result[0]) {
        for (let i = 0; i < copyCaseTemp.length; i++) {
          finalObj['creditorName'] =
            copyCaseTemp[i].creditor?.basicInformation?.fullName;
          finalObj['paybackAmount'] = result[1][i].totalDebt;
          finalObj['balance'] = result[1][i].remaining;
          finalObj['apr'] = await commonUtil.getValuePercenatge(
            result[1][i].contractDetails.purchased_percentage
          );
          finalObj['currentPayment'] =
            await commonUtil.removeDashesAndRoundBrackets(
              result[1][i].contractDetails.repayment_amount
            );
          finalArray.push(finalObj);
          finalObj = {};
        }
      }
    }
    if (!finalArray.length) return [false, 'Could not create cases'];
    return [true, finalArray];
  }

  async analyzeAndGetSettlementRanges(req: Request) {
    const reqTemp: any = req;
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      userId: reqTemp.id,
    });
    console.log(getDebtor);
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    const caseTemp = await this.caseRepository.getOne<ICase>({
      debtor: getDebtor._id,
      platform: true,
    });
    if (!caseTemp) return [false, constants.notFoundMessage('case')];
    const getScoresSettlementRange: any =
      await this.caseService.getScoresSettlementRange(
        'true',
        'false',
        null,
        caseTemp._id
      );
    console.log(getScoresSettlementRange, 'getScoresSettlementRange');
    const combineResult = {};
    const plans = {};
    const commissionPlan = {};
    const allCreditorsResult = [];
    const creditors = [];
    const token = await moneyThumbUtil.authenticateUser();
    const moneyThumbApp = await moneyThumbUtil.createNewApp(
      token,
      await debtorUtil.normalizeCompanyName(
        getDebtor.businessInformation.companyName
      )
    );
    const scoreCard = await moneyThumbUtil.getScoreCard(
      token,
      moneyThumbApp['appid']
    );
    const metricData = scoreCard['metrics']['metricdata'];
    if (metricData?.length) {
      const revenueArray = metricData.find(row => row[0] === 'Revenue');
      console.log(revenueArray, 'revenueArray');
      combineResult['avgMonthlySales'] = parseFloat(revenueArray[1]);
    }
    const mcaCompanies = scoreCard['mcacompanies'];
    const getTotalBudget = await moneyThumbUtil.getTotalBudget(mcaCompanies);
    console.log(getTotalBudget, 'getTotalBudget');
    const getProfitAndTrueRevenue =
      await moneyThumbUtil.getAnuallyProfitAndTrueRevenue(metricData);
    console.log(getProfitAndTrueRevenue, 'getProfitAndTrueRevenue');
    const netProfitMargin =
      (Math.abs(getTotalBudget) + getProfitAndTrueRevenue.profit) /
      getProfitAndTrueRevenue.trueRevenue;

    console.log(netProfitMargin, 'netProfitMargin');
    const netProfitMargin100 = netProfitMargin * 100;
    combineResult['netProfitMargin'] =
      Math.round(netProfitMargin100 * 100) / 100;
    if (getScoresSettlementRange[0]) {
      const data = getScoresSettlementRange[1];
      plans['weeklyPayment'] = data.settlementRange?.weekly_budget?.Summary
        ? data.settlementRange.weekly_budget.Summary
        : 0;
      plans['maximum'] = data.creditors.reduce(
        (sum, obj) => sum + obj.breakEven,
        0
      );
      plans['percentageShare'] = data.creditors.reduce(
        (sum, obj) => sum + obj.percentageReceivable,
        0
      );
      const totalRemaining = data.creditors.reduce(
        (sum, obj) => sum + obj.remaining,
        0
      );
      console.log(totalRemaining, 'totalRemaining');
      commissionPlan['lumpSum'] = Math.round(totalRemaining * 0.1 * 100) / 100;
      commissionPlan['4Week'] = totalRemaining * 0.12;
      commissionPlan['4month'] = totalRemaining * 0.19;
      console.log(commissionPlan, 'commissionPlan');
      console.log(plans, 'planssss');
      combineResult['plans'] = plans;
      combineResult['commissionPlan'] = commissionPlan;
      for (const creditor of data.creditors) {
        const capture = {};
        const creditorObj = {};
        capture['name'] = creditor.creditorAccountTitle;
        capture['payableAmount'] = creditor.totalDebt;
        capture['balance'] = creditor.totalDebt - creditor.remainingAmountPaid;
        capture['weeklyPayment'] = '';
        if (
          data.settlementRange?.weekly_budget &&
          data.settlementRange?.weekly_budget[creditor.creditorAccountTitle]
        ) {
          capture['weeklyPayment'] =
            data.settlementRange.weekly_budget[creditor.creditorAccountTitle];
          creditorObj['weeklyPayment'] =
            data.settlementRange.weekly_budget[creditor.creditorAccountTitle];
        } else {
          capture['weeklyPayment'] = '-';
          creditorObj['weeklyPayment'] = '-';
        }
        capture['interestRate'] = '12';
        creditorObj['name'] = creditor.creditorAccountTitle;
        creditorObj['maximum'] = creditor.breakEven;
        creditorObj['percentageShare'] = creditor.percentageReceivable;
        creditors.push(creditorObj);
        allCreditorsResult.push(capture);
      }
      console.log(allCreditorsResult, 'allCreditorsResult');
      console.log(creditors, 'creditors');

      combineResult['allCreditorsResult'] = allCreditorsResult;
      combineResult['creditors'] = creditors;
    }
    const accounts = scoreCard['accountslist']['data'];
    const yearlyResults = await debtorUtil.getYearlySales(accounts);
    console.log(yearlyResults, 'yearlyResults');
    combineResult['yearlySales'] = yearlyResults;
    const yearlyProfitMargin =
      await debtorUtil.getYearlyProfitMargin(scoreCard);
    console.log(yearlyProfitMargin, 'yearlyProfitMargin');
    combineResult['yearlyProfitMargin'] = yearlyProfitMargin;
    return [true, combineResult];
  }
}

export default DebtorService;
