import {Request} from 'express';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import commonUtil from './common.util';
import {IPayment} from '../database/interfaces/payment.interface';

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
      fullName: obj.caseId?.debtor
        ? obj.caseId.debtor.basicInformation.fullName
        : '',
      SSID: obj.caseId?.debtor ? obj.caseId.debtor?.basicInformation.SSID : '',
      authorized: obj.authorized,
      captured: obj.captured,
      amount: obj.amount,
      dueDate: obj.dueDate,
      failedReasonAuthorization: obj.failedReasonAuthorization,
      failedReasonCaptured: obj.failedReasonCaptured,
      tryDate: obj.rescheduled,
      caseId: obj.caseId._id ? String(obj.caseId._id) : '',
    }));

    return this.getFilteredPaymentsObj(transformedArray, arrayName);
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
          payment => payment.status === 'Success'
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
          switch (payment.status) {
            case 'Upcoming':
              upcomingPayments.push(payment);
              break;
            case 'Success':
              successPayments.push(payment);
              break;
          }
        }
    }
    // const failedPayments = transformedArray.filter(
    //   payment => payment.captured === 'Failed'
    // );
    // const successPayments = transformedArray.filter(
    //   payment => payment.captured === 'Success'
    // );
    // const failedAuthorizations = transformedArray.filter(
    //   payment => payment.authorized === 'Failed'
    // );
    // const successAuthorizations = transformedArray.filter(
    //   payment => payment.authorized === 'Success'
    // );
    // const upcomingPayments = transformedArray.filter(
    //   payment => payment.status === 'Upcoming'
    // );

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
      },
      undefined,
      undefined,
      undefined,
      [{path: 'caseId', select: ['_id'], populate: 'debtor'}]
    );
  }

  // async getAllCronJobPayments() {
  //   const pipeline = [
  //     {
  //       $facet: {
  //         pendingAuthorized: [
  //           {
  //             $match: {
  //               authorized: 'Pending',
  //               isDeleted: {$ne: true},
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: 'cases',
  //               localField: 'caseId',
  //               foreignField: '_id',
  //               as: 'caseDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails'},
  //           {
  //             $lookup: {
  //               from: 'debtors',
  //               localField: 'caseDetails.debtor',
  //               foreignField: '_id',
  //               as: 'caseDetails.debtorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.debtorDetails'},
  //           {
  //             $lookup: {
  //               from: 'creditors',
  //               localField: 'caseDetails.creditor',
  //               foreignField: '_id',
  //               as: 'caseDetails.creditorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.creditorDetails'},
  //           {
  //             $project: {
  //               _id: 1,
  //               caseId: 1,
  //               caseDetails: 1,
  //               authorized: 1,
  //               captured: 1,
  //               status: 1,
  //               amount: 1,
  //               dueDate: 1,
  //               frequency: 1,
  //               intervalId: 1,
  //               failedReasonAuthorization: 1,
  //               failedReasonCaptured: 1,
  //               rescheduled: 1,
  //               debtorTransId: 1,
  //               retriesAuth: 1,
  //               retriesCapture: 1,
  //               commission: 1,
  //               creditorAmount: 1,
  //               timePeriod: 1,
  //               createdAt: 1,
  //               updatedAt: 1,
  //             },
  //           },
  //         ],
  //         pendingCaptured: [
  //           {
  //             $match: {
  //               authorized: 'Success',
  //               captured: 'Pending',
  //               isDeleted: {$ne: true},
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: 'cases',
  //               localField: 'caseId',
  //               foreignField: '_id',
  //               as: 'caseDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails'},
  //           {
  //             $lookup: {
  //               from: 'debtors',
  //               localField: 'caseDetails.debtor',
  //               foreignField: '_id',
  //               as: 'caseDetails.debtorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.debtorDetails'},
  //           {
  //             $lookup: {
  //               from: 'creditors',
  //               localField: 'caseDetails.creditor',
  //               foreignField: '_id',
  //               as: 'caseDetails.creditorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.creditorDetails'},
  //           {
  //             $project: {
  //               _id: 1,
  //               caseId: 1,
  //               caseDetails: 1,
  //               authorized: 1,
  //               captured: 1,
  //               status: 1,
  //               amount: 1,
  //               dueDate: 1,
  //               frequency: 1,
  //               intervalId: 1,
  //               failedReasonAuthorization: 1,
  //               failedReasonCaptured: 1,
  //               rescheduled: 1,
  //               transactionId: 1,
  //               retriesAuth: 1,
  //               retriesCapture: 1,
  //               commission: 1,
  //               creditorAmount: 1,
  //               timePeriod: 1,
  //               createdAt: 1,
  //               updatedAt: 1,
  //             },
  //           },
  //         ],
  //         failedAuthorized: [
  //           {
  //             $match: {
  //               authorized: 'Failed',
  //               isDeleted: {$ne: true},
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: 'cases',
  //               localField: 'caseId',
  //               foreignField: '_id',
  //               as: 'caseDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails'},
  //           {
  //             $lookup: {
  //               from: 'debtors',
  //               localField: 'caseDetails.debtor',
  //               foreignField: '_id',
  //               as: 'caseDetails.debtorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.debtorDetails'},
  //           {
  //             $lookup: {
  //               from: 'creditors',
  //               localField: 'caseDetails.creditor',
  //               foreignField: '_id',
  //               as: 'caseDetails.creditorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.creditorDetails'},
  //           {
  //             $project: {
  //               _id: 1,
  //               caseId: 1,
  //               caseDetails: 1,
  //               authorized: 1,
  //               captured: 1,
  //               status: 1,
  //               amount: 1,
  //               dueDate: 1,
  //               frequency: 1,
  //               intervalId: 1,
  //               failedReasonAuthorization: 1,
  //               failedReasonCaptured: 1,
  //               rescheduled: 1,
  //               transactionId: 1,
  //               retriesAuth: 1,
  //               retriesCapture: 1,
  //               commission: 1,
  //               creditorAmount: 1,
  //               timePeriod: 1,
  //               createdAt: 1,
  //               updatedAt: 1,
  //             },
  //           },
  //         ],
  //         failedCaptured: [
  //           {
  //             $match: {
  //               authorized: 'Success',
  //               captured: 'Failed',
  //               isDeleted: {$ne: true},
  //             },
  //           },
  //           {
  //             $lookup: {
  //               from: 'cases',
  //               localField: 'caseId',
  //               foreignField: '_id',
  //               as: 'caseDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails'},
  //           {
  //             $lookup: {
  //               from: 'debtors',
  //               localField: 'caseDetails.debtor',
  //               foreignField: '_id',
  //               as: 'caseDetails.debtorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.debtorDetails'},
  //           {
  //             $lookup: {
  //               from: 'creditors',
  //               localField: 'caseDetails.creditor',
  //               foreignField: '_id',
  //               as: 'caseDetails.creditorDetails',
  //             },
  //           },
  //           {$unwind: '$caseDetails.creditorDetails'},
  //           {
  //             $project: {
  //               _id: 1,
  //               caseId: 1,
  //               caseDetails: 1,
  //               authorized: 1,
  //               captured: 1,
  //               status: 1,
  //               amount: 1,
  //               dueDate: 1,
  //               frequency: 1,
  //               intervalId: 1,
  //               failedReasonAuthorization: 1,
  //               failedReasonCaptured: 1,
  //               rescheduled: 1,
  //               transactionId: 1,
  //               retriesAuth: 1,
  //               retriesCapture: 1,
  //               commission: 1,
  //               creditorAmount: 1,
  //               timePeriod: 1,
  //               createdAt: 1,
  //               updatedAt: 1,
  //             },
  //           },
  //         ],
  //       },
  //     },
  //   ];

  //   return await this.paymentRepository.applyAggregate<IPayment>(pipeline);
  // }

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
      // if (
      //   filters.dueDate &&
      //   (new Date(paymentObj.dueDate) < new Date(filters.dueDate.start) ||
      //     new Date(paymentObj.dueDate) > new Date(filters.dueDate.end))
      // ) {
      //   return false;
      // }
      // if (
      //   filters.tryDate &&
      //   (new Date(paymentObj.tryDate) < new Date(filters.tryDate.start) ||
      //     new Date(paymentObj.tryDate) > new Date(filters.tryDate.end))
      // ) {
      //   return false;
      // }
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
}
export default new PaymentUtil();
