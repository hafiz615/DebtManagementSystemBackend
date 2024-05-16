"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PaymentUtil {
    async getFilteredPayments(payments) {
        const transformedArray = payments.map(obj => ({
            status: obj.status,
            caseOwner: obj.caseId.caseOwner,
            totalDebt: obj.caseId.totalDebt,
            fullName: obj.caseId.debtor.basicInformation.fullName,
            SSID: obj.caseId.debtor.basicInformation.SSID,
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
    async getFilteredPaymentsObj(transformedArray) {
        const failedPayments = transformedArray.filter(payment => payment.captured === 'Failed');
        const successPayments = transformedArray.filter(payment => payment.captured === 'Success');
        const failedAuthorizations = transformedArray.filter(payment => payment.authorized === 'Failed');
        const successAuthorizations = transformedArray.filter(payment => payment.authorized === 'Success');
        const upcomingPayments = transformedArray.filter(payment => payment.status === 'Upcoming');
        return {
            failedPayments: failedPayments,
            successPayments: successPayments,
            failedAuthorizations: failedAuthorizations,
            successAuthorizations: successAuthorizations,
            upcomingPayments: upcomingPayments,
        };
    }
}
exports.default = new PaymentUtil();
//# sourceMappingURL=payment.util.js.map