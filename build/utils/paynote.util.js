"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_1 = __importDefault(require("./constants.util"));
const syncPaymentMethod_repository_1 = require("../api/repository/ISyncPaymentMethod/syncPaymentMethod.repository");
const common_util_1 = __importDefault(require("./common.util"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const check_repository_1 = require("../api/repository/check/check.repository");
const debtor_util_1 = __importDefault(require("./debtor.util"));
const waterfall_repository_1 = require("../api/repository/waterfall/waterfall.repository");
dotenv_1.default.config();
class PaynoteUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.syncPaymentMethodRepository = new syncPaymentMethod_repository_1.SyncPaymentMethodRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.checkRepository = new check_repository_1.CheckRepository();
        this.waterfallRepository = new waterfall_repository_1.WaterfallRepository();
    }
    async createCustomer(id, name, email, modelRepository, addAccount) {
        if (!name)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('name'),
            };
        const userNames = name.split(' ');
        if (!email)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('email'),
            };
        let lastName = '';
        if (!userNames[1]) {
            lastName = userNames[0];
        }
        else {
            lastName = userNames.slice(1).join(' ');
        }
        const apiUrl = `${process.env.paynoteUrl}/user`;
        var data = {
            firstName: userNames[0],
            lastName: lastName,
            email: email,
        };
        console.log('I am in createCustomer');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data?.success && !addAccount) {
                await modelRepository.updateById(id, {
                    paynoteUserId: response.data?.user?.user_id,
                    paynoteUserFound: true,
                });
            }
            else {
                await modelRepository.updateById(id, {
                    $addToSet: {
                        paynoteUserIds: response.data?.user?.user_id,
                    },
                });
            }
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async getCustomer(creditor) {
        const apiUrl = `${process.env.paynoteUrl}/user/:${creditor.paynoteUserId}`;
        console.log('I am in getCustomer');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.get(apiUrl, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async getCheck(checkId) {
        const apiUrl = `${process.env.paynoteUrl}/check/:${checkId}`;
        console.log('I am in getCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.get(apiUrl, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async updateCustomer(creditor) {
        const creditorNames = creditor.basicInformation.fullName.split(' ');
        let lastName = '';
        if (!creditorNames[1]) {
            lastName = creditorNames[0];
        }
        else {
            lastName = creditorNames.slice(1).join(' ');
        }
        var data = {
            firstName: creditorNames[0],
            lastName: lastName,
        };
        const apiUrl = `${process.env.paynoteUrl}/user/${creditor.paynoteUserId}/update`;
        console.log('I am in updateCustomer');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async sendPayment(payment) {
        const apiUrl = `${process.env.paynoteUrl}/check/send`;
        const companyName = payment.caseId?.debtor?.businessInformation.companyName;
        const creditorName = payment.caseId?.creditor?.basicInformation.fullName ||
            payment.lawsuitId?.lawfirmId?.lawfirmCompanyName;
        const desc = companyName + ' - ' + creditorName;
        var data = {
            recipient: payment.caseId?.paynoteUserId ||
                payment.lawsuitId?.lawfirmId?.paynoteUserId,
            name: creditorName,
            amount: payment.amount,
            description: desc,
        };
        console.log('I am in sendPayment');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async getPayment(payment) {
        const apiUrl = `${process.env.paynoteUrl}/check/:${payment.checkId}`;
        console.log('I am in getCustomer');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.get(apiUrl, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async addFundingSource(data, userId) {
        const apiUrl = `${process.env.paynoteUrl}/on-demand/funding-source`;
        data['user_id'] = userId;
        console.log('I am in addFundingSource');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async initiateFundingSourceVerifcation(sourceId, userId) {
        const apiUrl = `${process.env.paynoteUrl}/funding-source/initiate/verification`;
        const data = {
            user_id: userId,
            source_id: sourceId,
        };
        console.log('I am in initiateFundingSourceVerifcation');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async verifyFundingSource(sourceId) {
        const apiUrl = `${process.env.paynoteUrl}/funding-source/verify`;
        const data = {
            source_id: sourceId,
            amount1: 0.01,
            amount2: 0.02,
        };
        console.log('I am in verifyFundingSource');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async updateFundingSource(data, user) {
        const apiUrl = `${process.env.paynoteUrl}/funding-source/update`;
        data['user_id'] = user.obj.paynoteUserId;
        data['source_id'] = user.obj.paynoteSourceId; // ADD BACK THIS LINE
        console.log('I am in updateFundingSource');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            await user.model.updateById(user.obj._id, {
                paynoteSourceId: response.data?.funding_source?.source_id,
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async removeFundingSource(sourceId, userId) {
        const apiUrl = `${process.env.paynoteUrl}/funding-source/remove`;
        const data = {
            user_id: userId,
            source_id: sourceId,
        };
        console.log('I am in removeFundingSource');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error;
        }
    }
    async getFundingSource(sourceId) {
        const apiUrl = `${process.env.paynoteUrl}/funding-source/:${sourceId}`;
        console.log('I am in getFundingSource');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, {}, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    async getCustomerFundingSources(userId) {
        const apiUrl = `${process.env.paynoteUrl}/funding-source/user/:${userId}`;
        console.log('I am in getCustomerFundingSources');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, {}, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    async getAllCustomerDetails(page, limit) {
        const apiUrl = `${process.env.paynoteUrl}/user?page=${page}&limit=${limit}`;
        console.log('I am in getAllCustomerDetails');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.get(apiUrl, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            console.log(error, 'erorr');
            return error.response.data;
        }
    }
    async syncUsersPaynote() {
        console.log('i am going to run syncUsersPaynote');
        let page = 1;
        let limit = 100;
        const allCreditors = await this.creditorRepository.getAllWithoutPagination();
        const creditorEmails = allCreditors
            .filter(creditor => creditor.basicInformation.email) // Filter creditors with an email
            .map(creditor => creditor.basicInformation.email.toLowerCase());
        const result = await this.getAllCustomerDetails(page, limit);
        if (result?.error) {
            return;
        }
        await this.processAllUsersResult(result.list.data, creditorEmails);
        const lastPage = result.list.last_page;
        if (lastPage > page) {
            for (let i = page + 1; i <= lastPage; i++) {
                const result = await this.getAllCustomerDetails(i, limit);
                if (result?.error) {
                    break;
                }
                await this.processAllUsersResult(result.list.data, creditorEmails);
            }
        }
    }
    async processAllUsersResult(users, creditorEmails) {
        let update = {};
        for (const user of users) {
            update = { paynoteUserId: '' };
            const email = user.email.toLowerCase();
            if (creditorEmails.includes(email)) {
                update['paynoteUserFound'] = true;
                update['paynoteUserId'] = user.user_id;
                // let sourceVerified = false;
                // for (const source of user.sources) {
                //   if (source.status === 'verified') {
                //     sourceVerified = true;
                //     update['paynoteSourceId'] = source.source_id;
                //     break;
                //   }
                // }
                // update['paynoteSourceVerified'] = sourceVerified;
            }
            if (!creditorEmails.includes(email)) {
                update['paynoteUserFound'] = false;
                // update['paynoteSourceVerified'] = false;
            }
            this.creditorRepository.updateByOne({ 'basicInformation.email': email }, update);
            update = {};
        }
    }
    async getPaynoteErrorMessage(result) {
        let message = '';
        if (result?.messages) {
            message = result.messages[0];
        }
        else {
            message = result.message;
        }
        return message;
    }
    async processSyncCreditorPaynote(users, creditorEmail) {
        let update = { paynoteUserId: '' };
        const paynoteEmails = users.map(user => {
            return user.email.toLowerCase();
        });
        const index = paynoteEmails.indexOf(creditorEmail);
        if (index === -1) {
            update['paynoteUserFound'] = false;
            return [false, update];
        }
        update['paynoteUserFound'] = true;
        update['paynoteUserId'] = users[index].user_id;
        update['paynoteSourceIds'] = users[index].sources;
        return [true, update];
    }
    async selectPreferredPaynoteSource(paynoteSources) {
        if (!Array.isArray(paynoteSources) || !paynoteSources.length)
            return null;
        const primaryVerified = paynoteSources.find(src => src.is_primary === true && src.status === 'verified');
        if (primaryVerified)
            return primaryVerified;
        const nonPrimaryVerified = paynoteSources.find(src => src.is_primary === false && src.status === 'verified');
        if (nonPrimaryVerified)
            return nonPrimaryVerified;
        return paynoteSources[0];
    }
    async updateSyncObject(data, creditorId, modelRepository) {
        const { paynoteSourceIds, ...rest } = data;
        await modelRepository.updateById(creditorId, rest);
    }
    async upsertPaynoteEmail(id, email) {
        await this.syncPaymentMethodRepository.upsert({ syncId: id }, {
            email: email,
            platform: 'Paynote',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
    }
    async addPaynoteAccount(id, paynoteUserId, paynoteSourceId) {
        await debtor_util_1.default.createAccount(id, 'ACH', 'Paynote', paynoteUserId, paynoteSourceId);
        return await this.debtorRepository.updateById(id, {
            $addToSet: {
                paynoteSourceIds: { $each: [paynoteSourceId] },
            },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
    }
    async directDebit(id, payment, debtor) {
        const apiUrl = `${process.env.paynoteUrl}/ach-debit`;
        const companyName = debtor?.businessInformation.companyName;
        const debtorName = debtor?.basicInformation.fullName;
        const data = {
            sender: id,
            name: debtorName,
            amount: payment.amount,
            description: companyName,
        };
        console.log('I am in directDebit');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.paynoteSecretKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async paynoteWebhook(response) {
        const checkId = response.check.check_id;
        // const payment = await this.paymentRepository.getOne<IPayment>({
        //   debtorTransId: checkId,
        //   isDeleted: false,
        //   caseId: {$eq: null},
        // });
        // const accountsTemp = await debtorUtil.getDebtorAccounts(payment.debtorId);
        // const ccPresent = await debtorUtil.ifCCPresent(accountsTemp);
        const updateObj = {
            status: 'Pending',
            updatedAt: common_util_1.default.getCurrentDate(),
        };
        // if (response.check.status !== 'processed' && !ccPresent) {
        //   updateObj['captured'] = 'Failed';
        //   updateObj['failedReasonCaptured'] =
        //     response.check.error_explanation ||
        //     response.check.error_description ||
        //     constantsUtil.Messages.CHECK_VOIDED;
        // }
        if (response.check.status !== 'processed') {
            updateObj['captured'] = 'Failed';
            updateObj['authorized'] = 'Failed';
            const reason = response.check.error_explanation ||
                response.check.error_description ||
                constants_util_1.default.Messages.CHECK_VOIDED;
            updateObj['failedReasonAuthorized'] = reason;
            updateObj['failedReasonCaptured'] = reason;
        }
        switch (response.check.status) {
            case 'processed':
                updateObj['captured'] = 'Success';
                updateObj['authorized'] = 'Success';
                updateObj['checkStatus'] = 'Completed';
                await this.updateCheckAndPayment(checkId, updateObj, response.check.status);
                break;
            case 'cancelled':
                updateObj['captured'] = 'Failed';
                updateObj['authorized'] = 'Success';
                updateObj['achWaterfall'] = false;
                await this.updateCheckAndPayment(checkId, updateObj, response.check.status);
                break;
            case 'declined':
                updateObj['checkStatus'] = '';
                await this.updateCheckAndPayment(checkId, updateObj, response.check.status);
                break;
            case 'failed':
                updateObj['checkStatus'] = '';
                await this.updateCheckAndPayment(checkId, updateObj, response.check.status);
                break;
            case 'expired':
                updateObj['checkStatus'] = '';
                await this.updateCheckAndPayment(checkId, updateObj, response.check.status);
                break;
        }
        return [true, ''];
    }
    async updateCheckAndPayment(checkId, updatePaymentObj, status) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: checkId,
            isDeleted: { $ne: true },
        });
        if (!payment)
            return [true, ''];
        await this.checkRepository.updateByOne({ checkId: checkId, isDeleted: false }, { status: status });
        console.log(updatePaymentObj, 'updatePaymentObj');
        await this.paymentRepository.updateMany({ debtorTransId: checkId }, updatePaymentObj);
        return [true, ''];
    }
}
exports.default = new PaynoteUtil();
//# sourceMappingURL=paynote.util.js.map