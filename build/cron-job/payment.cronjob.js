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
const url_1 = require("url");
const paymentLogging_repository_1 = require("../api/repository/paymentLogging/paymentLogging.repository");
const paymentLogging_repomodel_1 = require("../database/repomodels/paymentLogging.repomodel");
const common_util_1 = __importDefault(require("../utils/common.util"));
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
        await this.pendingCaptured(payments, cronId);
        await this.failedAuthorized(payments, cronId, settings);
        await this.failedCaptured(payments, cronId, settings);
    }
    shouldAuthorize(unit, value, payment) {
        const dueDate = new Date(payment.dueDate);
        const currentDate = new Date(common_util_1.default.getCurrentDate());
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
    defaultRetryInterval() {
        const paymentsAuthorizations = {
            retryInterval: {
                failedAuthorization: {
                    unit: 'hours',
                    value: 2,
                    maxRetry: 1,
                },
                failedPayment: {
                    unit: 'days',
                    value: 2,
                    maxRetry: 1,
                },
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
        await this.processAuthorized(pendingAuthorized, cronId, false);
    }
    async pendingCaptured(payments, cronId) {
        const currentDate = new Date(common_util_1.default.getCurrentDate());
        const pendingCaptured = payments[0].pendingAuthorized.filter((payment) => {
            return currentDate.getTime() <= new Date(payment.dueDate).getTime();
        });
        await this.processCapture(pendingCaptured, cronId, false);
    }
    retry(unit, value, payment) {
        const dueDate = new Date(payment.dueDate);
        const currentDate = new Date(common_util_1.default.getCurrentDate());
        let thresholdDate = new Date(dueDate);
        switch (unit) {
            case 'hours':
                thresholdDate.setHours(dueDate.getHours() + value);
                break;
            case 'days':
                thresholdDate.setDate(dueDate.getDate() + value);
                break;
            default:
                throw new Error(`Unsupported unit: ${unit}`);
        }
        // Compare year, month, and date
        return (currentDate.getUTCFullYear() === thresholdDate.getUTCFullYear() &&
            currentDate.getUTCMonth() === thresholdDate.getUTCMonth() &&
            currentDate.getUTCDate() === thresholdDate.getUTCDate());
    }
    async failedAuthorized(payments, cronId, settings) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const filterPaymentWithRetries = payments[0].failedAuthorized.filter((payment) => {
            return (payment.retriesAuth != retryInterval.failedAuthorization.maxRetry);
        });
        const failedAuthorized = filterPaymentWithRetries.filter((payment) => {
            const interval = retryInterval.failedAuthorization;
            const retry = payment.retriesAuth + 1;
            const value = interval.value * retry;
            return this.retry(interval.unit, value, payment);
        });
        await this.processAuthorized(failedAuthorized, cronId, true);
        console.log(failedAuthorized, 'failedAuthorized');
    }
    async processAuthorized(payments, cronId, retryPlus) {
        const paymentType = 'Credit Card';
        for (const payment of payments) {
            console.log('calculation');
            if (paymentType === 'Credit Card') {
                console.log(payment.amount, 'payment.amount');
                const response = await this.paymentService.authorizeCreditCard(payment.amount, '');
                await this.processAuthorizedResponse(payment, response, retryPlus, cronId, 0);
                const commission = await this.checkCommission(payment);
                if (commission) {
                    const response = await this.paymentService.authorizeCreditCard(commission, '');
                    await this.processAuthorizedResponse(payment, response, retryPlus, cronId, commission);
                }
                // const responseNum = new URLSearchParams(response).get('response');
                // const responseText = new URLSearchParams(response).get('responsetext');
                // const paymentLogging = new PaymentLogging();
                // const updateObjPayment = {};
                // if (responseNum === '1') {
                //   const transactionId = new URLSearchParams(response).get(
                //     'transactionid'
                //   );
                //   console.log(transactionId, 'transactionId');
                //   updateObjPayment['debtorTransId'] = transactionId;
                //   updateObjPayment['authorized'] = 'Success';
                //   updateObjPayment['status'] = 'Pending';
                //   // await this.paymentRepository.updateById<IPayment>(payment._id, {
                //   //   transactionId: transactionId,
                //   //   authorized: 'Success',
                //   //   status: 'Pending',
                //   // });
                //   paymentLogging.successReason = responseText;
                // } else {
                //   updateObjPayment['authorized'] = 'Failed';
                //   updateObjPayment['status'] = 'Pending';
                //   updateObjPayment['failedReasonAuthorization'] = responseText;
                //   // await this.paymentRepository.updateById<IPayment>(payment._id, {
                //   //   authorized: 'Failed',
                //   //   status: 'Pending',
                //   // });
                //   paymentLogging.failReason = responseText;
                // }
                // if (retryPlus)
                //   updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
                // await this.paymentRepository.updateById<IPayment>(
                //   payment._id,
                //   updateObjPayment
                // );
                // paymentLogging.caseId = String(payment.caseId);
                // paymentLogging.createdAt = commonUtil.getCurrentDate();
                // paymentLogging.paymentId = String(payment._id);
                // paymentLogging.cronId = cronId;
                // paymentLogging.paymentType = 'Credit Auth';
                // paymentLogging.debtor = String(payment.caseDetails.debtor);
                // await this.paymentLoggingRepository.create(paymentLogging as any);
            }
        }
    }
    async processAuthorizedResponse(payment, response, retryPlus, cronId, commission) {
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            console.log(transactionId, 'transactionId');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            updateObjPayment['status'] = 'Pending';
            // await this.paymentRepository.updateById<IPayment>(payment._id, {
            //   transactionId: transactionId,
            //   authorized: 'Success',
            //   status: 'Pending',
            // });
            paymentLogging.successReason = responseText;
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['status'] = 'Pending';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // await this.paymentRepository.updateById<IPayment>(payment._id, {
            //   authorized: 'Failed',
            //   status: 'Pending',
            // });
            paymentLogging.failReason = responseText;
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        await this.paymentRepository.updateById(payment._id, updateObjPayment);
        paymentLogging.caseId = String(payment.caseId);
        paymentLogging.createdAt = common_util_1.default.getCurrentDate();
        paymentLogging.paymentId = String(payment._id);
        paymentLogging.cronId = cronId;
        paymentLogging.paymentType = 'Credit Auth';
        paymentLogging.debtor = String(payment.caseDetails.debtor);
        await this.paymentLoggingRepository.create(paymentLogging);
    }
    async checkCommission(payment) {
        if (!payment.commission)
            return payment.commission;
        const totalCommision = payment.caseDetails.commissionCalculated;
        const commissionPaid = payment.caseDetails.commissionPaying;
        if ((totalCommision | 0) === ((commissionPaid + payment.commission) | 0))
            return 0;
        if ((totalCommision | 0) < ((commissionPaid + payment.commission) | 0)) {
            const temp = totalCommision - (commissionPaid + payment.commission);
            const remaining = payment.commission - temp;
            return remaining;
        }
        return payment.commision;
    }
    async failedCaptured(payments, cronId, settings) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const filterPaymentWithRetries = payments[0].failedAuthorized.filter((payment) => {
            return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
        });
        const failedAuthorized = filterPaymentWithRetries.filter((payment) => {
            const interval = retryInterval.failedPayment;
            const retry = payment.retriesCapture + 1;
            const value = interval.value * retry;
            return this.retry(interval.unit, value, payment);
        });
        await this.processCapture(failedAuthorized, cronId, true);
        console.log(failedAuthorized, 'failedAuthorized');
    }
    async processCapture(payments, cronId, retryPlus) {
        const paymentType = 'Credit Card';
        for (const payment of payments) {
            if (paymentType === 'Credit Card') {
                const response = await this.paymentService.captureCreditCard('', payment.debtorTransId);
                const responseNum = new url_1.URLSearchParams(response).get('response');
                const responseText = new url_1.URLSearchParams(response).get('responsetext');
                const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
                const updateObjPayment = {};
                if (responseNum === '1') {
                    const transactionId = new url_1.URLSearchParams(response).get('transactionid');
                    console.log(transactionId, 'transactionId');
                    updateObjPayment['captured'] = 'Success';
                    updateObjPayment['status'] = 'Success';
                    // await this.paymentRepository.updateById<IPayment>(payment._id, {
                    //   captured: 'Success',
                    //   status: 'Success',
                    // });
                    paymentLogging.successReason = responseText;
                }
                else {
                    updateObjPayment['captured'] = 'Failed';
                    updateObjPayment['failedReasonCaptured'] = responseText;
                    // await this.paymentRepository.updateById<IPayment>(payment._id, {
                    //   captured: 'Failed',
                    // });
                    paymentLogging.failReason = responseText;
                }
                if (retryPlus)
                    updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
                paymentLogging.caseId = String(payment.caseId);
                paymentLogging.createdAt = common_util_1.default.getCurrentDate();
                paymentLogging.paymentId = String(payment._id);
                paymentLogging.cronId = cronId;
                paymentLogging.paymentType = 'Credit Capture';
                paymentLogging.debtor = String(payment.caseDetails.debtor);
                await this.paymentLoggingRepository.create(paymentLogging);
            }
        }
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map