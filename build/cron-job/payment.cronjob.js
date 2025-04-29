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
const email_util_1 = __importDefault(require("../utils/email.util"));
const payment_service_1 = __importDefault(require("../api/services/payment.service"));
const case_repository_1 = require("../api/repository/case/case.repository");
const creditor_util_1 = __importDefault(require("../utils/creditor.util"));
const serviceFee_repository_1 = require("../api/repository/serviceFee/serviceFee.repository");
const lawsuit_util_1 = __importDefault(require("../utils/lawsuit.util"));
const lawsuit_repository_1 = require("../api/repository/lawsuit/lawsuit.repository");
class CronJob {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.paymentService = new payment_service_1.default();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.serviceFeeRepository = new serviceFee_repository_1.ServiceFeeRepository();
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
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
        // const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
        //   {creditorPaymentsProceed: true},
        //   '_id'
        // );
        // const caseIds = cases.map(caseTemp => {
        //   return String(caseTemp._id);
        // });
        // const pendingPayments =
        //   await this.paymentRepository.getAllWithoutPagination<IPayment>(
        //     {
        //       caseId: {$in: caseIds},
        //       captured: 'Success',
        //       sendViaPaynote: 'Pending',
        //       isDeleted: false,
        //       attorneyId: null,
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     {
        //       path: 'caseId',
        //       select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
        //       populate: [
        //         {
        //           path: 'creditor',
        //           select: [
        //             'paynoteSourceId',
        //             'paynoteUserId',
        //             'basicInformation.fullName',
        //             'businessInformation.companyName',
        //           ],
        //         },
        //         {
        //           path: 'debtor',
        //           select: [
        //             '_id',
        //             'basicInformation.fullName',
        //             'businessInformation.companyName',
        //           ],
        //         },
        //       ],
        //     }
        //   );
        // await this.paynotePending(pendingPayments, true);
        // const failedPayments =
        //   await this.paymentRepository.getAllWithoutPagination<IPayment>(
        //     {
        //       captured: 'Success',
        //       sendViaPaynote: 'Failed',
        //       caseId: {$ne: null},
        //       isDeleted: false,
        //     },
        //     undefined,
        //     undefined,
        //     undefined,
        //     {
        //       path: 'caseId',
        //       select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
        //       populate: [
        //         {
        //           path: 'creditor',
        //           select: [
        //             'paynoteSourceId',
        //             'paynoteUserId',
        //             'basicInformation.fullName',
        //             'businessInformation.companyName',
        //           ],
        //         },
        //         {
        //           path: 'debtor',
        //           select: [
        //             '_id',
        //             'basicInformation.fullName',
        //             'businessInformation.companyName',
        //           ],
        //         },
        //       ],
        //     }
        //   );
        // await this.paynoteFailed(failedPayments, true);
        const lawsuits = await this.lawsuitRepository.getAllWithoutPagination({
            paymentsProceed: true,
        });
        const debtorIds = lawsuits.map(lawsuit => {
            return String(lawsuit.debtorId);
        });
        const pendingAttorneyPayments = await this.paymentRepository.getAllWithoutPagination({
            debtorId: { $in: debtorIds },
            captured: 'Success',
            sendViaPaynote: 'Pending',
            isDeleted: false,
        }, undefined, undefined, undefined, [
            {
                path: 'caseId',
                select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
                populate: [
                    {
                        path: 'debtor',
                        select: [
                            '_id',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                ],
            },
            {
                path: 'lawsuitId',
                populate: 'lawfirmId',
            },
        ]);
        await this.paynotePending(pendingAttorneyPayments, false);
        const failedAttorneyPayments = await this.paymentRepository.getAllWithoutPagination({
            captured: 'Success',
            sendViaPaynote: 'Failed',
            caseId: { $ne: null },
            isDeleted: false,
            lawsuitId: { $ne: null },
        }, undefined, undefined, undefined, [
            {
                path: 'caseId',
                select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
                populate: [
                    {
                        path: 'debtor',
                        select: [
                            '_id',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                ],
            },
            {
                path: 'lawsuitId',
                populate: 'lawfirmId',
            },
        ]);
        await this.paynoteFailed(failedAttorneyPayments, false);
    }
    startCronJob() {
        node_cron_1.default.schedule('0 4 * * *', async () => {
            console.log('Running a task in a day for 4am');
            this.processCommissionPayments();
        }, {
            timezone: 'America/New_York',
        });
        node_cron_1.default.schedule('15 4 * * *', async () => {
            console.log('Running a task in a day for 4:15am');
            this.processPayments();
        }, {
            timezone: 'America/New_York',
        });
        node_cron_1.default.schedule('30 * * * *', async () => {
            console.log('Running a task every zero of an hour');
            this.processCommissionRetryPayments();
            this.processRetryPayments();
        }, {
            timezone: 'America/New_York',
        });
        node_cron_1.default.schedule('0 15 * * *', async () => {
            const cases = await this.caseRepository.getAllWithoutPagination({ creditorPaymentsProceed: true }, '_id');
            const caseIds = cases.map(caseTemp => {
                return String(caseTemp._id);
            });
            const pendingPayments = await this.paymentRepository.getAllWithoutPagination({
                caseId: { $in: caseIds },
                captured: 'Success',
                sendViaPaynote: 'Pending',
                isDeleted: false,
                attorneyId: null,
            }, undefined, undefined, undefined, {
                path: 'caseId',
                select: [
                    '_id',
                    'caseCode',
                    'remaining',
                    'creditorPaymentsProceed',
                ],
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
            await this.paynotePending(pendingPayments, true);
            const failedPayments = await this.paymentRepository.getAllWithoutPagination({
                captured: 'Success',
                sendViaPaynote: 'Failed',
                caseId: { $ne: null },
                isDeleted: false,
            }, undefined, undefined, undefined, {
                path: 'caseId',
                select: [
                    '_id',
                    'caseCode',
                    'remaining',
                    'creditorPaymentsProceed',
                ],
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
            await this.paynoteFailed(failedPayments, true);
            const lawsuits = await this.lawsuitRepository.getAllWithoutPagination({
                paymentsProceed: true,
            });
            const debtorIds = lawsuits.map(lawsuit => {
                return String(lawsuit.debtorId);
            });
            const pendingAttorneyPayments = await this.paymentRepository.getAllWithoutPagination({
                lawsuitId: { $ne: null },
                debtorId: { $in: debtorIds },
                sendViaPaynote: 'Pending',
                isDeleted: false,
                dueDate: {
                    $gte: new Date(new Date(common_util_1.default.getCurrentDate()).setUTCHours(0, 0, 0, 0)),
                    $lte: new Date(new Date(common_util_1.default.getCurrentDate()).setUTCHours(0, 0, 0, 0)),
                },
            }, undefined, undefined, undefined, [
                {
                    path: 'caseId',
                    select: [
                        '_id',
                        'caseCode',
                        'remaining',
                        'creditorPaymentsProceed',
                    ],
                    populate: [
                        {
                            path: 'debtor',
                            select: [
                                '_id',
                                'basicInformation.fullName',
                                'businessInformation.companyName',
                            ],
                        },
                    ],
                },
                {
                    path: 'lawsuitId',
                    populate: 'lawfirmId',
                },
            ]);
            await this.paynotePending(pendingAttorneyPayments, false);
            const failedAttorneyPayments = await this.paymentRepository.getAllWithoutPagination({
                sendViaPaynote: 'Failed',
                caseId: { $ne: null },
                isDeleted: false,
                lawsuitId: { $ne: null },
            }, undefined, undefined, undefined, [
                {
                    path: 'caseId',
                    select: [
                        '_id',
                        'caseCode',
                        'remaining',
                        'creditorPaymentsProceed',
                    ],
                    populate: [
                        {
                            path: 'debtor',
                            select: [
                                '_id',
                                'basicInformation.fullName',
                                'businessInformation.companyName',
                            ],
                        },
                    ],
                },
                {
                    path: 'lawsuitId',
                    populate: 'lawfirmId',
                },
            ]);
            await this.paynoteFailed(failedAttorneyPayments, false);
        }, {
            timezone: 'America/New_York',
        });
        node_cron_1.default.schedule('0 21 * * *', async () => {
            const today = new Date(common_util_1.default.getCurrentDate());
            const targetDate = new Date(common_util_1.default.getCurrentDate());
            targetDate.setDate(today.getDate() + 2); // Add 2 days to the current date
            // Set the targetDate to the start of the day (00:00:00) for comparison
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            const payments = await this.paymentRepository.getAllWithoutPagination({
                status: 'Upcoming',
                caseId: { $ne: null },
                dueDate: {
                    $gte: startOfDay,
                    $lte: endOfDay,
                },
                paymentMode: { $nin: ['Wire', 'Check', 'Invoice', 'Cash'] },
            });
            for (const payment of payments) {
                email_util_1.default.sendEmailOrSmsByEvent('upcoming_payment', '', payment._id, '');
            }
        }, {
            timezone: 'America/New_York',
        });
    }
    async paynotePending(payments, creditor) {
        const retryPaynoteInterval = {
            unit: 'days',
            value: 1,
            maxRetry: 2,
        };
        creditor
            ? await this.processPaynotePayments(payments, false, retryPaynoteInterval)
            : await this.processPaynoteAttorneyPayments(payments, false, retryPaynoteInterval);
    }
    async paynoteFailed(payments, creditor) {
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
        creditor
            ? await this.processPaynotePayments(failedPaynote, true, retryPaynoteInterval)
            : await this.processPaynoteAttorneyPayments(failedPaynote, true, retryPaynoteInterval);
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
                    const retryDate = this.getRetryDate(interval.unit, value, common_util_1.default.getCurrentDate());
                    let retries = payment.retriesAuth;
                    if (retryPlus)
                        retries += 1;
                    await this.paymentRepository.updateById(payment._id, {
                        sendViaPaynote: 'Failed',
                        rescheduled: retryDate,
                        retriesPaynote: retries,
                        failedReasonPaynote: message,
                    });
                    email_util_1.default.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
                    continue;
                }
                email_util_1.default.sendEmailOrSmsByEvent('successful_payment', '', payment._id, '');
                await this.paymentRepository.updateById(payment._id, {
                    paynoteCheckId: paymentResult.check.check_id,
                    sendViaPaynote: 'Success',
                    status: 'Success',
                });
                const updatedCase = await this.caseRepository.updateById(payment.caseId._id, { $inc: { remainingAmountPaid: payment.amount } });
                if (updatedCase.remaining === updatedCase.remainingAmountPaid) {
                    const creditors = await creditor_util_1.default.getCreditorsEmailForDebtor(String(payment.caseId.debtor._id), String(payment.caseId.creditor._id));
                    email_util_1.default.sendEmailIfDebtorPaysDebt(payment.caseId, payment.caseId.debtor, creditors);
                }
            }
        }
    }
    async processPaynoteAttorneyPayments(payments, retryPlus, interval) {
        for (const payment of payments) {
            if (payment.lawsuitId?.lawfirmId?.paynoteUserId) {
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
                    const retryDate = this.getRetryDate(interval.unit, value, common_util_1.default.getCurrentDate());
                    let retries = payment.retriesAuth;
                    if (retryPlus)
                        retries += 1;
                    await this.paymentRepository.updateById(payment._id, {
                        sendViaPaynote: 'Failed',
                        rescheduled: retryDate,
                        retriesPaynote: retries,
                        failedReasonPaynote: message,
                    });
                    email_util_1.default.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
                    continue;
                }
                email_util_1.default.sendEmailOrSmsByEvent('successful_payment', '', payment._id, '');
                await this.paymentRepository.updateById(payment._id, {
                    paynoteCheckId: paymentResult.check.check_id,
                    sendViaPaynote: 'Success',
                    status: 'Success',
                });
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
    }
    async processRetryPayments() {
        const settings = await this.settingsRepository.getAllWithoutPagination();
        const cronId = (0, uuid_1.v4)();
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
    }
    async processCommissionRetryPayments() {
        // const payments: any = await paymentUtil.getAllCronJobPayments();
        const settings = await this.settingsRepository.getAllWithoutPagination();
        const cronId = (0, uuid_1.v4)();
        const paymentsFailedAuthorized = await payment_util_1.default.getFailedCommissionAuthorized();
        console.log(paymentsFailedAuthorized, 'paymentsFailedAuthorized');
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
        let retryOriginalValue = retryPlus;
        for (const payment of payments) {
            const accounts = payment.caseId.debtor.accounts;
            // const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
            // const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
            // const getCommission = await debtorUtil.getCommissionAmount(payment);
            // const sum = getCommission + payment.amount;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.authorizeCreditCard(payment.amount, 
                    // payment.amount + serviceFeeAmount + legalFeeAmount,
                    account.customerVaultId, account.platform);
                    const result = await this.processAuthorizedResponse(payment, response, retryPlus, cronId, settings, 
                    // getCommission,
                    account.platform
                    // serviceFeeAmount,
                    // legalFeeAmount
                    );
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    await this.paymentRepository.updateById(payment._id, {
                        authorized: 'Success',
                    });
                    // const response = await this.paymentService.achCredit(
                    //   account.customerVaultId,
                    //   payment.amount,
                    //   account.platform
                    // );
                    // const result = await this.processCaptureResponse(
                    //   payment,
                    //   response,
                    //   retryPlus,
                    //   cronId,
                    //   settings,
                    //   'ck',
                    //   account.platform
                    //   // getCommission
                    // );
                    // if (retryPlus) retryPlus = false;
                    // if (result) break;
                    break;
                }
            }
            retryPlus = retryOriginalValue;
            await common_util_1.default.sleep(5000);
        }
    }
    async processCommissionAuthorized(payments, cronId, retryPlus, settings) {
        let retryOriginalValue = retryPlus;
        for (const payment of payments) {
            const otherPayments = retryPlus
                ? await payment_util_1.default.getPaymentReferenceDocuments(payment.paymentReference)
                : await payment_util_1.default.getOtherPayments(payment);
            const totalLegalFeeAmount = await lawsuit_util_1.default.getTotalLegalFee(otherPayments);
            const totalServiceFeeAmount = await lawsuit_util_1.default.getTotalServiceFee(otherPayments);
            const totalAmount = otherPayments.reduce((sum, obj) => sum + obj.amount, 0);
            const remainingAmount = payment.amount -
                totalAmount +
                totalServiceFeeAmount +
                totalLegalFeeAmount;
            if (remainingAmount <= 0) {
                email_util_1.default.sendEmailOrSmsByEvent('failed_authorization', '', payment._id, '');
                return;
            }
            const concatedPayments = otherPayments.concat(payment);
            const debtor = await this.debtorRepository.getById(payment.debtorId);
            const accounts = debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.authorizeCreditCard(payment.amount, account.customerVaultId, account.platform);
                    const result = await this.processCommissionAuthorizedResponse(payment, concatedPayments, response, retryPlus, cronId, settings, account.platform);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    for (const payment of concatedPayments) {
                        await this.paymentRepository.updateById(payment._id, {
                            authorized: 'Success',
                            paymentReference: (0, uuid_1.v4)(),
                            paymentReferenceBool: true,
                        });
                    }
                    // const response = await this.paymentService.achCredit(
                    //   account.customerVaultId,
                    //   totalAmount,
                    //   account.platform
                    // );
                    // const result = await this.processCaptureCommissionResponse(
                    //   payment,
                    //   concatedPayments,
                    //   response,
                    //   retryPlus,
                    //   cronId,
                    //   settings,
                    //   'ck',
                    //   totalAmount
                    // );
                    // if (retryPlus) retryPlus = false;
                    // if (result) break;
                }
            }
            retryPlus = retryOriginalValue;
            await common_util_1.default.sleep(5000);
        }
    }
    async processAuthorizedResponse(payment, response, retryPlus, cronId, settings, 
    // commission: number,
    platform
    // serviceFee: number,
    // legalFee: number
    ) {
        let result = false;
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        updateObjPayment['transactionType'] = 'CC';
        updateObjPayment['paymentGateway'] = platform;
        let authorizedDate = new Date(common_util_1.default.getCurrentDate()).setUTCHours(0, 0, 0, 0);
        updateObjPayment['authorizedDate'] = authorizedDate;
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            // updateObjPayment['serviceFee'] = serviceFee;
            // updateObjPayment['legalFee'] = legalFee;
            // updateObjPayment['commission'] = commission;
            // updateObjPayment['status'] = 'Pending';
            result = true;
            email_util_1.default.sendEmailOrSmsByEvent('successful_authorization', '', payment._id, '');
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // updateObjPayment['status'] = 'Pending';
            const interval = retryInterval.failedAuthorization;
            const retry = payment.retriesAuth + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, common_util_1.default.getCurrentDate());
            updateObjPayment['rescheduled'] = retryDate;
            email_util_1.default.sendEmailOrSmsByEvent('failed_authorization', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        const paymentLatest = await this.paymentRepository.getById(payment._id);
        if (paymentLatest.authorized === 'Success') {
            result = true;
        }
        else {
            if (Object.keys(updateObjPayment).length) {
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
        return result;
    }
    async processCommissionAuthorizedResponse(payment, payments, response, retryPlus, cronId, settings, platform) {
        let result = false;
        const { retryInterval } = settings.length
            ? settings[0].paymentsAuthorizations
            : this.defaultRetryInterval();
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        updateObjPayment['transactionType'] = 'CC';
        updateObjPayment['paymentGateway'] = platform;
        let authorizedDate = new Date(common_util_1.default.getCurrentDate()).setUTCHours(0, 0, 0, 0);
        updateObjPayment['authorizedDate'] = authorizedDate;
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            lawsuit_util_1.default.updateFee(payments);
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            // updateObjPayment['serviceFee'] = serviceFee;
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
            const retryDate = this.getRetryDate(interval.unit, value, common_util_1.default.getCurrentDate());
            updateObjPayment['rescheduled'] = retryDate;
            // emailUtil.sendEmailOrSmsByEvent(
            //   'failed_authorization',
            //   '',
            //   payment._id,
            //   ''
            // );
        }
        updateObjPayment['dueDate'] = payment.dueDate;
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        const paymentLatest = await this.paymentRepository.getById(payment._id);
        if (paymentLatest.authorized === 'Success') {
            result = true;
        }
        else {
            if (Object.keys(updateObjPayment).length) {
                if (!retryPlus) {
                    updateObjPayment['paymentReference'] = (0, uuid_1.v4)();
                    updateObjPayment['paymentReferenceBool'] = true;
                }
                for (const payment of payments) {
                    await this.paymentRepository.updateById(payment._id, updateObjPayment);
                }
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
        let retryOriginalValue = retryPlus;
        for (const payment of payments) {
            const accounts = payment.caseId.debtor.accounts;
            // const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
            // const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
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
                    const response = await this.paymentService.achCredit(account.customerVaultId, 
                    // payment.amount + serviceFeeAmount + legalFeeAmount,
                    payment.amount, account.platform);
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck', account.platform
                    // serviceFeeAmount,
                    // legalFeeAmount
                    );
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
            }
            retryPlus = retryOriginalValue;
            await common_util_1.default.sleep(5000);
        }
    }
    async processCommissionCapture(payments, cronId, retryPlus, settings) {
        let retryOriginalValue = retryPlus;
        for (const payment of payments) {
            const otherPayments = await payment_util_1.default.getPaymentReferenceDocuments(payment.paymentReference);
            const totalAmount = otherPayments.reduce((sum, obj) => sum + obj.amount, 0);
            const concatedPayments = otherPayments.concat(payment);
            const debtor = await this.debtorRepository.getById(payment.debtorId);
            const accounts = debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, account.platform);
                    const result = await this.processCaptureCommissionResponse(payment, concatedPayments, response, retryPlus, cronId, settings, 'cc', totalAmount, account.platform);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, account.platform);
                    const result = await this.processCaptureCommissionResponse(payment, concatedPayments, response, retryPlus, cronId, settings, 'ck', totalAmount, account.platform);
                    if (retryPlus)
                        retryPlus = false;
                    if (result)
                        break;
                }
            }
            retryPlus = retryOriginalValue;
            await common_util_1.default.sleep(5000);
        }
    }
    async processCaptureResponse(payment, response, retryPlus, cronId, settings, type, platform
    // serviceFee?: number,
    // legalFee?: number
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
            updateObjPayment['status'] = 'Pending';
            lawsuit_util_1.default.updatePaymentLawsuit([payment]);
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['debtorTransId'] = transactionId;
                // updateObjPayment['serviceFee'] = serviceFee;
                // updateObjPayment['legalFee'] = legalFee;
                // updateObjPayment['commission'] = commision;
            }
            result = true;
            email_util_1.default.sendEmailOrSmsByEvent('successful_capture', '', payment._id, '');
        }
        else {
            if (type === 'ck') {
                updateObjPayment['authorized'] = 'Success';
                // updateObjPayment['status'] = 'Pending';
            }
            updateObjPayment['status'] = 'Pending';
            updateObjPayment['captured'] = 'Failed';
            updateObjPayment['failedReasonCaptured'] = responseText;
            const interval = retryInterval.failedPayment;
            const retry = payment.retriesCapture + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, common_util_1.default.getCurrentDate());
            updateObjPayment['rescheduled'] = retryDate;
            email_util_1.default.sendEmailOrSmsByEvent('failed_capture', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        const paymentLatest = await this.paymentRepository.getById(payment._id);
        if (paymentLatest.captured === 'Success') {
            result = true;
        }
        else {
            if (Object.keys(updateObjPayment).length) {
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
        return result;
    }
    async processCaptureCommissionResponse(payment, payments, response, retryPlus, cronId, settings, type, amount, platform) {
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
            updateObjPayment['status'] = 'Pending';
            lawsuit_util_1.default.updatePaymentLawsuit(payments);
            if (type === 'ck') {
                lawsuit_util_1.default.updateFee(payments);
                updateObjPayment['authorized'] = 'Success';
                updateObjPayment['debtorTransId'] = transactionId;
            }
            result = true;
            email_util_1.default.sendEmailOrSmsByEvent('successful_capture', '', payment._id, '');
            if (amount) {
                const commissionAmount = payment.amount - amount;
                // await this.paymentRepository.updateById<IPayment>(payment._id, {
                //   amount: commissionAmount,
                // });
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
            updateObjPayment['status'] = 'Pending';
            updateObjPayment['captured'] = 'Failed';
            updateObjPayment['failedReasonCaptured'] = responseText;
            const interval = retryInterval.failedPayment;
            const retry = payment.retriesCapture + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, common_util_1.default.getCurrentDate());
            updateObjPayment['rescheduled'] = retryDate;
            email_util_1.default.sendEmailOrSmsByEvent('failed_capture', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        const paymentLatest = await this.paymentRepository.getById(payment._id);
        if (paymentLatest.captured === 'Success') {
            result = true;
        }
        else {
            if (Object.keys(updateObjPayment).length) {
                for (const payment of payments) {
                    await this.paymentRepository.updateById(payment._id, updateObjPayment);
                }
            }
        }
        return result;
    }
    async sendLawfirmPayments() {
        const lawsuits = await this.lawsuitRepository.getAllWithoutPagination({
            paymentsProceed: true,
        });
        console.log(lawsuits, 'lawsuits');
        const debtorIds = lawsuits.map(lawsuit => {
            return String(lawsuit.debtorId);
        });
        console.log(debtorIds, 'debtorIds');
        const pendingAttorneyPayments = await this.paymentRepository.getAllWithoutPagination({
            debtorId: { $in: debtorIds },
            sendViaPaynote: 'Pending',
            isDeleted: false,
            dueDate: {
                $gte: new Date(new Date(common_util_1.default.getCurrentDate()).setUTCHours(0, 0, 0, 0)),
                $lte: new Date(new Date(common_util_1.default.getCurrentDate()).setUTCHours(0, 0, 0, 0)),
            },
        }, undefined, undefined, undefined, [
            {
                path: 'caseId',
                select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
                populate: [
                    {
                        path: 'debtor',
                        select: [
                            '_id',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                ],
            },
            {
                path: 'lawsuitId',
                populate: 'lawfirmId',
            },
        ]);
        console.log(pendingAttorneyPayments, 'pendingAttorneyPayments');
        await this.paynotePending(pendingAttorneyPayments, false);
        const failedAttorneyPayments = await this.paymentRepository.getAllWithoutPagination({
            sendViaPaynote: 'Failed',
            caseId: { $ne: null },
            isDeleted: false,
            lawsuitId: { $ne: null },
        }, undefined, undefined, undefined, [
            {
                path: 'caseId',
                select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
                populate: [
                    {
                        path: 'debtor',
                        select: [
                            '_id',
                            'basicInformation.fullName',
                            'businessInformation.companyName',
                        ],
                    },
                ],
            },
            {
                path: 'lawsuitId',
                populate: 'lawfirmId',
            },
        ]);
        await this.paynoteFailed(failedAttorneyPayments, false);
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map