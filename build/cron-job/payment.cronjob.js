"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const payment_util_1 = __importDefault(require("../utils/payment.util"));
console.log('i am here');
class CronJob {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    startCronJob() {
        node_cron_1.default.schedule('* * * * *', async () => {
            console.log('Running a task every minute');
            const payments = await payment_util_1.default.getAllCronJobPayments();
        });
    }
    // getFilteredPayment(result: any) {
    // const {authorizationInterval} = settings.paymentsAuthorizations;
    // const pendingAuthorized = result[0].pendingAuthorized.filter(payment => {
    // const interval = authorizationInterval[payment.timePeriod.toLowerCase()];
    //   return this.shouldAuthorize(interval.unit, interval.value, payment);
    // });
    // const pendingCaptured = result[0].pendingCaptured.filter(payment => {
    // const interval =
    //   authorizationInterval[
    //     payment.timePeriod.toLowerCase()
    //   ];
    //     return this.shouldAuthorize(interval.unit, interval.value, payment);
    //   });
    //   const failedAuthorized = result[0].failedAuthorized.filter(payment => {
    //     const interval =
    //       authorizationInterval[
    //         payment.timePeriod.toLowerCase() as keyof AuthorizationInterval
    //       ];
    //     return shouldAuthorize(interval.unit, interval.value, payment);
    //   });
    //   const failedCaptured = result[0].failedCaptured.filter(payment => {
    //     const interval =
    //       authorizationInterval[
    //         payment.timePeriod.toLowerCase() as keyof AuthorizationInterval
    //       ];
    //     return this.shouldAuthorize(interval.unit, interval.value, payment);
    //   });
    // }
    shouldAuthorize(unit, value, payment) {
        const dueDate = new Date(payment.dueDate);
        const currentDate = new Date();
        let thresholdDate = new Date(dueDate);
        switch (unit) {
            case 'hours':
                thresholdDate.setHours(dueDate.getHours() - value);
                break;
            case 'days':
                thresholdDate.setDate(dueDate.getDate() - value);
                break;
            default:
                throw new Error(`Unsupported unit: ${unit}`);
        }
        return currentDate >= thresholdDate;
    }
    defaultAuthInterval() {
        const authorizationInterval = {
            custom: { unit: 'hours', value: 3 },
            daily: { unit: 'hours', value: 5 },
            weekly: { unit: 'days', value: 3 },
            fortnightly: { unit: 'days', value: 2 },
            monthly: { unit: 'days', value: 1 },
        };
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map