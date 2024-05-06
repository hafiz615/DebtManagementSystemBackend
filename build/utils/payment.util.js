"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_util_1 = __importDefault(require("./common.util"));
class PaymentUtil {
    async getFilteredPayments(payments) {
        const transformedArray = payments.map(obj => ({
            fullName: obj.caseId.debtor.basicInformation.fullName,
            SSID: obj.caseId.debtor.basicInformation.SSID,
            authorized: obj.authorized,
            captured: obj.captured,
            amount: obj.amount,
            dueDate: obj.dueDate,
            failedReasonAuthorization: obj.failedReasonAuthorization,
            failedReasonCaptured: obj.failedReasonCaptured,
        }));
        const failedPayments = transformedArray.filter(payment => payment.captured === 'failed');
        const successPayments = transformedArray.filter(payment => payment.captured === 'success');
        const failedAuthorizations = transformedArray.filter(payment => payment.authorized === 'failed');
        const successAuthorizations = transformedArray.filter(payment => payment.authorized === 'success');
        return {
            failedPayments: failedPayments,
            successPayments: successPayments,
            failedAuthorizations: failedAuthorizations,
            successAuthorizations: successAuthorizations,
        };
    }
    async getFilteredUpcomingPayments(cases, currentDate) {
        const upcomingPayments = [];
        const buildUpcomingPayment = {};
        for (const tempCase of cases) {
            tempCase.intervals.forEach(interval => {
                if (new Date(interval.startDate).getTime() >
                    new Date(currentDate).getTime()) {
                    const debtor = tempCase.debtor;
                    buildUpcomingPayment['amount'] = interval.amount;
                    buildUpcomingPayment['dueDate'] = interval.startDate;
                    buildUpcomingPayment['fullName'] = debtor.basicInformation.fullName;
                    buildUpcomingPayment['SSID'] = debtor.basicInformation.SSID;
                    upcomingPayments.push(buildUpcomingPayment);
                }
            });
        }
        return upcomingPayments;
    }
    async getFilteredUpcomingPaymentsCase(tempCase) {
        let currentDate = common_util_1.default.getCurrentDate();
        const upcomingPayments = [];
        const buildUpcomingPayment = {};
        tempCase.intervals.forEach(interval => {
            if (new Date(interval.startDate).getTime() > new Date(currentDate).getTime()) {
                const debtor = tempCase.debtor;
                buildUpcomingPayment['amount'] = interval.amount;
                buildUpcomingPayment['dueDate'] = interval.startDate;
                buildUpcomingPayment['fullName'] = debtor.basicInformation.fullName;
                buildUpcomingPayment['SSID'] = debtor.basicInformation.SSID;
                upcomingPayments.push(buildUpcomingPayment);
            }
        });
        return upcomingPayments;
    }
}
exports.default = new PaymentUtil();
//# sourceMappingURL=payment.util.js.map