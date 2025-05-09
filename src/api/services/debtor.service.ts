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
import commonUtil from '../../utils/common.util';
import {DataCopier} from '../../utils/dataCopier.util';
import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';
import {StrategyRepository} from '../repository/strategy/strategy.repository';
import {IStrategy} from '../../database/interfaces/strategy.interface';
import emailUtil from '../../utils/email.util';
import {BulkUploadRepository} from '../repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../../database/interfaces/bulkUpload.interface';
import {BulkUpload} from '../../database/repomodels/bulkUpload.repomodel';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import paymentUtil from '../../utils/payment.util';
import LawfirmUtil from '../../utils/lawfirm.util';
import moneyThumbUtil from '../../utils/moneyThumb.util';
import creditorUtil from '../../utils/creditor.util';
import debtorUtil from '../../utils/debtor.util';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';
import _ from 'lodash';
import bulkUploadCronjob from '../../cron-job/bulkUpload.cronjob';
import googleDriveUtil from '../../utils/googleDrive.util';
import {cloneDeep} from 'lodash';
import CaseService from './case.service';
import {any} from 'joi';
import {Payment} from '../../database/repomodels/payment.repomodel';
import mongoose from 'mongoose';
import {SyncPaymentMethodRepository} from '../repository/ISyncPaymentMethod/syncPaymentMethod.repository';
import {ISyncPaymentMethod} from '../../database/interfaces/syncPaymentMethod.interface';
import easypayUtil from '../../utils/easypay.util';
import {paymentPlatform} from '../../enums/index';
import {platform} from 'os';
import {ILawfirm} from '../../database/interfaces/lawfirm.interface';
import AttorneyUtil from '../../utils/attorney.util';
import {IAttorney} from '../../database/interfaces/attorney.interface';
import lawsuitUtil from '../../utils/lawsuit.util';
import lawfirmUtil from '../../utils/lawfirm.util';
import TokenService from './token.service';
import {v4} from 'uuid';
import dotenv from 'dotenv';
import CreditorService from './creditor.service';
import paynoteUtil from '../../utils/paynote.util';
dotenv.config();

