import {Request} from 'express';
import {ICase, IInterval} from '../../database/interfaces/case.interface';
import {IPayment} from '../../database/interfaces/payment.interface';
import commonUtil from '../../utils/common.util';
import constants from '../../utils/constants.util';
import paymentUtil from '../../utils/payment.util';
import {CaseRepository} from '../repository/case/case.repository';
import {PaymentRepository} from '../repository/payment/payment.repository';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstanceInterceptor';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import paynoteUtil from '../../utils/paynote.util';
import {decrypt, encrypt} from 'n-krypta';
import dotenv from 'dotenv';
dotenv.config();
class PaymentService {
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private creditorReposiotry: CreditorRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.creditorReposiotry = new CreditorRepository();
  }

  async getHomePayments(req: Request): Promise<[boolean, {} | string]> {
    let arrayName = String(req.query.arrayName);
    let days = Number(req.query.days);
    let counts = {};
    let filters = {
      caseId: {$ne: null},
      isDeleted: false,
    };
    if (days) {
      filters = await this.getDaysFilterPopulated(filters, days);
    }
    if (arrayName === 'default') {
      counts = await this.getCountForAllPaymentsStatus({...filters});
    }
    const populatedFiltersResult = await this.populateFilterHomePayments(
      {...filters},
      req
    );
    let page = populatedFiltersResult.page;
    let limit = populatedFiltersResult.limit;
    const finalFilters = populatedFiltersResult.filters;
    const payments: IPayment[] = await this.getAllPayments(
      req,
      finalFilters,
      page,
      limit
    );
    console.log(payments.length);
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    const paymentsObj = await paymentUtil.getFilteredPayments(
      payments,
      arrayName
    );
    if (
      arrayName !== 'default' &&
      req.query.filters !== 'true' &&
      req.query.search !== 'true'
    ) {
      console.log(finalFilters, 'filiiiiii');
      const count =
        await this.paymentRepository.getCount<IPayment>(finalFilters);
      counts[arrayName] = count;
    }
    if (
      arrayName !== 'default' &&
      (req.query.filters === 'true' || req.query.search === 'true')
    ) {
      if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page) ? Number(req.query.page) : page;
      }
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
      }
      if (paymentsObj[arrayName]) {
        paymentsObj[arrayName] = await paymentUtil.searchAndFilterHomePayments(
          paymentsObj[arrayName],
          req
        );
        counts[arrayName] = paymentsObj[arrayName]?.length;
        paymentsObj[arrayName] = paymentsObj[arrayName]?.slice(
          (page - 1) * limit,
          page * limit
        );
      }
    }
    return [
      true,
      {
        payments: paymentsObj,
        counts: counts,
      },
    ];
  }

  async populateFilterHomePayments(filters: any, req: Request) {
    let page = 1;
    let limit = 5;
    let arrayName = String(req.query.arrayName);
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    // if (arrayName === 'default') {
    //   // Check if pageNumber and pageSize are provided and valid
    //   filters['$or'] = [
    //     {captured: 'Failed'},
    //     {authorized: 'Failed'},
    //     {authorized: 'Success'},
    //     {captured: 'Success'},
    //     {status: 'Upcoming'},
    //   ];
    // }
    let filtersApply: any;
    if (req.query.filters === 'true') {
      page = 0;
      limit = 0;
      filtersApply = req.body.filters;
      if (filtersApply?.dueDate) {
        filters['dueDate'] = {
          $gte: filtersApply.dueDate.start,
          $lte: filtersApply.dueDate.end,
        };
      }
      if (filtersApply?.tryDate) {
        filters['reschedule'] = {
          $gte: filtersApply.tryDate.start,
          $lte: filtersApply.tryDate.end,
        };
      }
    }
    if (req.query.search === 'true') {
      page = 0;
      limit = 0;
    }
    if (arrayName !== 'default') {
      switch (arrayName) {
        case 'failedPayments':
          filters['captured'] = 'Failed';
          break;
        case 'successPayments':
          filters['captured'] = 'Success';
          break;
        case 'failedAuthorizations':
          filters['authorized'] = 'Failed';
          break;
        case 'successAuthorizations':
          filters['authorized'] = 'Success';
          break;
        case 'upcomingPayments':
          filters['status'] = 'Upcoming';
          break;
        default:
          filters['authorized'] = 'Failed';
          break;
      }
    }
    return {filters, page, limit};
  }

  async getDaysFilterPopulated(filters: any, days: number) {
    if (days && (days === 3 || days === 5 || days === 7)) {
      let currentDate = commonUtil.getCurrentDate();
      const startDate = new Date(
        new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
      ).toUTCString();
      filters['dueDate'] = {
        $gte: startDate,
        $lte: currentDate,
      };
    }
    return filters;
  }

  private async getAllPayments(
    req: Request,
    filters: any,
    page: number,
    limit: number
  ) {
    // let arrayName = String(req.query.arrayName);
    // const filters = {
    //   caseId: {$ne: null},
    //   isDeleted: false,
    // };
    // let page = 1;
    // let limit = 5;
    // if (arrayName === 'default') {
    //   // Check if pageNumber and pageSize are provided and valid
    //   if (req.query.page && !isNaN(Number(req.query.page))) {
    //     page = Number(req.query.page) ? Number(req.query.page) : page;
    //   }
    //   if (req.query.limit && !isNaN(Number(req.query.limit))) {
    //     limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    //   }
    //   filters['$or'] = [
    //     {captured: 'Failed'},
    //     {authorized: 'Failed'},
    //     {authorized: 'Success'},
    //     {captured: 'Success'},
    //     {status: 'Upcoming'},
    //   ];
    // } else {
    //   page = 0;
    //   limit = 0;
    //   let filtersApply: any;
    //   if (req.query.filters === 'true') {
    //     filtersApply = req.body.filters;
    //     if (filtersApply?.dueDate) {
    //       filters['dueDate'] = {
    //         $gte: filtersApply.dueDate.start,
    //         $lte: filtersApply.dueDate.end,
    //       };
    //     }
    //     if (filtersApply?.tryDate) {
    //       filters['reschedule'] = {
    //         $gte: filtersApply.tryDate.start,
    //         $lte: filtersApply.tryDate.end,
    //       };
    //     }
    //   }
    //   switch (arrayName) {
    //     case 'failedPayments':
    //       filters['captured'] = 'Failed';
    //       break;
    //     case 'successPayments':
    //       filters['captured'] = 'Success';
    //       break;
    //     case 'failedAuthorizations':
    //       filters['authorized'] = 'Failed';
    //       break;
    //     case 'successAuthorizations':
    //       filters['authorized'] = 'Success';
    //       break;
    //     case 'upcomingPayments':
    //       filters['status'] = 'Upcoming';
    //       break;
    //     default:
    //       filters['captured'] = 'Failed';
    //       break;
    //   }
    // }
    // let days = Number(req.query.days);
    // if (days && (days === 3 || days === 5 || days === 7)) {
    //   let currentDate = commonUtil.getCurrentDate();
    //   const startDate = new Date(
    //     new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
    //   ).toUTCString();
    //   filters['dueDate'] = {
    //     $gte: startDate,
    //     $lte: currentDate,
    //   };
    // }
    console.log(page, 'page');
    console.log(limit, 'limit');
    console.log(String(req.query.arrayName), 'req.query.arrayName');
    console.log(filters, 'filtererrrrr');
    if (String(req.query.arrayName) === 'default') {
      console.log('heyyyyyy');
      const failedAuth = {...filters};
      failedAuth['authorized'] = 'Failed';
      const getFailedAuthPayments = await this.getAllPaymentsQuery(
        failedAuth,
        page,
        limit
      );
      const failedCapture = {...filters};
      failedCapture['captured'] = 'Failed';
      const getFailedCapturePayments = await this.getAllPaymentsQuery(
        failedCapture,
        page,
        limit
      );
      const successAuth = {...filters};
      successAuth['authorized'] = 'Success';
      const getSuccessAuthPayments = await this.getAllPaymentsQuery(
        successAuth,
        page,
        limit
      );
      console.log(successAuth, 'lplplp');
      console.log(getSuccessAuthPayments, 'getSuccessAuthPayments');
      const successCapture = {...filters};
      successCapture['captured'] = 'Success';
      const getSuccessCapturePayments = await this.getAllPaymentsQuery(
        successCapture,
        page,
        limit
      );

      const upcoming = {...filters};
      upcoming['status'] = 'Upcoming';
      const getUpcomingPayments = await this.getAllPaymentsQuery(
        upcoming,
        page,
        limit
      );

      const mergedArray = [
        ...getFailedAuthPayments,
        ...getFailedCapturePayments,
        ...getSuccessAuthPayments,
        ...getSuccessCapturePayments,
        ...getUpcomingPayments,
      ];
      return await this.getUniquePayments(mergedArray);
    }
    return await this.getAllPaymentsQuery(filters, page, limit);
  }

  async getUniquePayments(payments: IPayment[]) {
    const uniqueObjects = payments.reduce((acc, current) => {
      const id = current._id.toString(); // Convert ObjectId to string to ensure proper comparison
      if (!acc.has(id)) {
        acc.set(id, current);
      }
      return acc;
    }, new Map());

    return Array.from(uniqueObjects.values());
  }

  async getAllPaymentsQuery(filters: any, page: number, limit: number) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      filters,
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status',
      undefined,
      {createdAt: -1},
      {
        path: 'caseId',
        select: ['_id', 'caseOwner', 'totalDebt'],
        populate: {
          path: 'debtor',
          select: ['basicInformation.fullName', 'basicInformation.SSID'],
        },
      },
      undefined,
      page,
      limit
    );
  }

  async getCountForAllPaymentsStatus(filters: any) {
    console.log(filters, 'filetrssssss');
    const failedAuth = {...filters};
    failedAuth['authorized'] = 'Failed';
    const failedCapture = {...filters};
    failedCapture['captured'] = 'Failed';
    const successAuth = {...filters};
    successAuth['authorized'] = 'Success';
    const successCapture = {...filters};
    successCapture['captured'] = 'Success';
    const upcoming = {...filters};
    upcoming['status'] = 'Upcoming';
    console.log(failedAuth, 'failedAuthhh');
    const successAuthorizations =
      await this.paymentRepository.getCount<IPayment>(successAuth);
    const failedPayments =
      await this.paymentRepository.getCount<IPayment>(failedCapture);
    const failedAuthorizations =
      await this.paymentRepository.getCount<IPayment>(failedAuth);
    const successPayments =
      await this.paymentRepository.getCount<IPayment>(successCapture);
    const upcomingPayments =
      await this.paymentRepository.getCount<IPayment>(upcoming);

    console.log(successAuthorizations, 'cpunttttt');

    // const result = await this.paymentRepository.applyAggregate(pipeline as any);
    // console.log(result[0], 'okokoko');
    return {
      failedAuthorizations: failedAuthorizations,
      successPayments: successPayments,
      successAuthorizations: successAuthorizations,
      failedPayments: failedPayments,
      upcomingPayments: upcomingPayments,
    };
  }

  async getCasePayments(id: string): Promise<[boolean, {} | string]> {
    const payments: IPayment[] = await this.getAllPaymentsByCaseId(id);
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    const paymentsObj = await paymentUtil.getFilteredPayments(
      payments,
      'default'
    );
    let paidAmount = 0,
      upcomingAmount = 0,
      failedAmount = 0;
    paidAmount = paymentsObj.successPayments.reduce(
      (acc: any, payment: {amount: any}) => acc + payment.amount,
      0
    );
    upcomingAmount = paymentsObj.upcomingPayments.reduce(
      (acc: any, payment: {amount: any}) => acc + payment.amount,
      0
    );
    failedAmount = paymentsObj.failedPayments.reduce(
      (acc: any, payment: {amount: any}) => acc + payment.amount,
      0
    );
    const failedAuth = paymentsObj.failedAuthorizations.map((obj: any) => ({
      ...obj,
      type: 'authorization',
    }));

    // Adding type to each object in successCapture array
    const failedCapture = paymentsObj.failedPayments.map((obj: any) => ({
      ...obj,
      type: 'payment',
    }));

    const successAuth = paymentsObj.successAuthorizations.map((obj: any) => ({
      ...obj,
      type: 'authorization',
    }));

    // Adding type to each object in successCapture array
    const successCapture = paymentsObj.successPayments.map((obj: any) => ({
      ...obj,
      type: 'payment',
    }));

    // Merging the arrays
    const mergedArray = [
      ...successAuth,
      ...failedAuth,
      ...successCapture,
      ...failedCapture,
    ];
    const paymentCounts = {
      failedPayments: paymentsObj.failedPayments.length,
      successPayments: paymentsObj.successPayments.length,
      failedAuthorizations: paymentsObj.failedAuthorizations.length,
      successAuthorizations: paymentsObj.successAuthorizations.length,
      paidAmount: paidAmount,
      remainingAmount: upcomingAmount + failedAmount,
    };
    mergedArray.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
    paymentsObj.upcomingPayments.sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return [
      true,
      {
        transactions: {
          previous: mergedArray,
          upcomingPayments: paymentsObj.upcomingPayments,
        },
        paymentCounts: paymentCounts,
      },
    ];
  }

  private async getAllPaymentsByCaseId(id: string) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        caseId: id,
        isDeleted: false,
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status',
      undefined,
      {createdAt: -1},
      {
        path: 'caseId',
        select: ['_id', 'caseOwner', 'totalDebt'],
        populate: {
          path: 'debtor',
          select: ['basicInformation.fullName', 'basicInformation.SSID'],
        },
      }
    );
  }

  async authorizeCreditCard(amount: number, customer_vault_id: string) {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      customer_vault_id: customer_vault_id,
      type: 'auth',
      amount: amount,
    };

    try {
      const response = await axiosInstance.get(url, {params});
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error making request:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }
  async captureCreditCard(
    customer_vault_id: string,
    transactionId: string,
    creditorSecurityKey: string
  ) {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      customer_vault_id: customer_vault_id,
      transaction_id: transactionId,
      stored_credential_indicator: 'used',
      type: 'capture',
    };

    try {
      const response = await axiosInstance.get(url, {params});
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error making request:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }

  async achCredit(
    customer_vault_id: string,
    amount: number,
    creditorSecurityKey: string
  ) {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      customer_vault_id: customer_vault_id,
      stored_credential_indicator: 'used',
      type: 'credit',
      amount: amount,
      payment: 'check',
    };

    try {
      const response = await axiosInstance.get(url, {params});
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error making request:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }

  async addACHDetailsCreditor(req: Request) {
    const creditor = await this.creditorReposiotry.getById<ICreditor>(
      req.params.id
    );
    if (!creditor) return [false, constants.notFoundMessage('creditor')];

    const data = req.body.data;
    const paymentObj = decrypt(data, process.env.kryptaSecretKey);
    if (!creditor.paynoteUserId)
      return [false, 'User is not added in paynote!'];
    const fundingSource = await paynoteUtil.addFundingSource(
      paymentObj,
      creditor.paynoteUserId
    );
    console.log(fundingSource);
    if (fundingSource?.error) {
      let message = '';
      if (fundingSource?.messages) {
        message = fundingSource.messages[0];
      } else {
        message = fundingSource.message;
      }
      return [false, message];
    }
    const sourceId = fundingSource.funding_source.source_id;
    this.creditorReposiotry.updateById(creditor._id, {
      paynoteSourceId: fundingSource.funding_source.source_id,
    });
    paynoteUtil.initiateFundingSourceVerifcation(
      sourceId,
      creditor.paynoteUserId
    );
    paynoteUtil.verifyFundingSource(sourceId);
    return [true, constants.successAddMessage('ACH details')];
  }
}

export default PaymentService;
