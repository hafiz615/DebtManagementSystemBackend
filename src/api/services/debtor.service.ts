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
import mongoose from 'mongoose';
class DebtorService {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private paymentLoggingRepository: PaymentLoggingRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.paymentService = new PaymentService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
  }

  async getDebtor(text: string): Promise<[boolean, IDebtor[] | string]> {
    const debtor = await this.debtorRepository.getAll<IDebtor>({
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
    });
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
    const findCase = await this.caseRepository.getOne<ICase>({
      debtor: req.params.id,
    });
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
    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );
    if (!getDebtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    if (req.body.businessInformation) {
      const alreadyPresent = await this.debtorRepository.getOne<IDebtor>({
        _id: {$ne: req.params.id},
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
      if (
        getDebtor &&
        req.body.basicInformation &&
        req.body.basicInformation.weeklyBudget !==
          getDebtor.basicInformation.weeklyBudget
      ) {
        const response = await caseUtil.checkWeeklyBudget(
          {debtor: req.body},
          true,
          getDebtor
        );
        if (!response.status) {
          return [
            false,
            'Weekly budget is not fulfiling the payment plan of debtor',
          ];
        }
        req.body.weeklyCommission = response.commission;
      }
      debtor = await this.debtorRepository.updateById<IDebtor>(
        req.params.id,
        req.body
      );
    }
    if (req.body.contact && req.query.contact === 'add') {
      debtor = await this.debtorRepository.updateById<IDebtor>(req.params.id, {
        $push: {contacts: req.body.contact},
      });
    }
    if (req.body.contact && req.query.contact === 'edit') {
      debtor = await this.debtorRepository.updateByOne<IDebtor>(
        {
          _id: req.params.id,
          contacts: {$elemMatch: {_id: req.body.contact._id}},
        },
        {$set: {'contacts.$': req.body.contact}}
      );
    }
    if (req.body.paymentToken && req.body.paymentType) {
      const customerVaultResponse = await caseUtil.createVault(
        req.body.paymentToken
      );
      if (!customerVaultResponse[0]) return customerVaultResponse;

      debtor = await this.debtorRepository.updateById<IDebtor>(req.params.id, {
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
      });
    }
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
    let response: any;
    if (payment.caseId.debtor.paymentType === 'cc') {
      response = await this.paymentService.authorizeCreditCard(
        payment.amount,
        payment.caseId.debtor.customerVaultId
      );
    }
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      console.log(transactionId, 'transactionId');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      // paymentLogging.successReason = responseText;
      result = true;
    } else {
      updateObjPayment['failedReasonAuthorization'] = responseText;
      // paymentLogging.failReason = responseText;
      console.log('send email through template');
    }
    if (Object.keys(updateObjPayment).length) {
      const newPayment = new PaymentLogging();
      const populatedPayment = DataCopier.copy(newPayment, payment);
      const verifiedPayment = DataCopier.copy(
        populatedPayment,
        updateObjPayment
      );
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
      await this.paymentLoggingRepository.create<IPaymentLogging>(
        verifiedPayment
      );
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
    const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Success';
      if (payment.caseId.debtor.paymentType === 'ck') {
        updateObjPayment['debtorTransId'] = transactionId;
      }
      // paymentLogging.successReason = responseText;
      result = true;
    } else {
      updateObjPayment['failedReasonCaptured'] = responseText;
      // paymentLogging.failReason = responseText;

      console.log('send email'); // add code
    }
    if (Object.keys(updateObjPayment).length) {
      const newPayment = new PaymentLogging();
      const populatedPayment = DataCopier.copy(newPayment, payment);
      const verifiedPayment = DataCopier.copy(
        populatedPayment,
        updateObjPayment
      );
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
      await this.paymentLoggingRepository.create<IPaymentLogging>(
        verifiedPayment
      );
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
    let debtors =
      await this.debtorRepository.getAllWithoutPagination<IDebtor>();
    if (!debtors.length) {
      return [false, constantsUtil.notFoundMessage('debtors')];
    }
    return [true, debtors];
  };

  async createDebtor(req: Request) {
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
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
    let debtor: IDebtor = null;
    let account = [];
    if (req.body.paymentToken && req.body.paymentType) {
      const customerVaultResponse = await caseUtil.createVault(
        req.body.paymentToken
      );
      if (!customerVaultResponse[0]) return customerVaultResponse;
      // req.body.customerVaultId = customerVaultResponse[1];
      account.push({
        paymentType: req.body.paymentType,
        customerVaultId: customerVaultResponse[1],
      });
    }
    if (!getDebtor) {
      if (account.length) req.body.accounts = account;
      debtor = await caseUtil.createDebtor(req);
    }
    if (getDebtor) {
      if (account.length)
        req.body.accounts = getDebtor.accounts.concat(account);
      debtor = await this.debtorRepository.updateById<IDebtor>(
        getDebtor._id,
        req.body
      );
    }
    if (!debtor) {
      return [false, constantsUtil.failureAddMessage('debtor')];
    }
    const creditorNames = await caseUtil.getCreditorNames(
      debtor,
      req.body.extractedFields
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
      }
    );
    if (!updatedDebtor) {
      return [false, constants.failureUpdateMessage('debtor')];
    }
    // for (let doc of findCase.documents) {
    //   const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
    //   doc.url = url;
    // }
    const response = await caseUtil.getAllCreditorsOfDebtor(
      caseTemp.debtor as any
    );
    const creditors = Array.from(
      new Map(
        response.map(creditor => [creditor.creditorId, creditor])
      ).values()
    );
    const extractedFields = await caseUtil.getExtractionMCA(updatedDebtor);
    if (extractedFields)
      caseUtil.getCreditorNames(
        updatedDebtor,
        extractedFields.extracted_fields
      );
    caseUtil.getScoresForAllCreditors(caseTemp, creditors);
    caseUtil.getSettlementRange(caseTemp);
    return [true, updatedDebtor];
  }

  getLumpSumAmount = async (req: Request) => {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) {
      return [false, constantsUtil.notFoundMessage('debtor')];
    }
    return await caseUtil.getLumpSumAmount(req.params.id);
  };

  getFullProfitSettlement = async (req: Request) => {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    await caseUtil.getExtractionMCA(debtor);
    if (!debtor) {
      return [false, constantsUtil.notFoundMessage('debtor')];
    }
    return await caseUtil.getFullProfitSettlement(req.params.id);
  };
}

export default DebtorService;
