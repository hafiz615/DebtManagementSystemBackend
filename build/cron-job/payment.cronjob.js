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
const mongoose_1 = __importDefault(require("mongoose"));
const dataCopier_util_1 = require("../utils/dataCopier.util");
const paynote_util_1 = __importDefault(require("../utils/paynote.util"));
const email_util_1 = __importDefault(require("../utils/email.util"));
class CronJob {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.paymentService = new payment_service_1.default();
        this.paymentLoggingRepository = new paymentLogging_repository_1.PaymentLoggingRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
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
    async testDebtor() {
        const cronId = (0, uuid_1.v4)();
        const debtors = await this.debtorRepository.getAllWithoutPagination({ _id: '66b0f13b9fa41fccbbb4080a' }, undefined, '+totalCommission +commissionPaid +weeklyCommission +weeklyCommissionPaid +weeklyCommissionDate +commissionPaymentId', { createdAt: 1 });
        for (const debtor of debtors) {
            if (debtor.totalCommission === debtor.commissionPaid) {
                continue;
            }
            let payment;
            if (debtor.commissionPaymentId) {
                payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
            }
            else {
                payment = await this.getCommissionDocument(debtor._id, debtor.weeklyCommission);
            }
            if (debtor.weeklyCommissionPaid &&
                this.checkCommissionTimePeriod(payment.dueDate, 'weekly')) {
                const paymentDoc = await this.getCommissionDocument(debtor._id, debtor.weeklyCommission);
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
                for (const account of debtor.accounts) {
                    if (payment.authorized === 'Pending') {
                        if (account.paymentType === 'cc') {
                            const response = await this.paymentService.authorizeCreditCard(commisionToPay, account.customerVaultId);
                            const result = await this.processCommissionAuthResponse(payment, response, false, cronId);
                            if (result) {
                                payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                                break;
                            }
                        }
                        if (account.paymentType === 'ck') {
                            const response = await this.paymentService.achCredit(account.customerVaultId, commisionToPay, '');
                            const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'ck');
                            if (result) {
                                await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                break;
                            }
                        }
                    }
                    if (payment.authorized === 'Failed') {
                        if (payment.retriesAuth === retryCommissionInterval.maxRetry)
                            continue;
                        if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
                            if (account.paymentType === 'cc') {
                                const response = await this.paymentService.authorizeCreditCard(commisionToPay, account.customerVaultId);
                                const result = await this.processCommissionAuthResponse(payment, response, true, cronId);
                                if (result) {
                                    payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                                    break;
                                }
                            }
                        }
                    }
                    if (payment.authorized === 'Success') {
                        if (payment.captured === 'Pending') {
                            if (account.paymentType === 'cc') {
                                const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, '');
                                const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'cc');
                                if (result) {
                                    await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                    break;
                                }
                            }
                            if (account.paymentType === 'ck') {
                                const response = await this.paymentService.achCredit(account.customerVaultId, commisionToPay, '');
                                const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'ck');
                                if (result) {
                                    await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                    break;
                                }
                            }
                        }
                        if (payment.captured === 'Failed') {
                            if (payment.retriesCapture === retryCommissionInterval.maxRetry) {
                                continue;
                            }
                            if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
                                if (account.paymentType === 'cc') {
                                    const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, '');
                                    const result = await this.processCommissionCaptureResponse(payment, response, true, cronId, 'cc');
                                    if (result) {
                                        await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                        break;
                                    }
                                }
                                if (account.paymentType === 'ck') {
                                    const response = await this.paymentService.achCredit(account.customerVaultId, commisionToPay, '');
                                    const result = await this.processCommissionCaptureResponse(payment, response, true, cronId, 'ck');
                                    if (result) {
                                        await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    async testPaynote() {
        const pendingPayments = await this.paymentRepository.getAllWithoutPagination({ status: 'Success', sendViaPaynote: 'Pending', caseId: { $ne: null } }, undefined, undefined, undefined, {
            path: 'caseId',
            select: ['_id'],
            populate: ['creditor'],
        });
        await this.paynotePending(pendingPayments);
        const failedPayments = await this.paymentRepository.getAllWithoutPagination({ status: 'Success', sendViaPaynote: 'Failed', caseId: { $ne: null } }, undefined, undefined, undefined, {
            path: 'caseId',
            select: ['_id'],
            populate: ['creditor'],
        });
        await this.paynoteFailed(failedPayments);
        // for (const payment of payments) {
        //   if (payment.caseId.creditor.paynoteUserId) {
        //     const paynoteCustomer = await paynoteUtil.getCustomer(
        //       payment.caseId.creditor
        //     );
        //     if (paynoteCustomer.error) continue;
        //     // if (paynoteCustomer.user.status === 'unverified') continue;
        //     console.log(paynoteCustomer);
        //     const paymentResult = await paynoteUtil.sendPayment(payment);
        //     console.log(paymentResult);
        //     if (paymentResult.error) {
        //       console.log('Send Email');
        //       let message = '';
        //       if (paymentResult?.messages) {
        //         message = paymentResult.messages[0];
        //       } else {
        //         message = paymentResult.message;
        //       }
        //       console.log(message, 'message');
        //       await this.paymentRepository.updateById<IPayment>(payment._id, {
        //         sendViaPaynote: 'Failed',
        //       });
        //       // emailUtil.sendEmailOrSmsByEvent(
        //       //   'failed_payment',
        //       //   '',
        //       //   payment._id,
        //       //   ''
        //       // );
        //       continue;
        //     }
        //     // emailUtil.sendEmailOrSmsByEvent(
        //     //   'successful_payment',
        //     //   '',
        //     //   payment._id,
        //     //   ''
        //     // );
        //     await this.paymentRepository.updateById<IPayment>(payment._id, {
        //       paynoteCheckId: paymentResult.check.check_id,
        //       sendViaPaynote: 'Success',
        //     });
        //   }
        // }
    }
    startCronJob() {
        node_cron_1.default.schedule('0 * * * *', async () => {
            console.log('Running a task every zero of an hour');
            // const payments: any = await paymentUtil.getAllCronJobPayments();
            await this.processPayments();
        });
        node_cron_1.default.schedule('30 * * * *', async () => {
            console.log('Running a task every 30 min of an hour');
            const cronId = (0, uuid_1.v4)();
            const debtors = await this.debtorRepository.getAllWithoutPagination(undefined, undefined, '+totalCommission +commissionPaid +weeklyCommission +weeklyCommissionPaid +weeklyCommissionDate +commissionPaymentId', { createdAt: 1 });
            for (const debtor of debtors) {
                if (debtor.totalCommission === debtor.commissionPaid) {
                    continue;
                }
                let payment;
                if (debtor.commissionPaymentId) {
                    payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                }
                else {
                    payment = await this.getCommissionDocument(debtor._id, debtor.weeklyCommission);
                }
                if (debtor.weeklyCommissionPaid &&
                    this.checkCommissionTimePeriod(payment.dueDate, 'weekly')) {
                    const paymentDoc = await this.getCommissionDocument(debtor._id, debtor.weeklyCommission);
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
                    for (const account of debtor.accounts) {
                        if (payment.authorized === 'Pending') {
                            if (account.paymentType === 'cc') {
                                const response = await this.paymentService.authorizeCreditCard(commisionToPay, account.customerVaultId);
                                const result = await this.processCommissionAuthResponse(payment, response, false, cronId);
                                if (result) {
                                    payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                                    break;
                                }
                            }
                            if (account.paymentType === 'ck') {
                                const response = await this.paymentService.achCredit(account.customerVaultId, commisionToPay, '');
                                const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'ck');
                                if (result) {
                                    await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                    break;
                                }
                            }
                        }
                        if (payment.authorized === 'Failed') {
                            if (payment.retriesAuth === retryCommissionInterval.maxRetry)
                                continue;
                            if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
                                if (account.paymentType === 'cc') {
                                    const response = await this.paymentService.authorizeCreditCard(commisionToPay, account.customerVaultId);
                                    const result = await this.processCommissionAuthResponse(payment, response, true, cronId);
                                    if (result) {
                                        payment = await this.paymentRepository.getById(debtor.commissionPaymentId);
                                        break;
                                    }
                                }
                            }
                        }
                        if (payment.authorized === 'Success') {
                            if (payment.captured === 'Pending') {
                                if (account.paymentType === 'cc') {
                                    const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, '');
                                    const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'cc');
                                    if (result) {
                                        await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                        break;
                                    }
                                }
                                if (account.paymentType === 'ck') {
                                    const response = await this.paymentService.achCredit(account.customerVaultId, commisionToPay, '');
                                    const result = await this.processCommissionCaptureResponse(payment, response, false, cronId, 'ck');
                                    if (result) {
                                        await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                        break;
                                    }
                                }
                            }
                            if (payment.captured === 'Failed') {
                                if (payment.retriesCapture === retryCommissionInterval.maxRetry) {
                                    continue;
                                }
                                if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
                                    if (account.paymentType === 'cc') {
                                        const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, '');
                                        const result = await this.processCommissionCaptureResponse(payment, response, true, cronId, 'cc');
                                        if (result) {
                                            await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                            break;
                                        }
                                    }
                                    if (account.paymentType === 'ck') {
                                        const response = await this.paymentService.achCredit(account.customerVaultId, commisionToPay, '');
                                        const result = await this.processCommissionCaptureResponse(payment, response, true, cronId, 'ck');
                                        if (result) {
                                            await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        node_cron_1.default.schedule('15 * * * *', async () => {
            const pendingPayments = await this.paymentRepository.getAllWithoutPagination({ status: 'Success', sendViaPaynote: 'Pending', caseId: { $ne: null } }, undefined, undefined, undefined, {
                path: 'caseId',
                select: ['_id'],
                populate: ['creditor'],
            });
            await this.paynotePending(pendingPayments);
            const failedPayments = await this.paymentRepository.getAllWithoutPagination({ status: 'Success', sendViaPaynote: 'Failed', caseId: { $ne: null } }, undefined, undefined, undefined, {
                path: 'caseId',
                select: ['_id'],
                populate: ['creditor'],
            });
            await this.paynoteFailed(failedPayments);
            // for (const payment of payments as any) {
            //   if (payment.caseId.creditor.paynoteUserId) {
            //     const paynoteCustomer = await paynoteUtil.getCustomer(
            //       payment.caseId.creditor
            //     );
            //     if (paynoteCustomer.error) continue;
            //     if (paynoteCustomer.user.status === 'unverified') continue;
            //     const paymentResult = await paynoteUtil.sendPayment(payment);
            //     console.log(paymentResult);
            //     if (paymentResult.error) {
            //       console.log('Send Email');
            //       let message = '';
            //       if (paymentResult?.messages) {
            //         message = paymentResult.messages[0];
            //       } else {
            //         message = paymentResult.message;
            //       }
            //       console.log(message, 'message');
            //       await this.paymentRepository.updateById<IPayment>(payment._id, {
            //         sendViaPaynote: 'Failed',
            //       });
            //       emailUtil.sendEmailOrSmsByEvent(
            //         'failed_payment',
            //         '',
            //         payment._id,
            //         ''
            //       );
            //       continue;
            //     }
            //     emailUtil.sendEmailOrSmsByEvent(
            //       'successful_payment',
            //       '',
            //       payment._id,
            //       ''
            //     );
            //     await this.paymentRepository.updateById<IPayment>(payment._id, {
            //       paynoteCheckId: paymentResult.check.check_id,
            //       sendViaPaynote: 'Success',
            //     });
            //   }
            // }
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
            });
            for (const payment of payments) {
                email_util_1.default.sendEmailOrSmsByEvent('upcoming_payment', '', payment._id, '');
            }
        });
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
            if (payment.caseId.creditor.paynoteUserId &&
                payment.caseId.creditor.paynoteSourceId) {
                const paynoteCustomer = await paynote_util_1.default.getCustomer(payment.caseId.creditor);
                if (paynoteCustomer.error)
                    continue;
                // if (paynoteCustomer.user.status === 'unverified') continue;
                const paymentResult = await paynote_util_1.default.sendPayment(payment);
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
                    email_util_1.default.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
                    continue;
                }
                email_util_1.default.sendEmailOrSmsByEvent('successful_payment', '', payment._id, '');
                await this.paymentRepository.updateById(payment._id, {
                    paynoteCheckId: paymentResult.check.check_id,
                    sendViaPaynote: 'Success',
                });
            }
        }
    }
    async processPayments() {
        // const payments: any = await paymentUtil.getAllCronJobPayments();
        const settings = await this.settingsRepository.getAllWithoutPagination();
        const cronId = (0, uuid_1.v4)();
        const paymentsPendingAuthorized = await payment_util_1.default.getPendingAuthorized();
        await this.pendingAuthorized(settings, paymentsPendingAuthorized, cronId);
        const paymentsPendingCaptured = await payment_util_1.default.getPendingCaptured();
        await this.pendingCaptured(paymentsPendingCaptured, cronId, settings);
        const paymentsFailedAuthorized = await payment_util_1.default.getFailedAuthorized();
        await this.failedAuthorized(paymentsFailedAuthorized, cronId, settings);
        const paymentsFailedCaptured = await payment_util_1.default.getFailedCaptured();
        await this.failedCaptured(paymentsFailedCaptured, cronId, settings);
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
    async getCommissionDocument(debtorId, amount) {
        const payment = new payment_repomodel_1.Payment();
        payment.timePeriod = 'hours';
        payment.dueDate = common_util_1.default.getCurrentDate();
        payment.debtorId = debtorId;
        payment.caseId = null;
        payment.amount = amount;
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
            // paymentLogging.successReason = responseText;
            successAuth = true;
            email_util_1.default.sendEmailOrSmsByEventForCommission('successful_payment', payment);
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['status'] = 'Pending';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            const retry = payment.retriesAuth + 1;
            const value = retryCommissionInterval.value * retry;
            const retryDate = this.getRetryDate(retryCommissionInterval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            // paymentLogging.failReason = responseText;
            email_util_1.default.sendEmailOrSmsByEventForCommission('failed_payment', payment);
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        if (Object.keys(updateObjPayment).length) {
            const newPayment = new paymentLogging_repomodel_1.PaymentLogging();
            const populatedPayment = dataCopier_util_1.DataCopier.copy(newPayment, payment);
            const verifiedPayment = dataCopier_util_1.DataCopier.copy(populatedPayment, updateObjPayment);
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
            await this.paymentLoggingRepository.create(verifiedPayment);
        }
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.cronId = cronId;
        // paymentLogging.paymentType = 'Credit commission auth';
        // paymentLogging.debtor = String(payment.debtorId);
        // await this.paymentLoggingRepository.create(paymentLogging as any);
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
            // paymentLogging.successReason = responseText;
            await this.debtorRepository.updateById(payment._id, {
                weeklyCommissionPaid: true,
            });
            successCapture = true;
            email_util_1.default.sendEmailOrSmsByEventForCommission('successful_payment', payment);
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
            // paymentLogging.failReason = responseText;
            email_util_1.default.sendEmailOrSmsByEventForCommission('failed_payment', payment);
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        if (Object.keys(updateObjPayment).length) {
            const newPayment = new paymentLogging_repomodel_1.PaymentLogging();
            const populatedPayment = dataCopier_util_1.DataCopier.copy(newPayment, payment);
            const verifiedPayment = dataCopier_util_1.DataCopier.copy(populatedPayment, updateObjPayment);
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
            await this.paymentLoggingRepository.create(verifiedPayment);
        }
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.cronId = cronId;
        // paymentLogging.paymentType = 'Credit commission capture';
        // paymentLogging.debtor = String(payment.debtorId);
        // await this.paymentLoggingRepository.create(paymentLogging as any);
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
        // const pendingAuthorized = payments[0].pendingAuthorized.filter(
        //   (payment: IPayment) => {
        //     if (payment.timePeriod) {
        //       const interval =
        //         authorizationInterval[payment.timePeriod.toLowerCase()];
        //       return this.shouldAuthorize(interval.unit, interval.value, payment);
        //     }
        //     return false;
        //   }
        // );
        const pendingAuthorized = payments.filter((payment) => {
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
        // const pendingCaptured = payments[0].pendingCaptured.filter(
        //   (payment: IPayment) => {
        //     return currentDate.getTime() >= new Date(payment.dueDate).getTime();
        //   }
        // );
        const pendingCaptured = payments.filter((payment) => {
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
        // const filterPaymentWithRetries = payments[0].failedAuthorized.filter(
        //   (payment: IPayment) => {
        //     return (
        //       payment.retriesAuth != retryInterval.failedAuthorization.maxRetry
        //     );
        //   }
        // );
        const filterPaymentWithRetries = payments.filter((payment) => {
            return payment.retriesAuth != retryInterval.failedAuthorization.maxRetry;
        });
        const failedAuthorized = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        await this.processAuthorized(failedAuthorized, cronId, true, settings);
    }
    async processAuthorized(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            const accounts = payment.caseId.debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.authorizeCreditCard(payment.amount, account.customerVaultId);
                    const result = await this.processAuthorizedResponse(payment, response, retryPlus, cronId, settings);
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, '');
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck');
                    if (result)
                        break;
                }
            }
        }
    }
    async processAuthorizedResponse(payment, response, retryPlus, cronId, settings) {
        let result = false;
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
            result = true;
            email_util_1.default.sendEmailOrSmsByEvent('successful_authorization', '', payment._id, '');
            // paymentLogging.successReason = responseText;
        }
        else {
            updateObjPayment['authorized'] = 'Failed';
            updateObjPayment['failedReasonAuthorization'] = responseText;
            updateObjPayment['status'] = 'Pending';
            const interval = retryInterval.failedAuthorization;
            const retry = payment.retriesAuth + 1;
            const value = interval.value * retry;
            const retryDate = this.getRetryDate(interval.unit, value, payment.dueDate);
            updateObjPayment['rescheduled'] = retryDate;
            // paymentLogging.failReason = responseText;
            email_util_1.default.sendEmailOrSmsByEvent('failed_authorization', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
        if (Object.keys(updateObjPayment).length) {
            const newPayment = new paymentLogging_repomodel_1.PaymentLogging();
            const populatedPayment = dataCopier_util_1.DataCopier.copy(newPayment, payment);
            const verifiedPayment = dataCopier_util_1.DataCopier.copy(populatedPayment, updateObjPayment);
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
            await this.paymentLoggingRepository.create(verifiedPayment);
        }
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.cronId = cronId;
        // paymentLogging.paymentType = 'Credit Auth';
        // paymentLogging.debtor = String(payment.caseDetails.debtor);
        // paymentLogging.creditor = String(payment.caseDetails.creditor);
        await this.paymentLoggingRepository.create(paymentLogging);
        return result;
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
        const filterPaymentWithRetries = payments.filter((payment) => {
            return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
        });
        const failedCaptured = filterPaymentWithRetries.filter((payment) => {
            return this.retry(payment.rescheduled);
        });
        await this.processCapture(failedCaptured, cronId, true, settings);
    }
    async processCapture(payments, cronId, retryPlus, settings) {
        for (const payment of payments) {
            const accounts = payment.caseId.debtor.accounts;
            for (const account of accounts) {
                if (account.paymentType === 'cc') {
                    const response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, '');
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'cc');
                    if (result)
                        break;
                }
                if (account.paymentType === 'ck') {
                    const response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, '');
                    const result = await this.processCaptureResponse(payment, response, retryPlus, cronId, settings, 'ck');
                    if (result)
                        break;
                }
            }
        }
    }
    async processCaptureResponse(payment, response, retryPlus, cronId, settings, type) {
        let result = false;
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
            // paymentLogging.successReason = responseText;
            result = true;
            email_util_1.default.sendEmailOrSmsByEvent('successful_payment', '', payment._id, '');
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
            // paymentLogging.failReason = responseText;
            email_util_1.default.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
        }
        if (retryPlus)
            updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        if (Object.keys(updateObjPayment).length) {
            const newPayment = new paymentLogging_repomodel_1.PaymentLogging();
            const populatedPayment = dataCopier_util_1.DataCopier.copy(newPayment, payment);
            const verifiedPayment = dataCopier_util_1.DataCopier.copy(populatedPayment, updateObjPayment);
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
            await this.paymentLoggingRepository.create(verifiedPayment);
        }
        return result;
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.cronId = cronId;
        // paymentLogging.paymentType = 'Credit Capture';
        // paymentLogging.debtor = String(payment.caseDetails.debtor);
        // paymentLogging.creditor = String(payment.caseDetails.creditor);
        // await this.paymentLoggingRepository.create(paymentLogging as any);
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map