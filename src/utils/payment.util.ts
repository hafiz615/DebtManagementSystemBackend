import {PaymentRepository} from '../api/repository/payment/payment.repository';

class PaymentUtil {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }
  async getFilteredPayments(payments: any) {
    const transformedArray = payments.map(obj => ({
      status: obj.status,
      caseOwner: obj.caseId.caseOwner,
      totalDebt: obj.caseId.totalDebt,
      fullName: obj.caseId.debtor
        ? obj.caseId.debtor.basicInformation.fullName
        : '',
      SSID: obj.caseId.debtor ? obj.caseId.debtor.basicInformation.SSID : '',
      authorized: obj.authorized,
      captured: obj.captured,
      amount: obj.amount,
      dueDate: obj.dueDate,
      failedReasonAuthorization: obj.failedReasonAuthorization,
      failedReasonCaptured: obj.failedReasonCaptured,
      tryDate: obj.rescheduled,
    }));

    return this.getFilteredPaymentsObj(transformedArray);
  }

  async getFilteredPaymentsObj(transformedArray: any) {
    const failedPayments = transformedArray.filter(
      payment => payment.captured === 'Failed'
    );
    const successPayments = transformedArray.filter(
      payment => payment.captured === 'Success'
    );
    const failedAuthorizations = transformedArray.filter(
      payment => payment.authorized === 'Failed'
    );
    const successAuthorizations = transformedArray.filter(
      payment => payment.authorized === 'Success'
    );
    const upcomingPayments = transformedArray.filter(
      payment => payment.status === 'Upcoming'
    );

    return {
      failedPayments: failedPayments,
      successPayments: successPayments,
      failedAuthorizations: failedAuthorizations,
      successAuthorizations: successAuthorizations,
      upcomingPayments: upcomingPayments,
    };
  }

  async getAllCronJobPayments() {
    const pipeline = [
      {
        $facet: {
          pendingAuthorized: [
            {$match: {authorized: 'Pending'}},
            {
              $lookup: {
                from: 'cases',
                localField: 'caseId',
                foreignField: '_id',
                as: 'caseDetails',
              },
            },
            {$unwind: '$caseDetails'},
            {
              $lookup: {
                from: 'debtors',
                localField: 'caseDetails.debtor',
                foreignField: '_id',
                as: 'caseDetails.debtorDetails',
              },
            },
            {$unwind: '$caseDetails.debtorDetails'},
            {
              $lookup: {
                from: 'creditors',
                localField: 'caseDetails.creditor',
                foreignField: '_id',
                as: 'caseDetails.creditorDetails',
              },
            },
            {$unwind: '$caseDetails.creditorDetails'},
            {
              $project: {
                _id: 1,
                caseId: 1,
                caseDetails: 1,
                authorized: 1,
                captured: 1,
                status: 1,
                amount: 1,
                dueDate: 1,
                frequency: 1,
                intervalId: 1,
                failedReasonAuthorization: 1,
                failedReasonCaptured: 1,
                rescheduled: 1,
                transactionId: 1,
                retries: 1,
                commission: 1,
                creditorAmount: 1,
                timePeriod: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          pendingCaptured: [
            {$match: {authorized: 'Success', captured: 'Pending'}},
            {
              $lookup: {
                from: 'cases',
                localField: 'caseId',
                foreignField: '_id',
                as: 'caseDetails',
              },
            },
            {$unwind: '$caseDetails'},
            {
              $lookup: {
                from: 'debtors',
                localField: 'caseDetails.debtor',
                foreignField: '_id',
                as: 'caseDetails.debtorDetails',
              },
            },
            {$unwind: '$caseDetails.debtorDetails'},
            {
              $lookup: {
                from: 'creditors',
                localField: 'caseDetails.creditor',
                foreignField: '_id',
                as: 'caseDetails.creditorDetails',
              },
            },
            {$unwind: '$caseDetails.creditorDetails'},
            {
              $project: {
                _id: 0,
                caseId: 1,
                caseDetails: 1,
                authorized: 1,
                captured: 1,
                status: 1,
                amount: 1,
                dueDate: 1,
                frequency: 1,
                intervalId: 1,
                failedReasonAuthorization: 1,
                failedReasonCaptured: 1,
                rescheduled: 1,
                transactionId: 1,
                retries: 1,
                commission: 1,
                creditorAmount: 1,
                timePeriod: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          failedAuthorized: [
            {$match: {authorized: 'Failed'}},
            {
              $lookup: {
                from: 'cases',
                localField: 'caseId',
                foreignField: '_id',
                as: 'caseDetails',
              },
            },
            {$unwind: '$caseDetails'},
            {
              $lookup: {
                from: 'debtors',
                localField: 'caseDetails.debtor',
                foreignField: '_id',
                as: 'caseDetails.debtorDetails',
              },
            },
            {$unwind: '$caseDetails.debtorDetails'},
            {
              $lookup: {
                from: 'creditors',
                localField: 'caseDetails.creditor',
                foreignField: '_id',
                as: 'caseDetails.creditorDetails',
              },
            },
            {$unwind: '$caseDetails.creditorDetails'},
            {
              $project: {
                _id: 0,
                caseId: 1,
                caseDetails: 1,
                authorized: 1,
                captured: 1,
                status: 1,
                amount: 1,
                dueDate: 1,
                frequency: 1,
                intervalId: 1,
                failedReasonAuthorization: 1,
                failedReasonCaptured: 1,
                rescheduled: 1,
                transactionId: 1,
                retries: 1,
                commission: 1,
                creditorAmount: 1,
                timePeriod: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          failedCaptured: [
            {$match: {authorized: 'Success', captured: 'Failed'}},
            {
              $lookup: {
                from: 'cases',
                localField: 'caseId',
                foreignField: '_id',
                as: 'caseDetails',
              },
            },
            {$unwind: '$caseDetails'},
            {
              $lookup: {
                from: 'debtors',
                localField: 'caseDetails.debtor',
                foreignField: '_id',
                as: 'caseDetails.debtorDetails',
              },
            },
            {$unwind: '$caseDetails.debtorDetails'},
            {
              $lookup: {
                from: 'creditors',
                localField: 'caseDetails.creditor',
                foreignField: '_id',
                as: 'caseDetails.creditorDetails',
              },
            },
            {$unwind: '$caseDetails.creditorDetails'},
            {
              $project: {
                _id: 0,
                caseId: 1,
                caseDetails: 1,
                authorized: 1,
                captured: 1,
                status: 1,
                amount: 1,
                dueDate: 1,
                frequency: 1,
                intervalId: 1,
                failedReasonAuthorization: 1,
                failedReasonCaptured: 1,
                rescheduled: 1,
                transactionId: 1,
                retries: 1,
                commission: 1,
                creditorAmount: 1,
                timePeriod: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
        },
      },
    ];

    return await this.paymentRepository.applyAggregate(pipeline);
  }
}
export default new PaymentUtil();
