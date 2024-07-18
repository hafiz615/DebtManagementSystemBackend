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
          'basicInformation.SSID': {
            $regex: new RegExp(text), // Case-insensitive match for SSID
          },
        },
        {
          'basicInformation.phone': {
            $regex: new RegExp(text), // Case-insensitive match for phone
          },
        },
      ],
    });
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }

  async listingDetails(req: Request) {
    let casesCount = 0;
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
    if (req.query.filter === 'true' || req.query.search === 'true') {
      casesCount = clientDetails.caseHistory.length;
    } else {
      casesCount = await this.caseRepository.getCount<ICase>({
        debtor: req.params.id,
        isDeleted: false,
      });
    }
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
    let reqTemp: any = req;
    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    let match = {isDeleted: {$ne: true}};
    let countFilter = {};
    if (keyword === 'viewClientsForSelf') {
      match['$or'] = [
        {caseOwnerId: reqTemp.id},
        {negotiatorId: reqTemp.id},
        {managerId: reqTemp.id},
      ];
      countFilter['$or'] = [
        {caseOwnerId: reqTemp.id},
        {negotiatorId: reqTemp.id},
        {managerId: reqTemp.id},
      ];
    }
    const pipeline: any = await caseUtil.getClientListingPipeline(req, match);
    const clientDetails: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    if (req.query.filter === 'true' || req.query.search === 'true') {
      debtorsCount = clientDetails.length;
    } else {
      if (keyword === 'viewClientsForSelf') {
        const cases =
          await this.caseRepository.getAllWithoutPagination<ICase>(countFilter);
        const setCount = new Set<string>();
        for (const caseTemp of cases) {
          setCount.add(String(caseTemp.debtor));
        }
        debtorsCount = setCount.size;
      } else {
        debtorsCount =
          await this.debtorRepository.getCount<IDebtor>(countFilter);
      }
    }
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
    const email = req.body.basicInformation.email.toLowerCase();
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      $or: [
        {
          'basicInformation.email': email,
        },
        {
          'basicInformation.SSID': req.body.basicInformation.SSID,
        },
        {
          'basicInformation.phone': req.body.basicInformation.phone,
        },
      ],
    });
    if (getDebtor) {
      if (
        getDebtor.basicInformation.email === email &&
        String(getDebtor._id) !== req.params.id
      ) {
        return [
          false,
          constants.alreadyExistsMessage('Debtor with basicInformation.email'),
        ];
      }
      if (
        getDebtor.basicInformation.SSID === req.body.basicInformation.SSID &&
        String(getDebtor._id) !== req.params.id
      ) {
        return [
          false,
          constants.alreadyExistsMessage('Debtor with basicInformation.SSN'),
        ];
      }
      if (
        getDebtor.basicInformation.phone === req.body.basicInformation.phone &&
        String(getDebtor._id) !== req.params.id
      ) {
        return [
          false,
          constants.alreadyExistsMessage('Debtor with basicInformation.phone'),
        ];
      }
    }
    if (
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
    req.body;
    const debtor = await this.debtorRepository.updateById<IDebtor>(
      req.params.id,
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
          'basicInformation.email':
            req.body.basicInformation.email.toLowerCase(),
        },
        {
          'basicInformation.SSID': req.body.basicInformation.SSID,
        },
        {
          'basicInformation.phone': req.body.basicInformation.phone,
        },
        {
          'businessInformation.companyName':
            req.body.businessInformation.companyName,
        },
      ],
    });
    let debtor: IDebtor = null;
    if (req.body.paymentToken && req.body.paymentType) {
      const customerVaultResponse = await caseUtil.createVault(
        req.body.paymentToken
      );
      console.log(customerVaultResponse);
      if (!customerVaultResponse[0]) return customerVaultResponse;
      req.body.customerVaultId = customerVaultResponse[1];
    }
    if (!getDebtor) {
      debtor = await caseUtil.createDebtor(req.body as IDebtor);
    }
    if (getDebtor) {
      debtor = await this.debtorRepository.updateById<IDebtor>(
        getDebtor._id,
        req.body
      );
    }
    if (!debtor) {
      return [false, constantsUtil.failureAddMessage('debtor')];
    }
    const creditorNames: Array<string> =
      await caseUtil.getCreditorNames(debtor);
    return [true, {debtor, creditorNames}];
  }
}

export default DebtorService;
