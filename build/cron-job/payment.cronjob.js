"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const payment_util_1 = __importDefault(require("../utils/payment.util"));
const settings_repository_1 = require("../api/repository/setting/settings.repository");
const payment_service_1 = __importDefault(require("../api/services/payment.service"));
const paymentLogging_repository_1 = require("../api/repository/paymentLogging/paymentLogging.repository");
const uuid_1 = require("uuid");
console.log('i am here');
class CronJob {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.paymentService = new payment_service_1.default();
        this.paymentLoggingRepository = new paymentLogging_repository_1.PaymentLoggingRepository();
    }
    startCronJob() {
        node_cron_1.default.schedule('* * * * *', async () => {
            console.log('Running a task every minute');
            const payments = await payment_util_1.default.getAllCronJobPayments();
            // await this.getFilteredPayment(payments);
        });
    }
    async getFilteredPayment() {
        const payments = await payment_util_1.default.getAllCronJobPayments();
        // await this.getFilteredPayment(payments);
        const settings = await this.settingsRepository.getAll();
        // await this.paymentRepository.updateMany<IPayment>(
        //   {},
        //   {timePeriod: 'Weekly'}
        // );
        const cronId = (0, uuid_1.v4)();
        await this.pendingAuthorized(settings, payments, cronId);
        // const pendingCaptured = payments[0].pendingCaptured.filter(
        //   (payment: IPayment) => {
        //     const interval =
        //       authorizationInterval[payment.timePeriod.toLowerCase()];
        //     return this.shouldAuthorize(interval.unit, interval.value, payment);
        //   }
        // );
        // console.log(pendingCaptured, 'pendingCaptured');
        // const failedAuthorized = payments[0].failedAuthorized.filter(
        //   (payment: IPayment) => {
        //     const interval =
        //       authorizationInterval[payment.timePeriod.toLowerCase()];
        //     return this.shouldAuthorize(interval.unit, interval.value, payment);
        //   }
        // );
        // console.log(failedAuthorized, 'failedAuthorized');
        // const failedCaptured = payments[0].failedCaptured.filter(
        //   (payment: IPayment) => {
        //     const interval =
        //       authorizationInterval[payment.timePeriod.toLowerCase()];
        //     return this.shouldAuthorize(interval.unit, interval.value, payment);
        //   }
        // );
        // console.log(failedCaptured, 'failedCaptured');
    }
    shouldAuthorize(unit, value = 2, payment) {
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
        const paymentsAuthorizations = {
            authorizationInterval: {
                custom: { unit: 'hours', value: 2 },
                daily: { unit: 'hours', value: 2 },
                weekly: { unit: 'days', value: 2 },
                fortnightly: { unit: 'days', value: 2 },
                monthly: { unit: 'days', value: 2 },
            },
        };
        return paymentsAuthorizations;
    }
    async pendingAuthorized(settings, payments, cronId) {
        const { authorizationInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultAuthInterval();
        console.log(authorizationInterval, 'authorizationInterval');
        console.log(payments[0].pendingAuthorized.length, 'payments[0].pendingAuthorized');
        const pendingAuthorized = payments[0].pendingAuthorized.filter((payment) => {
            const interval = authorizationInterval[payment.timePeriod.toLowerCase()];
            return this.shouldAuthorize(interval.unit, interval.value, payment);
        });
        console.log(pendingAuthorized, 'pendingAuthorizedd');
        const paymentType = 'Credit Card';
        for (const payment of pendingAuthorized) {
            console.log('calculation');
            if (paymentType === 'Credit Card') {
                console.log(payment.amount, 'payment.amount');
                const response = await this.paymentService.authorizeCreditCard(payment.amount, '');
                // const transactionId = new URLSearchParams(response).get(
                //   'transactionid'
                // );
                // console.log(transactionId, 'transactionId');
                // await this.paymentRepository.updateById<IPayment>(payment._id, {
                //   transactionId: transactionId,
                // });
                // const responseText = new URLSearchParams(response).get('responsetext');
                // const paymentLogging = new PaymentLogging();
                // paymentLogging.caseId = String(payment.caseId);
                // paymentLogging.createdAt = commonUtil.getCurrentDate();
                // paymentLogging.paymentId = String(payment._id);
                // paymentLogging.cronId = cronId;
                // paymentLogging.successReason = responseText;
                // paymentLogging.transactionId = transactionId;
                // paymentLogging.paymentType = 'Credit Auth';
                // paymentLogging.debtor = String(payment.caseDetails.debtor);
                // await this.paymentLoggingRepository.create(paymentLogging as any);
            }
            break;
        }
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map