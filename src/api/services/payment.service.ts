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

  async getHomePayments(days: number): Promise<[boolean, {} | string]> {
    if (!days) days = 3;
    let currentDate = commonUtil.getCurrentDate();
    const payments: IPayment[] = await this.getAllPayments(currentDate, days);
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    const paymentsObj = await paymentUtil.getFilteredPayments(payments);
    return [true, paymentsObj];
  }

  private async getAllPayments(currentDate: string, days: number) {
    const startDate = new Date(
      new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
    ).toUTCString();
    return await this.paymentRepository.getAll<IPayment>(
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
    const paymentCounts = {
      failedPayments: paymentsObj.failedPayments.length,
      successPayments: paymentsObj.successPayments.length,
      failedAuthorizations: paymentsObj.failedAuthorizations.length,
      successAuthorizations: paymentsObj.successAuthorizations.length,
      paidAmount: paidAmount,
      remainingAmount: upcomingAmount + failedAmount,
    };
    return [true, {transactions: paymentsObj, paymentCounts: paymentCounts}];
  }

  private async getAllPaymentsByCaseId(id: string) {
    return await this.paymentRepository.getAll<IPayment>(
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
      amount: '0.00',
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
      transaction_id: '9561304895',
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

  async creditAmount() {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      customer_vault_id: '1922739712',
      type: 'credit',
      amount: '10.00',
    };

    try {
      const response = await axios.get(url, {params});
      console.log('Response:', response.data);
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