class DebtorService {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private strategyRepository: StrategyRepository;
  private bulkUploadRepository: BulkUploadRepository;
  private userRepository: UserRepository;
  private caseService: CaseService;
  private uploadUtil: UploadUtil;
  private syncPaymentMethodRepository: SyncPaymentMethodRepository;
  private tokenService: TokenService;
  private creditorService: CreditorService;
  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.paymentService = new PaymentService();
    this.strategyRepository = new StrategyRepository();
    this.bulkUploadRepository = new BulkUploadRepository();
    this.userRepository = new UserRepository();
    this.caseService = new CaseService();
    this.uploadUtil = new UploadUtil();
    this.syncPaymentMethodRepository = new SyncPaymentMethodRepository();
    this.tokenService = new TokenService();
    this.creditorService = new CreditorService();
  }

  getStatementsSummary = async (req: Request) => {
    return debtorUtil.getStatementsSummary(req.params.id);
  };

  getStatementsSummaryWithPf = async (req: Request) => {
    return debtorUtil.getStatmentsSummaryWithPF(req.params.id);
  };

  getDailyCashFlows = async (req: Request) => {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const token = await moneyThumbUtil.authenticateUser();
    const card = await moneyThumbUtil.getScoreCard(token, debtor.appid);
    const getDailyCashFlowsLastDate = debtorUtil.getDailyCashFlowsLastDate(
      card['dailycashflow'].data
    );
    const secondLastMonth = new Date(
      getDailyCashFlowsLastDate.getFullYear(),
      getDailyCashFlowsLastDate.getMonth() - 1,
      1
    );
    const trueCashFlows = debtorUtil.getTrueCashFlows(
      card['dailycashflow'].data,
      secondLastMonth
    );
    const flowsDaysWeightage = debtorUtil.getFlowsDaysWeightage(trueCashFlows);
    const flowsDaysPercentage = debtorUtil.getFlowsDaysPercentage(
      flowsDaysWeightage,
      trueCashFlows.length
    );
    flowsDaysPercentage.sort((a, b) => b.percentage - a.percentage);
    const highestPercentage = flowsDaysPercentage[0].percentage;
    const highest = flowsDaysPercentage
      .filter(item => item.percentage === highestPercentage)
      .map(item => ({[item.day]: item.percentage}));
    const others = flowsDaysPercentage
      .filter(item => item.percentage !== highestPercentage)
      .map(item => ({[item.day]: item.percentage}));
    return {highest: highest, others: others};
  };

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
        SSN: debtor?.basicInformation?.SSID ? debtor.basicInformation.SSID : '',
        fullName: debtor?.basicInformation?.fullName
          ? debtor.basicInformation.fullName
          : '',
        companyName: debtor?.businessInformation?.companyName
          ? debtor.businessInformation.companyName
          : '',
        email: debtor?.basicInformation?.email
          ? debtor.basicInformation.email
          : '',
        status: debtor?.basicInformation?.status
          ? debtor.basicInformation.status
          : '',
        address: debtor?.basicInformation?.address
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
    const filterDebtor = {};
    if (!debtor?.totalStatements && moneyThumbApp['totalstatements']) {
      filterDebtor['totalStatements'] = moneyThumbApp['totalstatements'];
    }
    const curr = new Date(commonUtil.getCurrentDate());
    curr.setUTCHours(0, 0, 0, 0);
    if (curr.setDate(1) > new Date(debtor.percentageChangeDate).getSeconds()) {
      filterDebtor['percentageChange'] = false;
    }
    if (Object.keys(filterDebtor).length) {
      filterDebtor['updatedAt'] = commonUtil.getCurrentDate();
      await this.debtorRepository.updateById(debtor._id, filterDebtor);
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

    if (clientDetails)
      clientDetails = await caseUtil.addWeekRemainingToCases(clientDetails); // Add weekRemaining to each case
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
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    const clientDetails: any = await caseUtil.getClientListingPipeline(
      req,
      keyword
    );
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
    let payment: any = await this.paymentRepository.getById<IPayment>(
      paymentId,
      undefined,
      undefined,
      {path: 'caseId', populate: 'debtor'}
    );
    if (!payment) {
      return [false, constantsUtil.notFoundMessage('payment')];
    }
    const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
    const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
    if (payment.authorized === 'Success') {
      return [false, 'Payment already authorized'];
    }
    let payments: IPayment[] = [];
    let debtor = null;
    let amount = 0;
    if (payment.caseId) debtor = payment.caseId?.debtor;
    if (!payment.caseId) {
      debtor = await this.debtorRepository.getById<IDebtor>(payment.debtorId);
    }
    if (payment.paymentReference) {
      payments = await paymentUtil.getAllPaymentReferenceDocuments(
        payment.paymentReference
      );
      console.log(payments, 'getAllPaymentReferenceDocuments');
      payment = payments.find(payment => {
        return payment.caseId === null;
      });
      amount = payment.amount;
    }
    if (!payment.paymentReference) {
      amount = payment.amount + legalFeeAmount + serviceFeeAmount;
      // amount = payment.amount;
      payments.push(payment);
    }
    let response: any;
    const accounts = debtor.accounts;
    let responseNum = '';
    for (const account of accounts) {
      if (account.paymentType === 'cc') {
        response = await this.paymentService.authorizeCreditCard(
          amount,
          account.customerVaultId,
          account.platform
        );
        responseNum = new URLSearchParams(response).get('response');
        if (responseNum === '1') break;
      }
    }
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['serviceFee'] = serviceFeeAmount;
      updateObjPayment['legalFee'] = legalFeeAmount;
      // updateObjPayment['status'] = 'Pending';
      result = true;
      await emailUtil.sendEmailOrSmsByEvent(
        'successful_authorization',
        '',
        paymentId,
        ''
      );
    } else {
      updateObjPayment['failedReasonAuthorization'] = responseText;
      await emailUtil.sendEmailOrSmsByEvent(
        'failed_authorization',
        '',
        paymentId,
        ''
      );
    }
    if (Object.keys(updateObjPayment).length) {
      for (const payment of payments) {
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
      }
    }
    if (result) return [true, 'Payment authorized successfully!'];
    return [false, 'Unable to authorize payment!'];
  }

  async retryCapture(paymentId: string) {
    let result = false;
    let payment: any = await this.paymentRepository.getById<IPayment>(
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
    let payments: IPayment[] = [];
    let debtor = null;
    if (payment.caseId) debtor = payment.caseId.debtor;
    if (!payment.caseId) {
      debtor = await this.debtorRepository.getById<IDebtor>(payment.debtorId);
    }
    let amount = 0;
    if (payment.paymentReference) {
      payments = await paymentUtil.getAllPaymentReferenceDocuments(
        payment.paymentReference
      );
      payment = payments.find(payment => {
        return payment.caseId === null;
      });
      if (payments.length > 1) {
        const total = payments.reduce((sum, obj) => sum + obj.amount, 0);
        amount = total - payment.amount;
      }
    }
    if (!payment.paymentReference) {
      payments.push(payment);
    }
    let response: any;
    let responseNum = '';
    const accounts = debtor.accounts;
    for (const account of accounts) {
      if (account.paymentType === 'cc') {
        response = await this.paymentService.captureCreditCard(
          account.customerVaultId,
          payment.debtorTransId,
          account.platform
        );
      }
      if (account.paymentType === 'ck') {
        response = await this.paymentService.achCredit(
          account.customerVaultId,
          payment.amount,
          account.platform
        );
      }
      responseNum = new URLSearchParams(response).get('response');
      if (responseNum === '1') break;
    }

    const responseText = new URLSearchParams(response).get('responsetext');
    // const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      lawsuitUtil.updatePaymentLawsuit(payments);
      if (!payment.debtorTransId) {
        updateObjPayment['debtorTransId'] = transactionId;
      }
      result = true;
      await emailUtil.sendEmailOrSmsByEvent(
        'successful_capture',
        '',
        paymentId,
        ''
      );
      console.log(amount, 'amounttttt');
      if (amount) {
        const commissionAmount = parseFloat(
          (payment.amount - amount).toFixed(2)
        );
        // await this.paymentRepository.updateById<IPayment>(payment._id, {
        //   amount: commissionAmount,
        // });
        await this.debtorRepository.updateById(payment.debtorId, {
          $inc: {commissionPaid: commissionAmount},
        });
      }
      if (!amount && payment.caseId === null) {
        await this.debtorRepository.updateById(payment.debtorId, {
          $inc: {commissionPaid: payment.amount},
        });
      }
      // if (!amount && payment.caseId !== null && payment.commision) {
      //   await this.debtorRepository.updateById(payment.debtorId, {
      //     $inc: {commissionPaid: payment.commision},
      //   });
      // }
    } else {
      updateObjPayment['failedReasonCaptured'] = responseText;
      await emailUtil.sendEmailOrSmsByEvent(
        'failed_capture',
        '',
        paymentId,
        ''
      );
    }
    if (Object.keys(updateObjPayment).length) {
      for (const payment of payments) {
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
      }
    }
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

    let lawsuitExtractedFields: any = {};

    if (!getDebtor) {
      if (body.basicInformation.weeklyBudget) {
        body.weeklyBudgetStrategy1 = body.basicInformation.weeklyBudget;
      }
      if (body?.lawsuitDocuments?.length) {
        lawsuitExtractedFields = await caseUtil.getExtractionLawsuit(
          body?.lawsuitDocuments
        );
        body.lawsuitFields = [lawsuitExtractedFields.result];
      }
      debtor = await caseUtil.createDebtor(body, id);
    } else {
      const newFiles = await this.updateDebtorIdExist(getDebtor, body);
      if (newFiles?.lawsuitDocuments.length) {
        lawsuitExtractedFields = await caseUtil.getExtractionLawsuit(
          newFiles?.lawsuitDocuments
        );
        if (lawsuitExtractedFields?.result) {
          body.lawsuitFields = getDebtor?.lawsuitFields
            ? [...getDebtor.lawsuitFields, lawsuitExtractedFields.result]
            : [lawsuitExtractedFields.result];
        }
      }
      body.lawsuitDocuments = getDebtor?.lawsuitDocuments.length
        ? [...getDebtor.lawsuitDocuments, ...newFiles.lawsuitDocuments]
        : newFiles.lawsuitDocuments;
      body.bankStatementDocuments = getDebtor?.bankStatementDocuments.length
        ? [
            ...getDebtor.bankStatementDocuments,
            ...newFiles.bankStatementDocuments,
          ]
        : newFiles.bankStatementDocuments;
      body.mcaDocuments = getDebtor?.mcaDocuments.length
        ? [...getDebtor.mcaDocuments, ...newFiles.mcaDocuments]
        : newFiles.mcaDocuments;
      body.otherDocuments = getDebtor?.otherDocuments.length
        ? [...getDebtor.otherDocuments, ...newFiles.otherDocuments]
        : newFiles.otherDocuments;

      body.updatedAt = commonUtil.getCurrentDate();
      debtor = await this.debtorRepository.updateById<IDebtor>(
        getDebtor._id,
        body
      );
    }
    if (!debtor) {
      return [false, constantsUtil.failureAddMessage('debtor')];
    }
    if (lawsuitExtractedFields?.result) {
      const lawfirmTemp = await lawfirmUtil.lawfirmDetails(
        lawsuitExtractedFields,
        id
      );
      await lawfirmUtil.upsertLawfirm(lawfirmTemp);
    }
    moneyThumbUtil.run(
      debtor,
      await debtorUtil.normalizeCompanyName(
        debtor.businessInformation.companyName
      )
    );
    const creditorNames = await caseUtil.getCreditorNames(
      debtor,
      body.extractedFields
    );

    return [true, {debtor, creditorNames}];
  }

  async addDocumentsToDebtor(req: Request) {
    let reqTemp: any = req;
    const caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor', 'creditor']
    );
    if (!caseTemp) {
      return [false, constants.notFoundMessage('case')];
    }
    let lawsuitExtractedFields: any = [];
    const newFiles = await this.updateDebtorIdExist(caseTemp.debtor, req.body);
    if (newFiles?.lawsuitDocuments.length) {
      lawsuitExtractedFields = await caseUtil.getExtractionLawsuit(
        newFiles?.lawsuitDocuments
      );
    }

    const updateData: any = {
      $push: {
        mcaDocuments: {$each: newFiles.mcaDocuments},
        bankStatementDocuments: {$each: newFiles.bankStatementDocuments},
        otherDocuments: {$each: newFiles.otherDocuments},
        lawsuitDocuments: {$each: newFiles.lawsuitDocuments},
      },
      updatedAt: commonUtil.getCurrentDate(),
    };

    if (lawsuitExtractedFields?.result) {
      updateData.$push.lawsuitFields = {$each: [lawsuitExtractedFields.result]};
    }

    const updatedDebtor = await this.debtorRepository.updateById<IDebtor>(
      caseTemp.debtor._id,
      updateData
    );

    if (!updatedDebtor) {
      return [false, constants.failureUpdateMessage('debtor')];
    }

    if (req.query.lawfirmCancelPlan === 'true') {
      await lawsuitUtil.cancelPlan(caseTemp.debtor._id, caseTemp.creditor._id);
    }
    // if (!caseTemp.lawsuitExist && lawfirmCancelPlan === 'true') {
    //   const lawsuitFields =
    //     updatedDebtor.lawsuitFields?.find(
    //       lawsuit =>
    //         lawsuit.plaintiff_company ===
    //           caseTemp.creditor.businessInformation.companyName &&
    //         lawsuit.defendant_company ===
    //           caseTemp.debtor.businessInformation.companyName
    //     ) || null;
    //   if (lawsuitFields) {
    //     if (caseTemp.dummyLawsuitExist) {
    //       await lawsuitUtil.deleteLawsuit(
    //         caseTemp.debtor._id,
    //         caseTemp.creditor._id
    //       );
    //     }
    //     const lawsuitDetails = await lawsuitUtil.lawsuitDetails(
    //       lawsuitFields,
    //       reqTemp.id
    //     );
    //     const lawfirmTemp = await lawsuitUtil.lawsuitFormation(
    //       lawsuitDetails,
    //       caseTemp
    //     );
    //     if (lawfirmTemp) {
    //       await this.caseRepository.updateById(req.params.id, {
    //         lawsuitExist: true,
    //         dummyLawsuitExist: false,
    //       });
    //     }
    //   }
    // }
    if (newFiles.bankStatementDocuments.length) {
      this.caseRepository.updateById<ICase>(req.params.id, {
        settlementRange: false,
        updatedAt: commonUtil.getCurrentDate(),
      });
      await moneyThumbUtil.run(
        updatedDebtor,
        await debtorUtil.normalizeCompanyName(
          updatedDebtor.businessInformation.companyName
        )
      );
    }
    const statements = caseTemp.debtor?.totalStatements;
    if (caseTemp.intervals.length && !updatedDebtor.percentageChange) {
      debtorUtil.percentageChangeEmail(
        updatedDebtor.businessInformation.companyName,
        String(updatedDebtor._id),
        statements ? statements : 0,
        caseTemp.debtor?.basicInformation?.fullName,
        req.params.id
      );
    }
    return [true, []];
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
    let lumpSum = {};
    if (caseTemp.strategyTwo) {
      const result = await this.strategyRepository.getOne<IStrategy>({
        caseId: String(caseTemp._id),
        name: 'strategy_two',
      });
      lumpSum = result.data.lumpSumAmount.lumpsum_settlement;
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
    const debtorName = getDebtor?.basicInformation?.fullName;
    const customerVaultResponse = await caseUtil.createVault(
      req.body.paymentToken,
      req.body.platform,
      debtorName,
      getDebtor.basicInformation.email
    );
    if (!customerVaultResponse[0]) return customerVaultResponse;

    await this.debtorRepository.updateById<IDebtor>(getDebtor._id, {
      $push: {
        accounts: {
          $each: [
            {
              paymentType: req.body.paymentType,
              customerVaultId: customerVaultResponse[1],
              platform: req.body.platform,
            },
          ],
        },
      },
      updatedAt: commonUtil.getCurrentDate(),
    });
    return [true, {customerVaultId: customerVaultResponse[1]}];
  }

  async updateDebtorAccount(req: Request) {
    const syncId = req.params.id;
    const {customerVaultId, paymentToken, paymentType, platform} = req.body;

    const getDebtor = await this.debtorRepository.getById<IDebtor>(syncId);
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }

    const debtorName = getDebtor.basicInformation?.fullName;
    const customerVaultResponse = await caseUtil.updateVault(
      customerVaultId,
      paymentToken,
      platform,
      debtorName
    );

    if (!customerVaultResponse[0]) return customerVaultResponse;

    await this.debtorRepository.updateByOne(
      {'accounts.customerVaultId': customerVaultId},
      {
        $set: {
          'accounts.$.paymentType': paymentType,
          updatedAt: commonUtil.getCurrentDate(),
        },
      }
    );

    return [true, constants.successUpdateMessage('Debtor account')];
  }

  async deleteDebtorAccount(req: Request) {
    const {id} = req.params;
    const {customerVaultId} = req.body;

    const updatedDebtor = await this.debtorRepository.updateById(id, {
      $pull: {accounts: {customerVaultId: customerVaultId}},
    });

    if (!updatedDebtor) {
      return [false, 'Debtor not found'];
    }

    return [true, constants.successDeleteMessage('Debtor account')];
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

  async generateVideoWithGenAi(req: Request) {
    // let reqTemp: any;
    // const user = await this.userRepository.getById<IUser>(reqTemp.id);
    // if (!user) return [false, constants.notFoundMessage('User'), {}];

    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );

    if (!getDebtor) return [false, constants.notFoundMessage('Debtor'), {}];

    let getVideo = await debtorUtil.generateVideoWithGenAi(getDebtor);
    // await emailUtil.sendEmailToDebtorForInitialOverView(
    //   getDebtor,
    //   getVideo[0]?.permalink
    // );
    return !_.isEmpty(getVideo[0]?.permalink)
      ? [true, []]
      : [false, constants.notFoundMessage('Video')];
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
    if (!createDebtor[0]) return [false, constants.failureAddMessage('debtor')];
    await this.debtorRepository.updateById<IDebtor>(
      String(createDebtor[1]['debtor']._id),
      {userId: reqTemp.id}
    );
    console.log(
      createDebtor[1]['creditorNames'],
      'createDebtor[1][creditorNames]'
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
          copyCaseTemp[i].creditor?.businessInformation?.companyName;
        finalObj['paybackAmount'] = result[1][i].totalDebt;
        finalObj['balance'] = result[1][i].remaining;
        finalObj['apr'] = await commonUtil.getValuePercenatge(
          result[1][i].contractDetails.purchased_percentage
        );
        finalObj['currentPayment'] =
          await commonUtil.removeDashesAndRoundBrackets(
            result[1][i].contractDetails.repayment_amount
          );
        finalObj['caseId'] = String(result[1][i]._id);
        finalArray.push(finalObj);
        finalObj = {};
      }
    }
    if (!finalArray.length) return [false, 'Could not create cases'];
    return [
      true,
      {creditors: finalArray, debtorId: createDebtor[1]['debtor']._id},
    ];
  }

  async analyzeAndGetSettlementRanges(req: Request) {
    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    const combineResult = {};
    if (getDebtor.videoUrl) combineResult['videoUrl'] = getDebtor.videoUrl;
    if (!getDebtor.videoUrl) {
      const response = await debtorUtil.generateVideoWithGenAi(getDebtor);
      if (Array.isArray(response)) {
        await this.debtorRepository.updateById(req.params.id, {
          videoUrl: response[0].permalink,
        });
      }
      combineResult['videoUrl'] = response[0].permalink;
    }
    const debtorCreditors = await caseUtil.getAllCreditorsByCaseIds(
      req.body.caseIds
    );
    const moneyThumb = await debtorUtil.getScoreCard(getDebtor);
    const scoreCard = moneyThumb.scoreCard;
    const plans = {};
    const commissionPlan = {};
    const allCreditorsResult = [];
    const creditors = [];
    const metricData = scoreCard['metrics']['metricdata'];
    if (metricData?.length) {
      const revenueArray = metricData.find(row => row[0] === 'Revenue');
      combineResult['avgMonthlySales'] = parseFloat(revenueArray[1]);
    }
    const mcaCompanies = scoreCard['mcacompanies'];
    const getTotalBudget = await moneyThumbUtil.getTotalBudget(mcaCompanies);
    const getProfitAndTrueRevenue =
      await moneyThumbUtil.getAnuallyProfitAndTrueRevenue(metricData);
    const netProfitMargin =
      (Math.abs(getTotalBudget) + getProfitAndTrueRevenue.profit) /
      getProfitAndTrueRevenue.trueRevenue;

    const netProfitMargin100 = netProfitMargin * 100;
    combineResult['netProfitMargin'] =
      Math.round(netProfitMargin100 * 100) / 100;
    if (debtorCreditors.length) {
      const totalRemaining = debtorCreditors.reduce(
        (sum, obj) => sum + obj.remaining,
        0
      );
      plans['weeklyPayment'] = parseFloat(
        ((totalRemaining / 12 / 22) * 5).toFixed(2)
      );
      commissionPlan['4Week'] = parseFloat((totalRemaining * 0.12).toFixed(2));
      combineResult['plans'] = plans;
      combineResult['commissionPlan'] = commissionPlan;
      for (const creditor of debtorCreditors) {
        const capture = {};
        const creditorObj = {};
        capture['name'] = creditor.creditorAccountTitle;
        capture['payableAmount'] = creditor.totalDebt;
        const balance = creditor.totalDebt - creditor.remainingAmountPaid;
        capture['balance'] = balance < 0 ? 0 : balance;
        const weeklyPayment = parseFloat(
          ((creditor.remaining / 12 / 22) * 5).toFixed(2)
        );
        capture['weeklyPayment'] = weeklyPayment;
        creditorObj['weeklyPayment'] = weeklyPayment;
        capture['interestRate'] = '12';
        creditorObj['name'] = creditor.creditorAccountTitle;
        // creditorObj['maximum'] = creditor.breakEven;
        // creditorObj['percentageShare'] = creditor.percentageReceivable;
        creditors.push(creditorObj);
        allCreditorsResult.push(capture);
      }

      combineResult['allCreditorsResult'] = allCreditorsResult;
      combineResult['creditors'] = creditors;
    }
    const accounts = scoreCard['accountslist']['data'];
    const yearlyResults = await debtorUtil.getYearlySales(accounts);
    combineResult['yearlySales'] = yearlyResults;
    const yearlyProfitMargin =
      await debtorUtil.getYearlyProfitMargin(scoreCard);
    combineResult['yearlyProfitMargin'] = yearlyProfitMargin;
    return [true, combineResult];
  }

  async addPaymentPlan(req: Request) {
    let debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    if (debtor.intervals && debtor.intervals.length)
      return [false, constants.alreadyExistsMessage('Debtor payment plan')];

    // if (debtor.weeklyCommission)
    //   return [false, 'Weekly commission already settled'];
    // req.body.isExempt = false;
    const checkCasePayment = await caseUtil.checkCasePayment(
      req.body,
      debtor.totalCommission
    );
    if (!checkCasePayment[0]) return checkCasePayment;
    req.body._id = null;
    req.body.debtor = req.params.id;
    debtor = await this.debtorRepository.updateById<IDebtor>(req.params.id, {
      intervals: req.body.intervals,
      isExempt: req.body.isExempt,
    });
    req.body.intervals = debtor.intervals;
    req.body.debtorName = debtor.basicInformation.fullName;
    req.body.creditorName = '';
    caseUtil.createPayment(req.body);

    return [true, constants.successAddMessage('Payment plan')];
  }

  async addManualPayment(req: Request) {
    let debtor = await this.debtorRepository.getById(req.body.debtorId);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }

    const foundPayment = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: req.body.referenceId,
    });
    if (foundPayment)
      return [false, constants.alreadyExistsMessage('Reference id')];

    let updatedPayment = await this.paymentRepository.updateMany<IPayment>(
      {_id: req.body.transactionIds},
      {
        authorized: 'Success',
        captured: 'Success',
        status: 'Pending',
        dueDate: req.body.transactionDate,
        debtorTransId: req.body.referenceId,
        paymentMode: req.body.transactionType,
        paymentGateway: 'Manual',
        manualCommission: req.body.commission,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );

    if (!updatedPayment) {
      return [false, constants.failureAddMessage('Manual Payment')];
    }
    if (updatedPayment) {
      let updatedDebtor = await this.debtorRepository.updateById<IDebtor>(
        req.body.debtorId,
        {
          $inc: {commissionPaid: req.body.commission},
        }
      );

      if (!updatedDebtor) {
        return [false, constants.failureAddMessage('Manual Payment')];
      }
    }
    return [true, constants.successAddMessage('Manual Payment')];
  }

  async updateWeeklyBudget(req: Request): Promise<[boolean, IDebtor | string]> {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('case')];
    }
    const updateDebtor = await this.debtorRepository.updateById<IDebtor>(
      req.params.id,
      {
        'basicInformation.weeklyBudget': req.body.weeklyBudget,
      }
    );
    if (!updateDebtor) {
      return [false, constants.failureUpdateMessage('debtor')];
    }
    return [true, updateDebtor];
  }

  async getManualPayments(req: Request) {
    let debtor = await this.debtorRepository.getById(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    let manualPayments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          paymentMode: 'Wire',
          debtorId: req.params.id,
        },
        undefined,
        undefined,
        {_id: -1}
      );

    if (!manualPayments.length) {
      return [false, constants.notFoundMessage('manual payments')];
    }

    const groupedByTransId = manualPayments.reduce((acc, item) => {
      if (!acc[item.debtorTransId]) {
        acc[item.debtorTransId] = [];
      }
      acc[item.debtorTransId].push(item);
      return acc;
    }, {});
    return [true, groupedByTransId];
  }

  async revertPayments(req: Request) {
    let debtor = await this.debtorRepository.getById(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    let manualPayment = await this.paymentRepository.getOne<IPayment>({
      debtorId: req.params.id,
      debtorTransId: req.body.referenceId,
    });
    let result = await this.paymentRepository.updateMany<IPayment>(
      {
        debtorId: req.params.id,
        debtorTransId: req.body.referenceId,
      },
      {
        authorized: 'Pending',
        captured: 'Pending',
        status: 'Upcoming',
        debtorTransId: '',
        paymentMode: '',
        manualCommission: 0,
        paymentGateway: '',
        retriesAuth: 0,
        retriesCapture: 0,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );

    if (!result) {
      return [false, 'Could not revert payments'];
    }

    if (
      result.modifiedCount &&
      (manualPayment.paymentMode === 'Wire' ||
        manualPayment.paymentMode === 'Check')
    ) {
      await this.debtorRepository.updateById<IDebtor>(req.params.id, {
        $inc: {commissionPaid: -req.body.commission},
      });
    }
    return [true, 'Payments reverted successfully'];
  }

  async getExtractFieldsAndDebtor(req: Request) {
    const reqTemp: any = req;
    const files = {...reqTemp.files};
    const debtorId = reqTemp?.body?.debtorId;

    if (!files.mcaDocuments && !debtorId) {
      return [false, constantsUtil.Messages.ATTATCH_FILE_ERROR];
    }

    let previousMca = [];
    let newMca = [];
    let debtorBody: any = [];
    if (!debtorId) {
      const extractedFields = await caseUtil.getExtractionMCABuffer(
        files.mcaDocuments
      );
      const lawsuitFields = await caseUtil.getExtractionLawsuitBuffer(
        files.lawsuitDocuments
      );
      if (typeof extractedFields === 'string') return [false, extractedFields];

      debtorBody = await debtorUtil.mapDebtor(extractedFields.extracted_fields);

      const checkDebtorAlreadyExist: any =
        await this.checkDebtorAlreadyExist(debtorBody);

      if (checkDebtorAlreadyExist[0]) {
        previousMca = checkDebtorAlreadyExist[1].mcaDocuments.map(obj => {
          return obj.originalFileName;
        });

        return [
          true,
          {
            debtorId: String(checkDebtorAlreadyExist[1]._id),
            extractedFields: checkDebtorAlreadyExist[1].extractedFields,
            newMca,
            previousMca,
          },
        ];
      }
      const lawfirmTemp = await lawfirmUtil.lawfirmDetails(
        lawsuitFields,
        reqTemp.id
      );
      await lawfirmUtil.upsertLawfirm(lawfirmTemp);
      debtorBody['lawsuitFields'] = [lawsuitFields.result];
      debtorBody['extractedFields'] = extractedFields.extracted_fields;
      debtorBody = await this.uploadAndAssignFiles(files, debtorBody);
    } else {
      if (!mongoose.Types.ObjectId.isValid(debtorId)) {
        return [false, 'Invalid Debtor Id!'];
      }

      const debtorExist: any = await this.checkDebtor(debtorId);
      if (!debtorExist) return [false, constantsUtil.notFoundMessage('Debtor')];
      const newFiles = await this.updateDebtorIdExist(debtorExist[1], files);
      previousMca = debtorExist[1].mcaDocuments.map(obj => {
        return obj.originalFileName;
      });
      if (
        !newFiles.mcaDocuments.length &&
        !newFiles.bankStatementDocuments.length &&
        !newFiles.otherDocuments.length &&
        !newFiles.lawsuitDocuments.length
      ) {
        return [
          true,
          {
            debtorId: String(debtorExist[1]._id),
            extractedFields: debtorExist[1].extractedFields,
            newMca,
            previousMca,
          },
        ];
      }
      if (newFiles.lawsuitDocuments && newFiles.lawsuitDocuments.length) {
        const lawsuitFieldsNewFiles = await caseUtil.getExtractionLawsuitBuffer(
          files.lawsuitDocuments
        );
        debtorExist[1].lawsuitFields.push(...[lawsuitFieldsNewFiles.result]);
      }

      // Process MCA documents if any new ones exist
      if (newFiles.mcaDocuments && newFiles.mcaDocuments.length) {
        const extractedFieldsForNewFiles =
          await caseUtil.getExtractionMCABuffer(newFiles.mcaDocuments);
        if (typeof extractedFieldsForNewFiles !== 'string') {
          debtorExist[1].extractedFields.push(
            ...extractedFieldsForNewFiles.extracted_fields
          );
          newMca = newFiles.mcaDocuments.map(obj => {
            return obj.originalname;
          });
        }
      }
      // Upload and assign new files to debtorBody
      const updatedDebtorBody = await this.uploadAndAssignFiles(
        newFiles,
        debtorExist[1]
      );

      // If debtorBody was successfully updated, save the changes
      if (updatedDebtorBody) {
        const updateResult: IDebtor = await this.debtorRepository.updateById(
          debtorExist[1]._id,
          updatedDebtorBody
        );

        // Return the updated debtor ID and extracted fields
        return [
          true,
          {
            debtorId: String(updateResult._id),
            extractedFields: updateResult.extractedFields,
            newMca,
            previousMca,
          },
        ];
      }
    }
    // const lawfirmData = (await LawfirmUtil.lawfirmData(reqTemp)) as ILawfirm;
    // const createLawfirm = await LawfirmUtil.createLawfirm(lawfirmData);
    // const attorneyData = (await AttorneyUtil.attorneyData(
    //   reqTemp
    // )) as IAttorney;
    // attorneyData['lawfirmId'] = createLawfirm._id;
    // const createAttorney = await AttorneyUtil.createAttorney(attorneyData);

    return await this.createDebtorForPortal(debtorBody, 'Debtor Portal');
  }

  async updateDebtorIdExist(debtor: any, files: any) {
    return {
      mcaDocuments: await this.getNewFiles(
        files.mcaDocuments,
        debtor.mcaDocuments
      ),
      bankStatementDocuments: await this.getNewFiles(
        files.bankStatementDocuments,
        debtor.bankStatementDocuments
      ),
      otherDocuments: await this.getNewFiles(
        files.otherDocuments,
        debtor.otherDocuments
      ),
      lawsuitDocuments: await this.getNewFiles(
        files.lawsuitDocuments,
        debtor.lawsuitDocuments
      ),
    };
  }

  private async getNewFiles(newFiles: any[], existingFiles: any[]) {
    if (!newFiles || !newFiles.length) return [];

    const existingKeys = existingFiles?.length
      ? existingFiles?.map(
          (doc: any) => doc?.originalFileName || doc?.originalname
        )
      : [];
    return newFiles.filter(
      (file: any) =>
        !existingKeys.includes(file?.originalname || file?.originalFileName)
    );
  }

  async uploadAndAssignFiles(files, debtorBody) {
    const uploadAndAppend = async (fileKey, debtorKey) => {
      if (files[fileKey]?.length) {
        const uploadedFiles = await this.uploadUtil.awsS3FileUpload(
          files[fileKey],
          true
        );
        debtorBody[debtorKey] = debtorBody[debtorKey]?.length
          ? [...debtorBody[debtorKey], ...uploadedFiles]
          : uploadedFiles;
      }
    };

    await uploadAndAppend('mcaDocuments', 'mcaDocuments');
    await uploadAndAppend('bankStatementDocuments', 'bankStatementDocuments');
    await uploadAndAppend('otherDocuments', 'otherDocuments');
    await uploadAndAppend('lawsuitDocuments', 'lawsuitDocuments');

    return debtorBody;
  }

  async checkDebtor(id: string) {
    const debtor = await this.debtorRepository.getById<IDebtor>(id);
    return debtor ? [true, debtor] : false;
  }

  async checkDebtorAlreadyExist(body: any) {
    const debtor = await this.debtorRepository.getOne({
      $or: [
        {'businessInformation.EIN': body.businessInformation.EIN},
        {
          'businessInformation.companyName':
            body.businessInformation.companyName,
        },
      ],
    });
    return debtor ? [true, debtor] : [false];
  }

  async createDebtorForPortal(body: any, source: string) {
    let previousMca = [];
    let newMca = [];

    body.status = 'Pending';
    const debtor = await caseUtil.createDebtor(body, source);
    newMca = debtor.mcaDocuments.map(obj => {
      return obj.originalFileName;
    });

    return debtor
      ? [
          true,
          {
            debtorId: String(debtor._id),
            extractedFields: debtor.extractedFields,
            newMca,
            previousMca,
          },
        ]
      : [false, constantsUtil.failureAddMessage('debtor')];
  }

  async getDebtorExtractedFields(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    const mcaDocuments = debtor.mcaDocuments.map(obj => {
      return obj.originalFileName;
    });
    const bankStatementDocuments = debtor.bankStatementDocuments.map(obj => {
      return obj.originalFileName;
    });
    const otherDocuments = debtor.otherDocuments.map(obj => {
      return obj.originalFileName;
    });

    return [
      true,
      {
        extractedFields: debtor.extractedFields,
        mcaDocuments: mcaDocuments,
        bankStatementDocuments: bankStatementDocuments,
        otherDocuments: otherDocuments,
      },
    ];
  }

  async getClientSyncEmail(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('client')];
    const result =
      await this.syncPaymentMethodRepository.getOne<ISyncPaymentMethod>({
        syncId: req.params.id,
        platform: req.query.platform,
      });
    return result
      ? [true, result.email]
      : [true, debtor.basicInformation.email];
  }

  async clientSync(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('client')];
    const email = req.body.email.toLowerCase();
    console.log(req.body);

    if (
      req.body?.platform == 'Easypay direct' ||
      req.body?.platform == 'Seamlesschex merchant'
    ) {
      const platformExists = Object.values(paymentPlatform).includes(
        req.body?.platform
      );
      console.log('platform', platformExists);
      if (!platformExists) return [false, constants.Messages.INVALID_PLATFORM];

      const customers = await easypayUtil.getEasyPayCustomers(
        req.body.platform
      );
      const checkClientExist = await easypayUtil.checkClientExist(
        customers,
        email,
        req.body.platform,
        req.params.id,
        debtor
      );
      console.log(checkClientExist[1]['userId']);
      if (checkClientExist[0]) {
        await easypayUtil.upsertDebtorEasyPayEmail(
          req.params.id,
          email,
          req.body.platform,
          checkClientExist[1]['userIds']
        );
      }
      return checkClientExist;
    }
    if (req.body?.platform == 'Paynote') {
      req.query.type = 'debtor';
      const result = await this.creditorService.syncPaynote(req);
      console.log('result', result);
      if (!result[0]) return result;
      if (result[0] && !result[1].paynoteSourceIds?.length)
        return [false, 'Could not found user account'];

      const res = await paynoteUtil.selectPreferredPaynoteSource(
        result[1].paynoteSourceIds
      );

      const sourceIdExist = debtor.paynoteSourceIds?.includes(res.source_id);
      if (sourceIdExist) return [true, []];
      const updatedDebtor = await paynoteUtil.addPaynoteAccount(
        debtor._id,
        res.user_id,
        res.source_id
      );

      if (!updatedDebtor)
        return [false, constantsUtil.failureUpdateMessage('Debtor')];
      return [true, 'Account added successfully'];
    }
    return 0;
  }

  async clientFinancialSummary(req: Request) {
    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );

    if (!getDebtor) return [false, constants.notFoundMessage('Client')];

    const cases: ICase[] =
      await this.caseRepository.getAllWithoutPagination<ICase>(
        {debtor: req.params.id, isDeleted: false},
        'remaining'
      );

    const totalRemaining = cases.reduce(
      (sum: any, caseItem: any) => sum + (caseItem.remaining || 0),
      0
    );

    const getPayments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          debtorId: req.params.id,
          isDeleted: false,
        },
        'authorized captured amount dueDate transactionType paymentGateway debtorName timePeriod retriesAuth retriesCapture'
      );

    return [true, {debtBalance: totalRemaining, paymentHistory: getPayments}];
  }

  async addDebtorInvoice(req: Request) {
    const getDebtor = await this.debtorRepository.getById<IDebtor>(req.body.id);
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    const debtorName = getDebtor?.basicInformation?.fullName;
    const response = await debtorUtil.createPaymentInvoice(
      req.body.platform,
      req.body.id,
      req.body.amount,
      req.body.email,
      debtorName
    );
    if (!response[0]) return response;
    return response;
  }

  async pauseDebtorPayments(req: Request) {
    const reqTemp: any = req;
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }

    const pausePaymentCheck = await paymentUtil.pausePaymentChecks(
      debtor,
      req.body.amount
    );

    if (!pausePaymentCheck[0]) return pausePaymentCheck;

    if (!debtor.additionalCharge && process.env.environment === 'prod') {
      let additionalCharge: any = await paymentUtil.getAdditionalCharge(debtor);

      if (!additionalCharge[0]) {
        await emailUtil.sendEmailOrSmsByEvent(
          'failed_capture',
          null,
          null,
          reqTemp.id,
          null,
          debtor
        );
        return [false, additionalCharge[1].failedReasonAuthorization];
      }
      await emailUtil.sendEmailOrSmsByEvent(
        'successful_capture',
        null,
        null,
        reqTemp.id,
        null,
        debtor
      );
      this.debtorRepository.updateById<IDebtor>(debtor._id, {
        additionalCharge: true,
      });
    }

    let updateDebtor = null;
    let eventValue = null;
    let creditorsPayment = null;
    const filter: any = {
      debtorId: req.params.id,
      caseId: null,
      isDeleted: {$ne: true},
      attorneyId: null,
      authorized: {$ne: 'Success'},
      paymentMode: {$nin: ['Wire', 'Check', 'Cash', 'Additional Charge']},
    };

    if (req.body?.paymentId) {
      filter._id = req.body.paymentId;
    }
    const payments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(filter);

    if (!payments.length) return [false, constants.notFoundMessage('Payments')];

    let successMessage = null;

    if (req.body.endDate) {
      const updateDatesPayment = await paymentUtil.pausePaymentByDay(
        payments,
        req.body.endDate
      );
      if (req.body.paymentId) {
        eventValue = 'pause_single_payment';
      }
      if (!eventValue) eventValue = 'pause_all_payments';
      successMessage = updateDatesPayment[1];
      creditorsPayment = updateDatesPayment[2];
    } else if (req.body.paymentId && req.body.amount) {
      const newPayment = await paymentUtil.changePaymentAmmount(
        payments[0],
        req.body.amount,
        debtor
      );

      if (!newPayment[0]) return [false, newPayment[1]];
      updateDebtor = debtorUtil.updateDebtorPausePayment(req.params.id, true);
      eventValue = 'change_payment_amount';
      successMessage = 'Change the payment amount';
      creditorsPayment = newPayment[2];
    } else if (req.body.paymentId) {
      const updatePayment = await paymentUtil.moveToLastPayment(
        payments[0],
        debtor,
        false
      );
      if (!updatePayment[0]) return [false, updatePayment[1]];
      eventValue = 'move_payment_to_last';
      successMessage = 'Payments move to the last';
      creditorsPayment = updatePayment[2];
    }
    if (!updateDebtor) {
      debtorUtil.updateDebtorPausePayment(req.params.id, false);
    }
    await emailUtil.sendEmailPausePayment(
      reqTemp.id,
      eventValue,
      creditorsPayment
    );
    return [true, constants.successfullyMessage(successMessage)];
  }

  async getDebtorPayments(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);

    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);

    const filter = {
      debtorId: req.params.id,
      caseId: null,
      isDeleted: {$ne: true},
      attorneyId: null,
      authorized: {$ne: 'Success'},
      paymentMode: {$nin: ['Wire', 'Check', 'Cash', 'Additional Charge']},
    };

    const payments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        filter,
        undefined,
        undefined,
        {dueDate: 1},
        undefined,
        undefined,
        pageLimit.page,
        pageLimit.limit
      );

    if (!payments) return [true, constants.notFoundMessage('Payments')];

    const totalCount = await paymentUtil.paymentTotalCount(req.params.id);

    const getPayment = [];
    for (const payment of payments) {
      const {
        totalLegalFeeAmount = 0,
        totalServiceFeeAmount = 0,
        creditorsAmount = 0,
      } = await paymentUtil.getOtherPaymentsTotal(payment);

      const creditorPayments = await paymentUtil.getCreditorPayments(payment);
      if (!creditorPayments.length) continue;

      const legalFee = totalLegalFeeAmount;
      const serviceFee = totalServiceFeeAmount;
      const commissionFee = !payment.calculateComission
        ? payment.amount - legalFee - serviceFee - creditorsAmount
        : 0;

      const total = legalFee + serviceFee + commissionFee;

      getPayment.push({
        ...payment.toObject(),
        legalFee,
        serviceFee,
        commissionFee: commissionFee > 0 ? commissionFee : 0,
        creditorsAmount,
        total,
        creditorPayments,
      });
    }

    return [true, {totalCount, payments: getPayment}];
  }

  async getToken(req: Request) {
    const getDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );
    if (!getDebtor) {
      return [false, constants.notFoundMessage('debtor')];
    }
    const token = await this.tokenService.createVerifyToken(
      req.params.id,
      process.env.verifyKey!,
      '1m'
    );
    return [
      true,
      {
        token: token,
      },
    ];
  }

  async getTopPayees(req: Request) {
    let debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);

    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    if (!debtor.appid) {
      await moneyThumbUtil.run(
        debtor,
        await debtorUtil.normalizeCompanyName(
          debtor.businessInformation.companyName
        )
      );
      debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    }
    const result = await caseUtil.getTopPayees(debtor.appid, req.body.months);

    return result;
  }
}

export default DebtorService;
