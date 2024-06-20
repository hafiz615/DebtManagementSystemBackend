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
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const payment_repomodel_1 = require("../database/repomodels/payment.repomodel");
class CronJob {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.paymentService = new payment_service_1.default();
        this.paymentLoggingRepository = new paymentLogging_repository_1.PaymentLoggingRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    startCronJob() {
        node_cron_1.default.schedule('0 * * * *', async () => {
            console.log('Running a task every zero of an hour');
            const payments = await payment_util_1.default.getAllCronJobPayments();
            await this.processPayments(payments);
        });
        node_cron_1.default.schedule('*/30 * * * *', async () => {
            console.log('Running a task every 30 min of an hour');
            const cronId = (0, uuid_1.v4)();
            const debtors = await this.debtorRepository.getAllWithoutPagination({}, undefined, '+totalCommission +commissionPaid +weeklyCommission +weeklyCommissionPaid +weeklyCommissionDate +commissionPaymentId', { createdAt: 1 });
            for (const debtor of debtors) {
                if (debtor.totalCommission === debtor.commissionPaid) {
                    continue;
                }
                let payment;
                if (debtor.commissionPaymentId) {
                    payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                }
                else {
                    payment = await this.getCommissionDocument(debtor._id);
                }
                if (debtor.weeklyCommissionPaid &&
                    this.checkCommissionTimePeriod(payment.dueDate, 'weekly')) {
                    const paymentDoc = await this.getCommissionDocument(debtor._id);
                    await this.debtorRepository.updateById(debtor._id, {
                        weeklyCommissionPaid: false,
                        commissionPaymentId: paymentDoc.id,
                    });
                    continue;
                }
                if (debtor.weeklyCommissionPaid &&
                    !this.checkCommissionTimePeriod(payment.dueDate, 'weekly')) {
                    continue;
                }
                let commisionToPay = await this.calculateCommission(debtor.totalCommission, debtor.commissionPaid, debtor.weeklyCommission);
                const retryCommissionInterval = {
                    unit: 'hours',
                    value: 8,
                    maxRetry: 3,
                };
                if (!debtor.weeklyCommissionPaid) {
                    if (payment.authorized === 'Pending') {
                        if (debtor.paymentType === 'cc') {
                            const response = await this.paymentService.authorizeCreditCard(commisionToPay, debtor.customerVaultId);
                            const result = await this.processCommissionAuthResponse(payment, response, false, cronId);
                            if (result) {
                                payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                            }
                        }
                        if (debtor.paymentType === 'ck') {
                            const response = await this.paymentService.achCredit(debtor.customerVaultId, commisionToPay, '');
                            const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'ck');
                            if (result) {
                                await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                            }
                        }
                    }
                    if (payment.authorized === 'Failed') {
                        if (payment.retriesAuth === retryCommissionInterval.maxRetry)
                            continue;
                        if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
                            if (debtor.paymentType === 'cc') {
                                const response = await this.paymentService.authorizeCreditCard(commisionToPay, debtor.customerVaultId);
                                const result = await this.processCommissionAuthResponse(payment, response, true, cronId);
                                if (result) {
                                    payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                                }
                            }
                        }
                    }
                    if (payment.authorized === 'Success') {
                        if (payment.captured === 'Pending') {
                            if (debtor.paymentType === 'cc') {
                                const response = await this.paymentService.captureCreditCard(debtor.customerVaultId, payment.debtorTransId, '');
                                const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'cc');
                                if (result) {
                                    await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                }
                            }
                            if (debtor.paymentType === 'ck') {
                                const response = await this.paymentService.achCredit(debtor.customerVaultId, commisionToPay, '');
                                const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'ck');
                                if (result) {
                                    await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                }
                            }
                        }
                        if (payment.captured === 'Failed') {
                            if (payment.retriesCapture === retryCommissionInterval.maxRetry) {
                                continue;
                            }
                            if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
                                if (debtor.paymentType === 'cc') {
                                    const response = await this.paymentService.captureCreditCard(debtor.customerVaultId, payment.debtorTransId, '');
                                    const result = await this.processCommissionCaptureResponse(payment, response, true, cronId, 'cc');
                                    if (result) {
                                        await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                    }
                                }
                                if (debtor.paymentType === 'ck') {
                                    const response = await this.paymentService.achCredit(debtor.customerVaultId, commisionToPay, '');
                                    const result = await this.processCommissionCaptureResponse(payment, response, true, cronId, 'ck');
                                    if (result) {
                                        await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    async processPayments(payments) {
        // const payments: any = await paymentUtil.getAllCronJobPayments();
        const settings = await this.settingsRepository.getAllWithoutPagination();
        const cronId = (0, uuid_1.v4)();
        await this.pendingAuthorized(settings, payments, cronId);
        await this.pendingCaptured(payments, cronId, settings);
        await this.failedAuthorized(payments, cronId, settings);
        await this.failedCaptured(payments, cronId, settings);
    }
    async updateDebtorPaidValues(id, commission) {
        await this.debtorRepository.updateById(id, {
            weeklyCommissionPaid: true,
            $inc: { commissionPaid: commission },
        });
    }
    async calculateCommission(totalCommision, commissionPaid, weeklyCommission) {
        let sumTotalPaidWeekly = commissionPaid + weeklyCommission;
        if (sumTotalPaidWeekly <= totalCommision)
            return weeklyCommission;
        let amountUp = sumTotalPaidWeekly - totalCommision;
        return weeklyCommission - amountUp;
    }
    async getCommissionDocument(debtorId) {
        const payment = new payment_repomodel_1.Payment();
        payment.timePeriod = 'hours';
        payment.dueDate = common_util_1.default.getCurrentDate();
        payment.debtorId = debtorId;
        payment.caseId = null;
        const createdPayment = await this.paymentRepository.create(payment);
        await this.debtorRepository.updateById(debtorId, {
            commissionPaymentId: createdPayment.id,
        });
        return createdPayment;
    }
    async processCommissionAuthResponse(payment, response, retryPlus, cronId) {
        const retryCommissionInterval = {
            unit: 'hours',
            value: 8,
            maxRetry: 3,
        };
        let successAuth = false;
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            updateObjPayment['status'] = 'Pending';
            paymentLogging.successReason = responseText;
            successAuth = true;
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['status'] = 'Pending';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            const retry = payment.retriesAuth + 1;
            const value = retryCommissionInterval.value * retry;
            const retryDate = this.getRetryDate(retryCommissionInterval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            paymentLogging.failReason = responseText;
            console.log('send email through template');
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        await this.paymentRepository.updateById(payment._id, updateObjPayment);
        paymentLogging.caseId = String(payment.caseId);
        paymentLogging.createdAt = common_util_1.default.getCurrentDate();
        paymentLogging.paymentId = String(payment._id);
        paymentLogging.cronId = cronId;
        paymentLogging.paymentType = 'Credit commission auth';
        paymentLogging.debtor = String(payment.debtorId);
        await this.paymentLoggingRepository.create(paymentLogging);
        return successAuth;
    }
    async processCommissionCaptureResponse(payment, response, retryPlus, cronId, type) {
        const retryCommissionInterval = {
            unit: 'hours',
            value: 8,
            maxRetry: 3,
        };
        let successCapture = false;
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['captured'] = 'Success';
            updateObjPayment['status'] = 'Success';
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['debtorTransId'] = transactionId;
            }
            paymentLogging.successReason = responseText;
            await this.debtorRepository.updateById(payment._id, {
                weeklyCommissionPaid: true,
            });
            successCapture = true;
        }
        else {
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['status'] = 'Pending';
            }
            updateObjPayment['captured'] = 'Failed';
            updateObjPayment['failedReasonCaptured'] = responseText;
            const retry = payment.retriesCapture + 1;
            const value = retryCommissionInterval.value * retry;
            const retryDate = this.getRetryDate(retryCommissionInterval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            paymentLogging.failReason = responseText;
            console.log('send email'); // add code
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        await this.paymentRepository.updateById(payment._id, updateObjPayment);
        paymentLogging.caseId = String(payment.caseId);
        paymentLogging.createdAt = common_util_1.default.getCurrentDate();
        paymentLogging.paymentId = String(payment._id);
        paymentLogging.cronId = cronId;
        paymentLogging.paymentType = 'Credit commission capture';
        paymentLogging.debtor = String(payment.debtorId);
        await this.paymentLoggingRepository.create(paymentLogging);
        return successCapture;
    }
    checkCommissionTimePeriod(date, timePeriod) {
        const dateTemp = new Date(date);
        const currentDate = new Date(common_util_1.default.getCurrentDate());
        switch (timePeriod) {
            case 'weekly':
                dateTemp.setDate(dateTemp.getDate() + 7);
                break;
            case 'hours':
                dateTemp.setHours(dateTemp.getHours() + 8);
                break;
            default:
                break;
        }
        return currentDate >= dateTemp;
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
        const pendingAuthorized = payments[0].pendingAuthorized.filter((payment) => {
            if (payment.timePeriod) {
                const interval = authorizationInterval[payment.timePeriod.toLowerCase()];
                return this.shouldAuthorize(interval.unit, interval.value, payment);
            }
            return false;
        });
        await this.processAuthorized(pendingAuthorized, cronId, false, settings);
    }
    async groupPaymentsByDebtor(payments) {
        let resultObj = {};
        const seen = new Set();
        for (const payment of payments) {
            if (!seen.has(String(payment.caseDetails.debtor))) {
                seen.add(String(payment.caseDetails.debtor));
                resultObj[String(payment.caseDetails.debtor)] = [payment];
            }
            else {
                resultObj[String(payment.caseDetails.debtor)].push(payment);
            }
        }
        return resultObj;
    }
    async pendingCaptured(payments, cronId, settings) {
        const currentDate = new Date(common_util_1.default.getCurrentDate());
        const pendingCaptured = payments[0].pendingCaptured.filter((payment) => {
            return currentDate.getTime() >= new Date(payment.dueDate).getTime();
        });
        await this.processCapture(pendingCaptured, cronId, false, settings);
    }
    getRetryDate(unit, value, dueDate) {
        const dueDateTemp = new Date(dueDate);
        let thresholdDate = new Date(dueDateTemp);
        switch (unit) {
            case 'hours':
                thresholdDate.setHours(dueDateTemp.getHours() + value);
                break;
            case 'days':
                thresholdDate.setDate(dueDateTemp.getDate() + value);
                break;
            default:
                throw new Error(`Unsupported unit: ${unit}`);
        }
        return thresholdDate.toUTCString();
    }
    retry(retryDate) {
        const currentDate = new Date(common_util_1.default.getCurrentDate());
        let thresholdDate = new Date(retryDate);
        return thresholdDate <= currentDate;
    }
    async failedAuthorized(payments, cronId, settings) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const filterPaymentWithRetries = payments[0].failedAuthorized.filter((payment) => {
            return (payment.retriesAuth != retryInterval.failedAuthorization.maxRetry);
        });
        const failedAuthorized = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        await this.processAuthorized(failedAuthorized, cronId, true, settings);
    }
    async processAuthorized(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            if (payment.caseDetails.debtorDetails.paymentType === 'cc') {
                const response = await this.paymentService.authorizeCreditCard(payment.amount, payment.caseDetails.debtorDetails.customerVaultId);
                await this.processAuthorizedResponse(payment, response, retryPlus, cronId, settings);
            }
            if (payment.caseDetails.debtorDetails.paymentType === 'ck') {
                const response = await this.paymentService.achCredit(payment.caseDetails.debtorDetails.customerVaultId, payment.amount, payment.caseDetails.creditorDetails.creditorSecurityKey);
                await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck');
            }
        }
    }
    async processAuthorizedResponse(payment, response, retryPlus, cronId, settings) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            updateObjPayment['status'] = 'Pending';
            paymentLogging.successReason = responseText;
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            const interval = retryInterval.failedAuthorization;
            const retry = payment.retriesAuth + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            paymentLogging.failReason = responseText;
            console.log('send email through template');
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
        paymentLogging.creditor = String(payment.caseDetails.creditor);
        await this.paymentLoggingRepository.create(paymentLogging);
    }
    // async checkCommission(payment: any) {
    //   if (!payment.commission) return payment.commission;
    //   const totalCommision = payment.caseDetails.commissionCalculated;
    //   const commissionPaid = payment.caseDetails.commissionPaying;
    //   if ((totalCommision | 0) === ((commissionPaid + payment.commission) | 0))
    //     return 0;
    //   if ((totalCommision | 0) < ((commissionPaid + payment.commission) | 0)) {
    //     const temp = totalCommision - (commissionPaid + payment.commission);
    //     const remaining = payment.commission - temp;
    //     return remaining;
    //   }
    //   return payment.commision;
    // }
    async failedCaptured(payments, cronId, settings) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const filterPaymentWithRetries = payments[0].failedCaptured.filter((payment) => {
            return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
        });
        const failedCaptured = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        await this.processCapture(failedCaptured, cronId, true, settings);
    }
    async processCapture(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            if (payment.caseDetails.debtorDetails.paymentType === 'cc') {
                const response = await this.paymentService.captureCreditCard(payment.caseDetails.debtorDetails.customerVaultId, payment.debtorTransId, payment.caseDetails.creditorDetails.creditorSecurityKey);
                await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'cc');
            }
            if (payment.caseDetails.debtorDetails.paymentType === 'ck') {
                const response = await this.paymentService.achCredit(payment.caseDetails.debtorDetails.customerVaultId, payment.amount, payment.caseDetails.creditorDetails.creditorSecurityKey);
                await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck');
            }
        }
    }
    async processCaptureResponse(payment, response, retryPlus, cronId, settings, type) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['captured'] = 'Success';
            updateObjPayment['status'] = 'Success';
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['debtorTransId'] = transactionId;
            }
            paymentLogging.successReason = responseText;
        }
        else {
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['status'] = 'Pending';
            }
            updateObjPayment['captured'] = 'Failed';
            updateObjPayment['failedReasonCaptured'] = responseText;
            const interval = retryInterval.failedPayment;
            const retry = payment.retriesCapture + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            paymentLogging.failReason = responseText;
            console.log('send email'); // add code
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
        paymentLogging.creditor = String(payment.caseDetails.creditor);
        await this.paymentLoggingRepository.create(paymentLogging);
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map