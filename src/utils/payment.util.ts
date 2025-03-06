import {Request} from 'express';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import commonUtil from './common.util';
import {IPayment} from '../database/interfaces/payment.interface';
import {Payment} from '../database/repomodels/payment.repomodel';

class PaymentUtil {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }
  async getFilteredPayments(payments: any, arrayName: string) {
    const transformedArray = payments.map(obj => ({
      id: String(obj._id),
      status: obj.status,
      caseOwner: obj.caseId?.caseOwner ? obj.caseId.caseOwner : '',
      totalDebt: obj.caseId?.totalDebt ? obj.caseId.totalDebt : 0,
      fullName: obj.debtorName
        ? obj.debtorName
        : obj.caseId?.debtor
          ? obj.caseId.debtor.basicInformation.fullName
          : '',

      creditorName: obj.caseId?.creditor
        ? obj.caseId.creditor.basicInformation.fullName
        : '',
      // SSID: obj.caseId?.debtor ? obj.caseId.debtor?.basicInformation.SSID : '',
      authorized: obj.authorized,
      captured: obj.captured,
      amount: obj.amount,
      dueDate: obj.dueDate,
      failedReasonAuthorization: obj.failedReasonAuthorization,
      failedReasonCaptured: obj.failedReasonCaptured,
      tryDate: obj.rescheduled,
      caseId: obj?.caseId?._id ? String(obj.caseId._id) : '',
      transactionType: obj.transactionType ? obj.transactionType : '',
      paymentGateway: obj.paymentGateway ? obj.paymentGateway : '',
      transactionId: obj.debtorTransId,
      sendViaPaynote: obj.sendViaPaynote,
      failedReasonPaynote: obj.failedReasonPaynote,
      debtorId: obj.debtorId,
    }));

    return this.getFilteredPaymentsObj(transformedArray, arrayName);
  }

  async getFilteredPaymentsCreditor(payments: any) {
    let transformedArray = payments.map(obj => ({
      id: String(obj._id),
      status: obj.status,
      caseOwner: obj.caseId?.caseOwner ? obj.caseId.caseOwner : '',
      totalDebt: obj.caseId?.totalDebt ? obj.caseId.totalDebt : 0,
      debtorName: obj.debtorName,
      creditorName: obj.creditorName,
      // SSID: obj.caseId?.debtor ? obj.caseId.debtor?.basicInformation.SSID : '',
      authorized: obj.authorized,
      captured: obj.captured,
      amount: obj.amount,
      dueDate: obj.dueDate,
      failedReasonAuthorization: obj.failedReasonAuthorization,
      failedReasonCaptured: obj.failedReasonCaptured,
      tryDate: obj.rescheduled,
      caseId: obj?.caseId?._id ? String(obj.caseId._id) : '',
      transactionType: 'ACH',
      paymentGateway: 'Paynote',
      sendViaPaynote: obj.sendViaPaynote,
      failedReasonPaynote: obj.failedReasonPaynote,
      debtorId: obj.debtorId,
    }));

    return transformedArray;
  }

  async getFilteredPaymentsObj(transformedArray: any, arrayName: string) {
    let failedCaptures = [],
      successCaptures = [],
      successPayments = [],
      failedAuthorizations = [],
      successAuthorizations = [],
      upcomingPayments = [];
    switch (arrayName) {
      case 'failedCaptures':
        failedCaptures = transformedArray.filter(
          payment => payment.captured === 'Failed'
        );
        break;
      case 'successCaptures':
        successCaptures = transformedArray.filter(
          payment => payment.captured === 'Success'
        );
        break;
      case 'successPayments':
        successPayments = transformedArray.filter(
          payment => payment.sendViaPaynote === 'Success'
        );
        break;
      case 'failedAuthorizations':
        failedAuthorizations = transformedArray.filter(
          payment => payment.authorized === 'Failed'
        );
        break;
      case 'successAuthorizations':
        successAuthorizations = transformedArray.filter(
          payment => payment.authorized === 'Success'
        );
        break;
      case 'upcomingPayments':
        upcomingPayments = transformedArray.filter(
          payment => payment.status === 'Upcoming'
        );
        break;
      default:
        for (const payment of transformedArray) {
          switch (payment.captured) {
            case 'Failed':
              failedCaptures.push(payment);
              break;
            case 'Success':
              successCaptures.push(payment);
              break;
          }

          switch (payment.authorized) {
            case 'Failed':
              failedAuthorizations.push(payment);
              break;
            case 'Success':
              successAuthorizations.push(payment);
              break;
          }
          if (payment.status === 'Upcoming') {
            upcomingPayments.push(payment);
          }
          if (payment.sendViaPaynote === 'Success') {
            successPayments.push(payment);
          }
        }
    }

    return {
      failedCaptures: failedCaptures,
      successPayments: successPayments,
      failedAuthorizations: failedAuthorizations,
      successAuthorizations: successAuthorizations,
      upcomingPayments: upcomingPayments,
      successCaptures: successCaptures,
    };
  }

  async getFilteredCommissionPayments(payments: any) {
    const transformedArray = payments.map(obj => ({
      id: String(obj._id),
      status: obj.status,
      authorized: obj.authorized,
      captured: obj.captured,
      amount: obj.amount,
      dueDate: obj.dueDate,
      failedReasonAuthorization: obj.failedReasonAuthorization,
      failedReasonCaptured: obj.failedReasonCaptured,
      tryDate: obj.rescheduled,
      transactionType: obj.transactionType ? obj.transactionType : '',
      paymentGateway: obj.paymentGateway ? obj.paymentGateway : '',
    }));

    return this.getFilteredCommissionPaymentsObj(transformedArray);
  }

  async getFilteredCommissionPaymentsObj(transformedArray: any) {
    let failedCaptures = [],
      successCaptures = [],
      successPayments = [],
      failedAuthorizations = [],
      successAuthorizations = [],
      upcomingPayments = [];
    for (const payment of transformedArray) {
      switch (payment.captured) {
        case 'Failed':
          failedCaptures.push(payment);
          break;
        case 'Success':
          successCaptures.push(payment);
          break;
      }

      switch (payment.authorized) {
        case 'Failed':
          failedAuthorizations.push(payment);
          break;
        case 'Success':
          successAuthorizations.push(payment);
          break;
      }
      switch (payment.status) {
        case 'Upcoming':
          upcomingPayments.push(payment);
          break;
        case 'Success':
          successPayments.push(payment);
          break;
      }
    }

    return {
      failedCaptures: failedCaptures,
      successPayments: successPayments,
      failedAuthorizations: failedAuthorizations,
      successAuthorizations: successAuthorizations,
      upcomingPayments: upcomingPayments,
      successCaptures: successCaptures,
    };
  }

  async getPendingAuthorized() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Pending',
        isDeleted: {$ne: true},
        caseId: {$ne: null},
        transactionType: {$nin: ['Wire', 'Check']},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getPendingCommissionAuthorized() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Pending',
        isDeleted: {$ne: true},
        caseId: {$eq: null},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getPendingCaptured() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Success',
        captured: 'Pending',
        isDeleted: {$ne: true},
        caseId: {$ne: null},
        transactionType: {$nin: ['Wire', 'Check']},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getPendingCommissionCaptured() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Success',
        captured: 'Pending',
        isDeleted: {$ne: true},
        caseId: {$eq: null},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getFailedAuthorized() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Failed',
        isDeleted: {$ne: true},
        caseId: {$ne: null},
        paymentReferenceBool: {$ne: true},
        transactionType: {$nin: ['Wire', 'Check']},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getFailedCommissionAuthorized() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Failed',
        isDeleted: {$ne: true},
        caseId: {$eq: null},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getFailedCaptured() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Success',
        captured: 'Failed',
        isDeleted: {$ne: true},
        caseId: {$ne: null},
        paymentReferenceBool: {$ne: true},
        transactionType: {$nin: ['Wire', 'Check']},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async getFailedCommissionCaptured() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        authorized: 'Success',
        captured: 'Failed',
        isDeleted: {$ne: true},
        caseId: {$eq: null},
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  async searchAndFilterHomePayments(payments: any, req: Request) {
    // Helper function to apply text search
    const applyTextSearch = (paymentObj: any, text: string | RegExp) => {
      const regex = new RegExp(text, 'i');
      return (
        regex.test(paymentObj.fullName) ||
        regex.test(paymentObj.caseOwner) ||
        regex.test(paymentObj.SSID)
      );
    };

    // Helper function to apply numeric/date filters
    const applyFilters = (paymentObj: any, filters: any) => {
      if (
        filters.totalDebt &&
        (paymentObj.totalDebt <= filters.totalDebt.min ||
          paymentObj.totalDebt >= filters.totalDebt.max)
      ) {
        return false;
      }
      return true;
    };
    let text = '',
      filters = {};
    if (req.query.search === 'true') {
      text = req.body.text;
    }
    if (req.query.filters === 'true') {
      filters = req.body.filters;
    }
    // Apply text search and filters
    let filteredPayments = payments.filter(paymentObj => {
      const textMatches = !text || applyTextSearch(paymentObj, text);
      const filtersMatch =
        Object.keys(filters).length === 0 || applyFilters(paymentObj, filters);
      return textMatches && filtersMatch;
    });

    return filteredPayments;
  }

  async getPaymentsByStatusAndDebtor(status: string, debtorId: string) {
    try {
      const results = await this.paymentRepository.applyAggregate([
        {
          $match: {
            status: status,
            debtorId: debtorId, // Match the string debtorId directly
          },
        },
        {
          $lookup: {
            from: 'debtors', // Ensure this matches the actual collection name
            localField: 'debtorId', // Field in the payments collection (string type)
            foreignField: 'debtorId', // Assuming debtorId is a string in the debtor model
            as: 'debtorDetails', // Output field for matched debtor details
          },
        },
        {
          $unwind: {
            path: '$debtorDetails', // Unwind the array to get individual debtor details
            preserveNullAndEmptyArrays: true, // Keep documents without matches
          },
        },
        {
          $project: {
            _id: 1, // Include the payment ID
            amount: 1, // Include payment amount
            status: 1, // Include payment status
            debtorId: 1, // Include debtor ID
            companyName: '$debtorDetails.businessInformation.companyName', // Include company name
          },
        },
      ]);

      return results;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error; // Rethrow the error for further handling
    }
  }

  async getPaymentReferenceDocuments(referenceId: string) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>({
      paymentReference: referenceId,
      paymentReferenceBool: true,
      caseId: {$ne: null},
      isDeleted: false,
    });
  }

  async getAllPaymentReferenceDocuments(referenceId: string) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        paymentReference: referenceId,
        paymentReferenceBool: true,
        isDeleted: false,
      },
      undefined,
      undefined,
      undefined,
      {path: 'caseId', populate: [{path: 'debtor'}]}
    );
  }

  async getOtherPayments(payment: IPayment) {
    const debtorId = payment.debtorId;
    const nextDate = await this.addDaysBasedOnPeriod(
      payment.dueDate,
      payment.timePeriod
    );
    const payments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        debtorId: debtorId,
        caseId: {$ne: null},
        authorized: {$ne: 'Success'},
        transactionType: {$nin: ['Wire', 'Check']},
        isDeleted: false,
        dueDate: {
          $gte: new Date(payment.dueDate),
          $lt: nextDate,
        },
      });
    return payments;
  }

  async addDaysBasedOnPeriod(date: string, timePeriod: string) {
    const timePeriods = {
      daily: 1,
      weekly: 7,
      fortnightly: 14,
      monthly: 30,
      custom: 0,
    };

    let daysToAdd = timePeriods[timePeriod.toLowerCase()];

    if (!daysToAdd) {
      daysToAdd = 7;
    }

    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + daysToAdd);

    return resultDate;
  }

  async createPaymentDoc(
    amount: number,
    token: string,
    debtorId: string,
    debtorName?: string,
    link?: string
  ) {
    const payment = new Payment();
    payment.amount = amount;
    payment.debtorTransId = token;
    if (link) payment.paymentLink = link;
    payment.status = 'Pending';
    payment.debtorId = debtorId;
    if (debtorName) payment.debtorName = debtorName;
    payment.transactionType = link ? 'Link' : 'Invoice';

    const hello = await this.paymentRepository.create<IPayment>(payment as any);
    console.log('hello', hello);
  }
}
export default new PaymentUtil();
