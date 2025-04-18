"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const common_util_1 = __importDefault(require("./common.util"));
const payment_repomodel_1 = require("../database/repomodels/payment.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
class PaymentUtil {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    async getFilteredPayments(payments, arrayName) {
        const transformedArray = payments.map(obj => ({
            id: String(obj._id),
            status: obj.status,
            caseOwner: obj.caseId?.caseOwner ? obj.caseId.caseOwner : '',
            totalDebt: obj.caseId?.totalDebt ? obj.caseId.totalDebt : 0,
            fullName: obj.debtorName
                ? obj.debtorName
                : obj.caseId?.debtor
                    ? obj.caseId.debtor.basicInformation.fullName
                    : '',
            creditorName: obj.caseId?.creditor
                ? obj.caseId.creditor.basicInformation.fullName
                : '',
            // SSID: obj.caseId?.debtor ? obj.caseId.debtor?.basicInformation.SSID : '',
            authorized: obj.authorized,
            captured: obj.captured,
            amount: obj.amount,
            dueDate: obj.dueDate,
            failedReasonAuthorization: obj.failedReasonAuthorization,
            failedReasonCaptured: obj.failedReasonCaptured,
            tryDate: obj.rescheduled,
            caseId: obj?.caseId?._id ? String(obj.caseId._id) : '',
            transactionType: obj.transactionType ? obj.transactionType : '',
            paymentGateway: obj.paymentGateway ? obj.paymentGateway : '',
            transactionId: obj.debtorTransId,
            sendViaPaynote: obj.sendViaPaynote,
            failedReasonPaynote: obj.failedReasonPaynote,
            debtorId: obj.debtorId,
        }));
        return this.getFilteredPaymentsObj(transformedArray, arrayName);
    }
    async getFilteredPaymentsCreditor(payments) {
        let transformedArray = payments.map(obj => ({
            id: String(obj._id),
            status: obj.status,
            caseOwner: obj.caseId?.caseOwner ? obj.caseId.caseOwner : '',
            totalDebt: obj.caseId?.totalDebt ? obj.caseId.totalDebt : 0,
            debtorName: obj.debtorName,
            creditorName: obj.creditorName,
            // SSID: obj.caseId?.debtor ? obj.caseId.debtor?.basicInformation.SSID : '',
            authorized: obj.authorized,
            captured: obj.captured,
            amount: obj.amount,
            dueDate: obj.dueDate,
            failedReasonAuthorization: obj.failedReasonAuthorization,
            failedReasonCaptured: obj.failedReasonCaptured,
            tryDate: obj.rescheduled,
            caseId: obj?.caseId?._id ? String(obj.caseId._id) : '',
            transactionType: 'ACH',
            paymentGateway: 'Paynote',
            sendViaPaynote: obj.sendViaPaynote,
            failedReasonPaynote: obj.failedReasonPaynote,
            debtorId: obj.debtorId,
        }));
        return transformedArray;
    }
    async getFilteredPaymentsObj(transformedArray, arrayName) {
        let failedCaptures = [], successCaptures = [], successPayments = [], failedAuthorizations = [], successAuthorizations = [], upcomingPayments = [];
        switch (arrayName) {
            case 'failedCaptures':
                failedCaptures = transformedArray.filter(payment => payment.captured === 'Failed');
                break;
            case 'successCaptures':
                successCaptures = transformedArray.filter(payment => payment.captured === 'Success');
                break;
            case 'successPayments':
                successPayments = transformedArray.filter(payment => payment.sendViaPaynote === 'Success');
                break;
            case 'failedAuthorizations':
                failedAuthorizations = transformedArray.filter(payment => payment.authorized === 'Failed');
                break;
            case 'successAuthorizations':
                successAuthorizations = transformedArray.filter(payment => payment.authorized === 'Success');
                break;
            case 'upcomingPayments':
                upcomingPayments = transformedArray.filter(payment => payment.status === 'Upcoming');
                break;
            default:
                for (const payment of transformedArray) {
                    switch (payment.captured) {
                        case 'Failed':
                            failedCaptures.push(payment);
                            break;
                        case 'Success':
                            successCaptures.push(payment);
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
                    if (payment.sendViaPaynote === 'Success') {
                        successPayments.push(payment);
                    }
                }
        }
        return {
            failedCaptures: failedCaptures,
            successPayments: successPayments,
            failedAuthorizations: failedAuthorizations,
            successAuthorizations: successAuthorizations,
            upcomingPayments: upcomingPayments,
            successCaptures: successCaptures,
        };
    }
    async getFilteredCommissionPayments(payments) {
        const transformedArray = payments.map(obj => ({
            id: String(obj._id),
            status: obj.status,
            authorized: obj.authorized,
            captured: obj.captured,
            amount: obj.amount,
            dueDate: obj.dueDate,
            failedReasonAuthorization: obj.failedReasonAuthorization,
            failedReasonCaptured: obj.failedReasonCaptured,
            tryDate: obj.rescheduled,
            transactionType: obj.transactionType ? obj.transactionType : '',
            paymentGateway: obj.paymentGateway ? obj.paymentGateway : '',
        }));
        return this.getFilteredCommissionPaymentsObj(transformedArray);
    }
    async getFilteredCommissionPaymentsObj(transformedArray) {
        let failedCaptures = [], successCaptures = [], successPayments = [], failedAuthorizations = [], successAuthorizations = [], upcomingPayments = [];
        for (const payment of transformedArray) {
            switch (payment.captured) {
                case 'Failed':
                    failedCaptures.push(payment);
                    break;
                case 'Success':
                    successCaptures.push(payment);
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
            switch (payment.status) {
                case 'Upcoming':
                    upcomingPayments.push(payment);
                    break;
                case 'Success':
                    successPayments.push(payment);
                    break;
            }
        }
        return {
            failedCaptures: failedCaptures,
            successPayments: successPayments,
            failedAuthorizations: failedAuthorizations,
            successAuthorizations: successAuthorizations,
            upcomingPayments: upcomingPayments,
            successCaptures: successCaptures,
        };
    }
    async getPendingAuthorized() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Pending',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash'] },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getPendingCommissionAuthorized() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Pending',
            isDeleted: { $ne: true },
            caseId: { $eq: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getPendingCaptured() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Pending',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash'] },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getPendingCommissionCaptured() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Pending',
            isDeleted: { $ne: true },
            caseId: { $eq: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getFailedAuthorized() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Failed',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
            paymentReferenceBool: { $ne: true },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash'] },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getFailedCommissionAuthorized() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Failed',
            isDeleted: { $ne: true },
            caseId: { $eq: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getFailedCaptured() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Failed',
            isDeleted: { $ne: true },
            caseId: { $ne: null },
            paymentReferenceBool: { $ne: true },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash'] },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
    async getFailedCommissionCaptured() {
        return await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Failed',
            isDeleted: { $ne: true },
            caseId: { $eq: null },
        }, undefined, undefined, undefined, [{ path: 'caseId', populate: ['debtor', 'creditor'] }]);
    }
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
                (paymentObj.totalDebt <= filters.totalDebt.min ||
                    paymentObj.totalDebt >= filters.totalDebt.max)) {
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
    async getPaymentsByStatusAndDebtor(status, debtorId) {
        try {
            const results = await this.paymentRepository.applyAggregate([
                {
                    $match: {
                        status: status,
                        debtorId: debtorId, // Match the string debtorId directly
                    },
                },
                {
                    $lookup: {
                        from: 'debtors', // Ensure this matches the actual collection name
                        localField: 'debtorId', // Field in the payments collection (string type)
                        foreignField: 'debtorId', // Assuming debtorId is a string in the debtor model
                        as: 'debtorDetails', // Output field for matched debtor details
                    },
                },
                {
                    $unwind: {
                        path: '$debtorDetails', // Unwind the array to get individual debtor details
                        preserveNullAndEmptyArrays: true, // Keep documents without matches
                    },
                },
                {
                    $project: {
                        _id: 1, // Include the payment ID
                        amount: 1, // Include payment amount
                        status: 1, // Include payment status
                        debtorId: 1, // Include debtor ID
                        companyName: '$debtorDetails.businessInformation.companyName', // Include company name
                    },
                },
            ]);
            return results;
        }
        catch (error) {
            console.error('Error fetching payments:', error);
            throw error; // Rethrow the error for further handling
        }
    }
    async getPaymentReferenceDocuments(referenceId) {
        return await this.paymentRepository.getAllWithoutPagination({
            paymentReference: referenceId,
            paymentReferenceBool: true,
            caseId: { $ne: null },
            isDeleted: false,
        }, undefined, undefined, undefined, { path: 'caseId', populate: ['debtor', 'creditor'] });
    }
    async getAllPaymentReferenceDocuments(referenceId) {
        return await this.paymentRepository.getAllWithoutPagination({
            paymentReference: referenceId,
            paymentReferenceBool: true,
            isDeleted: false,
        }, undefined, undefined, undefined, { path: 'caseId', populate: ['debtor', 'creditor'] });
    }
    async MonToFriDates(payment) {
        const baseDate = new Date(payment.dueDate); // e.g., 2025-04-16
        const dayOfWeek = baseDate.getUTCDay(); // 0 (Sun) to 6 (Sat)
        // Calculate how many days to subtract to get Monday
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday is 0, so we subtract 6
        const monday = new Date(baseDate);
        monday.setUTCDate(baseDate.getUTCDate() + diffToMonday);
        monday.setUTCHours(0, 0, 0, 0);
        const friday = new Date(monday);
        friday.setUTCDate(monday.getUTCDate() + 4); // Monday + 4 days = Friday
        friday.setUTCHours(23, 59, 59, 999);
        return { monday, friday };
    }
    async getOtherPayments(payment) {
        const debtorId = payment.debtorId;
        // const nextDate = await this.addDaysBasedOnPeriod(
        //   payment.dueDate,
        //   payment.timePeriod
        // );
        const { monday, friday } = await this.MonToFriDates(payment);
        const payments = await this.paymentRepository.getAllWithoutPagination({
            debtorId: debtorId,
            caseId: { $ne: null },
            authorized: { $ne: 'Success' },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash'] },
            isDeleted: false,
            dueDate: {
                $gte: monday,
                $lte: friday,
            },
        }, undefined, undefined, undefined, { path: 'caseId', populate: ['debtor', 'creditor'] });
        return payments;
    }
    async addDaysBasedOnPeriod(date, timePeriod) {
        const timePeriods = {
            daily: 1,
            weekly: 7,
            fortnightly: 14,
            monthly: 30,
            custom: 0,
        };
        let daysToAdd = timePeriods[timePeriod.toLowerCase()];
        if (!daysToAdd) {
            daysToAdd = 7;
        }
        const resultDate = new Date(date);
        resultDate.setDate(resultDate.getDate() + daysToAdd);
        return resultDate;
    }
    getWeekdayDate(baseDate, targetWeekday) {
        const day = baseDate.getUTCDay();
        const diff = (targetWeekday + 7 - day) % 7;
        const alignedDate = new Date(baseDate);
        alignedDate.setUTCDate(baseDate.getUTCDate() + diff);
        alignedDate.setUTCHours(0, 0, 0, 0);
        return alignedDate;
    }
    async createPaymentDoc(amount, token, debtorId, paymentGateway, debtorName, link) {
        const payment = new payment_repomodel_1.Payment();
        payment.amount = amount;
        payment.debtorTransId = token;
        if (link)
            payment.paymentLink = link;
        payment.status = 'Pending';
        payment.debtorId = debtorId;
        if (debtorName)
            payment.debtorName = debtorName;
        payment.paymentMode = link ? 'Link' : 'Invoice';
        payment.paymentGateway = paymentGateway;
        const hello = await this.paymentRepository.create(payment);
        console.log('hello', hello);
    }
    async pausePaymentByDay(payments, endDate, updatedDueDate, targetWeekday, creditorPayments) {
        let updatedCreditorDueDate = updatedDueDate;
        targetWeekday = !targetWeekday
            ? new Date(endDate).getUTCDay()
            : targetWeekday;
        for (const payment of payments) {
            if (!updatedDueDate &&
                new Date(payment.dueDate).getUTCDay() <= targetWeekday) {
                updatedDueDate = this.getWeekdayDate(new Date(payment.dueDate), targetWeekday);
            }
            await this.paymentRepository.updateById(payment._id, {
                dueDate: updatedDueDate.toISOString(),
            });
            if (!creditorPayments)
                creditorPayments = await this.getOtherPayments(payment);
            for (const creditorPayment of creditorPayments) {
                let newCreditorDate;
                if (updatedCreditorDueDate) {
                    newCreditorDate = updatedCreditorDueDate;
                }
                else {
                    const creditorDate = new Date(creditorPayment.dueDate);
                    const creditorWeekday = creditorDate.getUTCDay();
                    if (creditorWeekday < targetWeekday) {
                        newCreditorDate = this.getWeekdayDate(creditorDate, targetWeekday);
                    }
                    else {
                        newCreditorDate = creditorDate;
                    }
                }
                await this.paymentRepository.updateById(creditorPayment._id, {
                    dueDate: newCreditorDate.toISOString(),
                });
            }
            updatedDueDate = null;
            creditorPayments = null;
        }
        return [true, 'Payment date updated'];
    }
    async moveToLastPayment(payment, debtor, paymentAmountCheck, creditorPayments) {
        const paymentTemp = await this.findLastDueDate(debtor._id);
        const updatedDueDate = await this.findLastDate(paymentTemp[0]);
        if (payment._id) {
            if (new Date(paymentTemp[0].dueDate).getTime() ===
                new Date(payment.dueDate).getTime() &&
                !paymentAmountCheck) {
                return [
                    false,
                    'You Cannot pause the payment Which is already in last you can shift the day',
                ];
            }
            await this.pausePaymentByDay([payment], '', updatedDueDate, updatedDueDate.getUTCDay());
            return [true, []];
        }
        else {
            payment.dueDate = updatedDueDate.toISOString();
            payment.frequency = paymentTemp[0].frequency + 1;
            const createdPayment = await this.paymentRepository.create(payment);
            await this.pausePaymentByDay([createdPayment], '', new Date(createdPayment.dueDate), null, creditorPayments);
            return [true, []];
        }
    }
    async findLastDateByFrequency(interval) {
        const { frequency, timePeriod, startDate } = interval;
        const daysToAdd = (await common_util_1.default.getTimePeriod(timePeriod)) * frequency;
        return new Date(new Date(startDate).getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    async findLastDate(payment) {
        const daysToAdd = await common_util_1.default.getTimePeriod(payment.timePeriod);
        return new Date(new Date(payment.dueDate).getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
    async findLastDueDate(debtorId) {
        return await this.paymentRepository.getAllWithoutPagination({
            debtorId,
            caseId: null,
            isDeleted: { $ne: true },
            attorneyId: null,
            authorized: { $ne: 'Success' },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash'] },
        }, undefined, undefined, { dueDate: -1 }, undefined, undefined, 1, 1);
    }
    async changePaymentAmmount(payment, amount, debtor) {
        const newPayment = new payment_repomodel_1.Payment();
        const updatedRemainingAmount = payment.amount - amount;
        const paymentValidate = dataCopier_util_1.DataCopier.copy(newPayment, payment);
        paymentValidate.amount = updatedRemainingAmount;
        const updatePayment = await this.paymentRepository.updateById(String(payment._id), {
            amount: amount,
        });
        const creditorPayments = await this.getOtherPayments(payment);
        const { highAggressionPayments, remainingPayments, remainingAmount } = await this.creditorsAmountFilter(amount, creditorPayments);
        return await this.moveToLastPayment(paymentValidate, debtor, true, remainingPayments);
    }
    async creditorsAmountFilter(amount, payments) {
        const highAggressionPayments = [];
        const remainingPayments = [];
        let remainingAmount = amount;
        // Sort in-place by aggression descending
        payments.sort((a, b) => (b.caseId?.creditor?.aggression ?? 0) -
            (a.caseId?.creditor?.aggression ?? 0));
        for (const payment of payments) {
            const paymentAmount = payment.amount ?? 0;
            if (paymentAmount <= remainingAmount) {
                highAggressionPayments.push(payment);
                remainingAmount -= paymentAmount;
            }
            else {
                remainingPayments.push(payment);
            }
        }
        return {
            highAggressionPayments,
            remainingPayments,
            remainingAmount,
        };
    }
    async pausePaymentChecks(debtor, amount, timePeriod) {
        if (!debtor?.lastPaymentAmountDate && !debtor?.lastPaymentPauseDate)
            return [true, []];
        if (debtor?.lastPaymentAmountDate && amount) {
            const pauseAmountDateCount = await common_util_1.default.getTimePeriod('Custom', common_util_1.default.getCurrentDate(), debtor.lastPaymentAmountDate);
            if (pauseAmountDateCount <= 30) {
                return [false, 'Cannot change the Payment amount twice a month.'];
            }
        }
        if (debtor?.lastPaymentPauseDate && timePeriod) {
            const pauseDateCount = await common_util_1.default.getTimePeriod('Custom', common_util_1.default.getCurrentDate(), debtor.lastPaymentPauseDate);
            if (pauseDateCount <= 14) {
                return [false, 'Cannot pause the Payment in a consecutive week'];
            }
        }
        return [true, []];
    }
}
exports.default = new PaymentUtil();
//# sourceMappingURL=payment.util.js.map