import {Request} from 'express';
import {ICase, IInterval} from '../../database/interfaces/case.interface';
import {IPayment} from '../../database/interfaces/payment.interface';
import commonUtil from '../../utils/common.util';
import constants from '../../utils/constants.util';
import paymentUtil from '../../utils/payment.util';
import {CaseRepository} from '../repository/case/case.repository';
import {PaymentRepository} from '../repository/payment/payment.repository';
import axios from 'axios';

class PaymentService {
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
  }

  async getHomePayments(req: Request): Promise<[boolean, {} | string]> {
    let days = !Number(req.query.days) ? 3 : Number(req.query.days);
    let currentDate = commonUtil.getCurrentDate();
    let arrayName = String(req.query.arrayName);
    const payments: IPayment[] = await this.getAllPayments(currentDate, days);
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    const paymentsObj = await paymentUtil.getFilteredPayments(payments);
    let page = 1;
    let limit = 10;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }

    let counts = {
      failedPayments: paymentsObj.failedPayments.length,
      successPayments: paymentsObj.successPayments.length,
      failedAuthorizations: paymentsObj.failedAuthorizations.length,
      successAuthorizations: paymentsObj.successAuthorizations.length,
      upcomingPayments: paymentsObj.upcomingPayments.length,
    };

    if (arrayName) {
      paymentsObj[arrayName] = paymentsObj[arrayName].slice(
        (page - 1) * limit,
        page * limit
      );
    } else {
      for (const key in paymentsObj) {
        if (Array.isArray(paymentsObj[key])) {
          paymentsObj[key] = paymentsObj[key].slice(
            (page - 1) * limit,
            page * limit
          );
        }
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

  private async getAllPayments(currentDate: string, days: number) {
    const startDate = new Date(
      new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
    ).toUTCString();
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        $and: [
          {
            $or: [
              {captured: 'Failed'},
              {authorized: 'Failed'},
              {authorized: 'Success'},
              {captured: 'Success'},
              {status: 'Upcoming'},
            ],
          },
          {
            dueDate: {
              $gte: startDate,
              $lte: currentDate,
            },
          },
        ],
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

  async getCasePayments(id: string): Promise<[boolean, {} | string]> {
    const payments: IPayment[] = await this.getAllPaymentsByCaseId(id);
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    const paymentsObj = await paymentUtil.getFilteredPayments(payments);
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
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
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
      customer_vault_id: '1922739712',
      type: 'auth',
      amount: '20.00',
    };

    try {
      const response = await axios.get(url, {params});
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
  async captureCreditCard(customer_vault_id: string, transactionId: string) {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      customer_vault_id: '1922739712',
      transaction_id: '9604723257',
      stored_credential_indicator: 'used',
      type: 'capture',
    };

    try {
      const response = await axios.get(url, {params});
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

  async achCredit(customer_vault_id: string, amount: number) {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      customer_vault_id: '2023102910',
      stored_credential_indicator: 'used',
      type: 'credit',
      amount: '20.00',
      payment: 'check',
    };

    try {
      const response = await axios.get(url, {params});
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
}

export default PaymentService;
