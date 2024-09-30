"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const payment_repository_1 = require("../api/repository/payment/payment.repository");
class PaymentUtil {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    async getFilteredPayments(payments) {
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
        return this.getFilteredPaymentsObj(transformedArray);
    }
    async getFilteredPaymentsObj(transformedArray) {
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
        const failedPayments = [];
        const successPayments = [];
        const failedAuthorizations = [];
        const successAuthorizations = [];
        const upcomingPayments = [];
        for (const payment of transformedArray) {
            switch (payment.captured) {
                case 'Failed':
                    failedPayments.push(payment);
                    break;
                case 'Success':
                    successPayments.push(payment);
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
        }
        return {
            failedPayments: failedPayments,
            successPayments: successPayments,
            failedAuthorizations: failedAuthorizations,
            successAuthorizations: successAuthorizations,
            upcomingPayments: upcomingPayments,
        };
    }
    async getPendingAuthorized() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Pending',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', select: ['_id'], populate: 'debtor' }]);
    }
    async getPendingCaptured() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Pending',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', select: ['_id'], populate: 'debtor' }]);
    }
    async getFailedAuthorized() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Failed',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', select: ['_id'], populate: 'debtor' }]);
    }
    async getFailedCaptured() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Failed',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', select: ['_id'], populate: 'debtor' }]);
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
    async searchAndFilterHomePayments(payments, req) {
        // Helper function to apply text search
        const applyTextSearch = (paymentObj, text) => {
            const regex = new RegExp(text, 'i');
            return (regex.test(paymentObj.fullName) ||
                regex.test(paymentObj.caseOwner) ||
                regex.test(paymentObj.SSID));
        };
        // Helper function to apply numeric/date filters
        const applyFilters = (paymentObj, filters) => {
            if (filters.totalDebt &&
                (paymentObj.totalDebt < filters.totalDebt.min ||
                    paymentObj.totalDebt > filters.totalDebt.max)) {
                return false;
            }
            if (filters.dueDate &&
                (new Date(paymentObj.dueDate) < new Date(filters.dueDate.start) ||
                    new Date(paymentObj.dueDate) > new Date(filters.dueDate.end))) {
                return false;
            }
            if (filters.tryDate &&
                (new Date(paymentObj.tryDate) < new Date(filters.tryDate.start) ||
                    new Date(paymentObj.tryDate) > new Date(filters.tryDate.end))) {
                return false;
            }
            return true;
        };
        let text = '', filters = {};
        if (req.query.search === 'true') {
            text = req.body.text;
        }
        if (req.query.filters === 'true') {
            filters = req.body.filters;
        }
        // Apply text search and filters
        let filteredPayments = payments.filter(paymentObj => {
            const textMatches = !text || applyTextSearch(paymentObj, text);
            const filtersMatch = Object.keys(filters).length === 0 || applyFilters(paymentObj, filters);
            return textMatches && filtersMatch;
        });
        return filteredPayments;
    }
}
exports.default = new PaymentUtil();
//# sourceMappingURL=payment.util.js.map