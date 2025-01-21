"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const payment_util_1 = __importDefault(require("../utils/payment.util"));
const settings_repository_1 = require("../api/repository/setting/settings.repository");
const url_1 = require("url");
const common_util_1 = __importDefault(require("../utils/common.util"));
const uuid_1 = require("uuid");
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const mongoose_1 = __importDefault(require("mongoose"));
const paynote_util_1 = __importDefault(require("../utils/paynote.util"));
const payment_service_1 = __importDefault(require("../api/services/payment.service"));
const case_repository_1 = require("../api/repository/case/case.repository");
class CronJob {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.paymentService = new payment_service_1.default();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async testCron() {
        let dbconfig = 'mongodb+srv://mohsin123:1732544m@cluster0.fyxwu.mongodb.net/debt-settlement?retryWrites=true&w=majority';
        const options = {
            retryWrites: true,
            autoIndex: true, // build indexes true or false
        };
        const conn = mongoose_1.default.createConnection(dbconfig, options);
        console.log(conn.readyState, 'kjkjk');
        conn.on('connected', () => {
            console.log('Mongoose connection is open');
            // Check if the connection is established
            const isConnected = conn.readyState === 1;
            console.log('Is connected:', isConnected);
        });
        setTimeout(async () => {
            await conn.close(true);
            console.log('done');
            console.log(conn.readyState);
        }, 10000);
        console.log(conn.readyState);
    }
    async testPaynote() {
        const pendingPayments = await this.paymentRepository.getAllWithoutPagination({
            captured: 'Success',
            sendViaPaynote: 'Pending',
            caseId: { $ne: null },
            isDeleted: false,
        }, undefined, undefined, undefined, {
            path: 'caseId',
            select: ['_id', 'caseCode'],
            populate: ['creditor'],
        });
        await this.paynotePending(pendingPayments);
        const failedPayments = await this.paymentRepository.getAllWithoutPagination({
            captured: 'Success',
            sendViaPaynote: 'Failed',
            caseId: { $ne: null },
            isDeleted: false,
        }, undefined, undefined, undefined, {
            path: 'caseId',
            select: ['_id', 'caseCode'],
            populate: ['creditor'],
        });
        await this.paynoteFailed(failedPayments);
    }
    startCronJob() {
        node_cron_1.default.schedule('30 * * * *', async () => {
            console.log('Running a task every zero of an hour');
            await this.processPayments();
        });
        node_cron_1.default.schedule('0 * * * *', async () => {
            console.log('Running a task every zero of an hour');
            await this.processCommissionPayments();
        });
        node_cron_1.default.schedule('15 * * * *', async () => {
            const cases = await this.caseRepository.getAllWithoutPagination({ creditorPaymentsProceed: true }, '_id');
            const caseIds = cases.map(caseTemp => {
                return String(caseTemp._id);
            });
            const pendingPayments = await this.paymentRepository.getAllWithoutPagination({
                caseId: { $in: caseIds },
                captured: 'Success',
                sendViaPaynote: 'Pending',
                isDeleted: false,
            }, undefined, undefined, undefined, {
                path: 'caseId',
                select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
                populate: [
                    {
                        path: 'creditor',
                        select: [
                            'paynoteSourceId',
                            'paynoteUserId',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                    {
                        path: 'debtor',
                        select: [
                            '_id',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                ],
            });
            await this.paynotePending(pendingPayments);
            const failedPayments = await this.paymentRepository.getAllWithoutPagination({
                captured: 'Success',
                sendViaPaynote: 'Failed',
                caseId: { $ne: null },
                isDeleted: false,
            }, undefined, undefined, undefined, {
                path: 'caseId',
                select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
                populate: [
                    {
                        path: 'creditor',
                        select: [
                            'paynoteSourceId',
                            'paynoteUserId',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                    {
                        path: 'debtor',
                        select: [
                            '_id',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                ],
            });
            await this.paynoteFailed(failedPayments);
        });
        // cron.schedule('0 21 * * *', async () => {
        //   const today = new Date(commonUtil.getCurrentDate());
        //   const targetDate = new Date(commonUtil.getCurrentDate());
        //   targetDate.setDate(today.getDate() + 2); // Add 2 days to the current date
        //   // Set the targetDate to the start of the day (00:00:00) for comparison
        //   const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        //   const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        //   const payments: IPayment[] =
        //     await this.paymentRepository.getAllWithoutPagination<IPayment>({
        //       status: 'Upcoming',
        //       caseId: {$ne: null},
        //       dueDate: {
        //         $gte: startOfDay,
        //         $lte: endOfDay,
        //       },
        //     });
        //   for (const payment of payments) {
        //     emailUtil.sendEmailOrSmsByEvent(
        //       'upcoming_payment',
        //       '',
        //       payment._id,
        //       ''
        //     );
        //   }
        // });
    }
    async paynotePending(payments) {
        const retryPaynoteInterval = {
            unit: 'days',
            value: 1,
            maxRetry: 2,
        };
        await this.processPaynotePayments(payments, false, retryPaynoteInterval);
    }
    async paynoteFailed(payments) {
        const retryPaynoteInterval = {
            unit: 'days',
            value: 1,
            maxRetry: 2,
        };
        const filterPaymentWithRetries = payments.filter((payment) => {
            return payment.retriesPaynote != retryPaynoteInterval.maxRetry;
        });
        const failedPaynote = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        await this.processPaynotePayments(failedPaynote, true, retryPaynoteInterval);
    }
    async processPaynotePayments(payments, retryPlus, interval) {
        for (const payment of payments) {
            if (!payment?.caseId?.creditorPaymentsProceed) {
                continue;
            }
            if (payment.caseId.creditor.paynoteUserId) {
                // const paynoteCustomer = await paynoteUtil.getCustomer(
                //   payment.caseId.creditor
                // );
                // console.log(paynoteCustomer);
                // if (paynoteCustomer.error) continue;
                // if (paynoteCustomer.user.status === 'unverified') continue;
                const paymentResult = await paynote_util_1.default.sendPayment(payment);
                if (paymentResult?.message === 'Server Error')
                    break;
                console.log(paymentResult);
                if (paymentResult.error) {
                    console.log('Send Email');
                    let message = '';
                    if (paymentResult?.messages) {
                        message = paymentResult.messages[0];
                    }
                    else {
                        message = paymentResult.message;
                    }
                    console.log(message, 'message');
                    const retry = payment.retriesAuth + 1;
                    const value = interval.value * retry;
                    const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
                    let retries = payment.retriesAuth;
                    if (retryPlus)
                        retries += 1;
                    await this.paymentRepository.updateById(payment._id, {
                        sendViaPaynote: 'Failed',
                        rescheduled: retryDate,
                        retriesPaynote: retries,
                        failedReasonPaynote: message,
                    });
                    // emailUtil.sendEmailOrSmsByEvent(
                    //   'failed_payment',
                    //   '',
                    //   payment._id,
                    //   ''
                    // );
                    continue;
                }
                // emailUtil.sendEmailOrSmsByEvent(
                //   'successful_payment',
                //   '',
                //   payment._id,
                //   ''
                // );
                await this.paymentRepository.updateById(payment._id, {
                    paynoteCheckId: paymentResult.check.check_id,
                    sendViaPaynote: 'Success',
                    status: 'Success',
                });
                const updatedCase = await this.caseRepository.updateById(payment.caseId._id, { $inc: { remainingAmountPaid: payment.amount } });
                // if (updatedCase.remaining === updatedCase.remainingAmountPaid) {
                //   const creditors = await creditorUtil.getCreditorsEmailForDebtor(
                //     String(payment.caseId.debtor._id),
                //     String(payment.caseId.creditor._id)
                //   );
                //   emailUtil.sendEmailIfDebtorPaysDebt(
                //     payment.caseId,
                //     payment.caseId.debtor,
                //     creditors
                //   );
                // }
            }
        }
    }
    async processPayments() {
        const settings = await this.settingsRepository.getAllWithoutPagination();
        const cronId = (0, uuid_1.v4)();
        const paymentsPendingAuthorized = await payment_util_1.default.getPendingAuthorized();
        const pendingAuthDocs = await this.pendingAuthorized(settings, paymentsPendingAuthorized, cronId);
        await this.processAuthorized(pendingAuthDocs, cronId, false, settings);
        const paymentsPendingCaptured = await payment_util_1.default.getPendingCaptured();
        const pendingCaptureDocs = await this.pendingCaptured(paymentsPendingCaptured, cronId, settings);
        await this.processCapture(pendingCaptureDocs, cronId, false, settings);
        const paymentsFailedAuthorized = await payment_util_1.default.getFailedAuthorized();
        const pendingFailedAuthDocs = await this.failedAuthorized(paymentsFailedAuthorized, cronId, settings);
        await this.processAuthorized(pendingFailedAuthDocs, cronId, true, settings);
        const paymentsFailedCaptured = await payment_util_1.default.getFailedCaptured();
        const paymentsFailedCaptureorized = await this.failedCaptured(paymentsFailedCaptured, cronId, settings);
        await this.processCapture(paymentsFailedCaptureorized, cronId, true, settings);
    }
    async processCommissionPayments() {
        // const payments: any = await paymentUtil.getAllCronJobPayments();
        const settings = await this.settingsRepository.getAllWithoutPagination();
        const cronId = (0, uuid_1.v4)();
        const paymentsPendingAuthorized = await payment_util_1.default.getPendingCommissionAuthorized();
        const pendingAuthDocs = await this.pendingAuthorized(settings, paymentsPendingAuthorized, cronId);
        await this.processCommissionAuthorized(pendingAuthDocs, cronId, false, settings);
        const paymentsPendingCaptured = await payment_util_1.default.getPendingCommissionCaptured();
        const pendingCaptureDocs = await this.pendingCaptured(paymentsPendingCaptured, cronId, settings);
        await this.processCommissionCapture(pendingCaptureDocs, cronId, false, settings);
        const paymentsFailedAuthorized = await payment_util_1.default.getFailedCommissionAuthorized();
        const pendingFailedAuthDocs = await this.failedAuthorized(paymentsFailedAuthorized, cronId, settings);
        await this.processCommissionAuthorized(pendingFailedAuthDocs, cronId, true, settings);
        const paymentsFailedCaptured = await payment_util_1.default.getFailedCommissionCaptured();
        const pendingFailedCaptureDocs = await this.failedCaptured(paymentsFailedCaptured, cronId, settings);
        await this.processCommissionCapture(pendingFailedCaptureDocs, cronId, true, settings);
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
                    maxRetry: 2,
                },
                failedPayment: {
                    unit: 'days',
                    value: 2,
                    maxRetry: 2,
                },
            },
        };
        return paymentsAuthorizations;
    }
    async pendingAuthorized(settings, payments, cronId) {
        const { authorizationInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultAuthInterval();
        const pendingAuthorized = payments.filter((payment) => {
            if (payment.timePeriod) {
                const interval = authorizationInterval[payment.timePeriod.toLowerCase()];
                return this.shouldAuthorize(interval.unit, interval.value, payment);
            }
            return false;
        });
        return pendingAuthorized;
    }
    async pendingCaptured(payments, cronId, settings) {
        const currentDate = new Date(common_util_1.default.getCurrentDate());
        const pendingCaptured = payments.filter((payment) => {
            return currentDate.getTime() >= new Date(payment.dueDate).getTime();
        });
        return pendingCaptured;
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
        const filterPaymentWithRetries = payments.filter((payment) => {
            return payment.retriesAuth != retryInterval.failedAuthorization.maxRetry;
        });
        const failedAuthorized = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        return failedAuthorized;
    }
    async processAuthorized(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            const accounts = payment.caseId.debtor.accounts;
            // const getCommission = await debtorUtil.getCommissionAmount(payment);
            // const sum = getCommission + payment.amount;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.authorizeCreditCard(payment.amount, account.customerVaultId, account.platform);
                    const result = await this.processAuthorizedResponse(payment, response, retryPlus, cronId, settings, 
                    // getCommission,
                    account.platform);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, account.platform);
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck', account.platform
                    // getCommission
                    );
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
            }
        }
    }
    async processCommissionAuthorized(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            const otherPayments = await payment_util_1.default.getOtherPayments(payment);
            const totalAmount = otherPayments.reduce((sum, obj) => sum + obj.amount, 0);
            const concatedPayments = otherPayments.concat(payment);
            const debtor = await this.debtorRepository.getById(payment.debtorId);
            const accounts = debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.authorizeCreditCard(payment.amount, account.customerVaultId, account.platform);
                    const result = await this.processCommissionAuthorizedResponse(payment, concatedPayments, response, retryPlus, cronId, settings);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, totalAmount, account.platform);
                    const result = await this.processCaptureCommissionResponse(payment, concatedPayments, response, retryPlus, cronId, settings, 'ck', totalAmount);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
            }
        }
    }
    async processAuthorizedResponse(payment, response, retryPlus, cronId, settings, 
    // commission: number,
    platform) {
        let result = false;
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        updateObjPayment['transactionType'] = 'CC';
        updateObjPayment['paymentGateway'] = platform;
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            // updateObjPayment['commission'] = commission;
            // updateObjPayment['status'] = 'Pending';
            result = true;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'successful_authorization',
            //   '',
            //   payment._id,
            //   ''
            // );
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // updateObjPayment['status'] = 'Pending';
            const interval = retryInterval.failedAuthorization;
            const retry = payment.retriesAuth + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'failed_authorization',
            //   '',
            //   payment._id,
            //   ''
            // );
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        if (Object.keys(updateObjPayment).length) {
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
        }
        return result;
    }
    async processCommissionAuthorizedResponse(payment, payments, response, retryPlus, cronId, settings) {
        let result = false;
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            // updateObjPayment['status'] = 'Pending';
            result = true;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'successful_authorization',
            //   '',
            //   payment._id,
            //   ''
            // );
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // updateObjPayment['status'] = 'Pending';
            const interval = retryInterval.failedAuthorization;
            const retry = payment.retriesAuth + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'failed_authorization',
            //   '',
            //   payment._id,
            //   ''
            // );
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        if (Object.keys(updateObjPayment).length) {
            if (!retryPlus) {
                updateObjPayment['paymentReference'] = (0, uuid_1.v4)();
                updateObjPayment['paymentReferenceBool'] = true;
            }
            for (const payment of payments) {
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
        return result;
    }
    async failedCaptured(payments, cronId, settings) {
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const filterPaymentWithRetries = payments.filter((payment) => {
            return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
        });
        const failedCaptured = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        return failedCaptured;
        await this.processCapture(failedCaptured, cronId, true, settings);
    }
    async processCapture(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            const accounts = payment.caseId.debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, account.platform);
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'cc', account.platform);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, account.platform);
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck', account.platform);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
            }
        }
    }
    async processCommissionCapture(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            const otherPayments = await payment_util_1.default.getPaymentReferenceDocuments(payment.paymentReference);
            const totalAmount = otherPayments.reduce((sum, obj) => sum + obj.amount, 0);
            const concatedPayments = otherPayments.concat(payment);
            const debtor = await this.debtorRepository.getById(payment.debtorId);
            console.log(concatedPayments, 'concatedPayments');
            const accounts = debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, account.platform);
                    const result = await this.processCaptureCommissionResponse(payment, concatedPayments, response, retryPlus, cronId, settings, 'cc', totalAmount);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, account.platform);
                    const result = await this.processCaptureCommissionResponse(payment, concatedPayments, response, retryPlus, cronId, settings, 'ck', totalAmount);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
            }
        }
    }
    async processCaptureResponse(payment, response, retryPlus, cronId, settings, type, platform
    // commision?: number
    ) {
        let result = false;
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        updateObjPayment['paymentGateway'] = platform;
        updateObjPayment['transactionType'] = type === 'cc' ? 'CC' : 'ACH';
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['captured'] = 'Success';
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['debtorTransId'] = transactionId;
                // updateObjPayment['commission'] = commision;
                updateObjPayment['status'] = 'Pending';
            }
            result = true;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'successful_payment',
            //   '',
            //   payment._id,
            //   ''
            // );
        }
        else {
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                // updateObjPayment['status'] = 'Pending';
            }
            updateObjPayment['captured'] = 'Failed';
            updateObjPayment['failedReasonCaptured'] = responseText;
            const interval = retryInterval.failedPayment;
            const retry = payment.retriesCapture + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            // emailUtil.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        if (Object.keys(updateObjPayment).length) {
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
        }
        return result;
    }
    async processCaptureCommissionResponse(payment, payments, response, retryPlus, cronId, settings, type, amount) {
        let result = false;
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['captured'] = 'Success';
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['debtorTransId'] = transactionId;
                updateObjPayment['status'] = 'Pending';
            }
            result = true;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'successful_payment',
            //   '',
            //   payment._id,
            //   ''
            // );
            if (amount) {
                const commissionAmount = payment.amount - amount;
                await this.paymentRepository.updateById(payment._id, {
                    amount: commissionAmount,
                });
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: commissionAmount },
                });
            }
            if (!amount) {
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: payment.amount },
                });
            }
        }
        else {
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                // updateObjPayment['status'] = 'Pending';
            }
            updateObjPayment['captured'] = 'Failed';
            updateObjPayment['failedReasonCaptured'] = responseText;
            const interval = retryInterval.failedPayment;
            const retry = payment.retriesCapture + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            // emailUtil.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        if (Object.keys(updateObjPayment).length) {
            for (const payment of payments) {
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
        return result;
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map