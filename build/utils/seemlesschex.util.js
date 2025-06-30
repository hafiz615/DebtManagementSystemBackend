"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_1 = __importDefault(require("./constants.util"));
const check_repomodel_1 = require("../database/repomodels/check.repomodel");
const check_repository_1 = require("../api/repository/check/check.repository");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const common_util_1 = __importDefault(require("./common.util"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
dotenv_1.default.config();
class SeemlesschexUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.checkRepository = new check_repository_1.CheckRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    async createCheck(debtor, amount, token, accountInfo) {
        if (!debtor?.basicInformation?.email)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('debtor email'),
            };
        if (!debtor?.basicInformation?.phone)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('debtor phone'),
            };
        const name = accountInfo.firstName + ' ' + accountInfo.lastName;
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/create`;
        var data = {
            name: name,
            email: debtor.basicInformation?.email,
            amount: amount,
            memo: `First Choice Debt Solutions`,
            token: token,
            store: 'firstchoice.com',
            verify_before_save: true,
            phone: debtor?.basicInformation?.phone,
        };
        console.log('I am in createCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
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
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/${checkId}`;
        console.log('I am in getCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.get(apiUrl, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async checkBasicVerification(data) {
        const bv = data.check.basic_verification;
        switch (bv.pass_bv) {
            case 0:
                return {
                    error: true,
                    message: bv.description_bv,
                };
            case 1:
                return data;
        }
    }
    async checkFundsVerification(data) {
        const fc = data.check.funds_confirmation;
        switch (fc.pass_fc) {
            case 0:
                return {
                    error: true,
                    message: fc.description_fc,
                };
            case 1:
                return data;
        }
    }
    async createPaymentLink(amount) {
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/paymentlink/create`;
        var data = {
            amount: amount,
            basic_verification: true,
        };
        console.log('I am in createPaymentLink');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async updateCheck(debtor, token, checkId, accountInfo) {
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/edit`;
        var data = {
            check_id: checkId,
            name: accountInfo.firstName + ' ' + accountInfo.lastName,
            email: debtor.basicInformation?.email,
            token: token,
            store: 'firstchoice.com',
            verify_before_save: true,
            fund_confirmation: true,
        };
        console.log('I am in updateCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async voidCheck(checkId) {
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/${checkId}`;
        console.log('I am in voidCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.delete(apiUrl, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async changePaymentLinkStatus(checkoutToken) {
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/paymentlink/changestatus/${checkoutToken}`;
        console.log('I am in changePaymentLinkStatus');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async deletePaymentLink(checkoutToken) {
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/paymentlink/${checkoutToken}`;
        console.log('I am in deletePaymentLink');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.delete(apiUrl, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async saveCheckInfo(bv, fc, response, debtorId) {
        if (response.error) {
            return;
        }
        const newCheck = new check_repomodel_1.Check();
        newCheck.checkId = response.check.check_id;
        newCheck.number = response.check.number;
        newCheck.status = response.check.status;
        newCheck.basicVerification = bv?.error ? 'Fail' : 'Pass';
        // newCheck.fundsConfirmation = fc?.error ? 'Fail' : 'Pass';
        newCheck.bvReason = bv?.error ? bv.message : '';
        // newCheck.fcReason = fc?.error ? fc.message : '';
        newCheck.debtorId = debtorId;
        await this.checkRepository.create(newCheck);
    }
    async deleteCheckInfo(checkId, status) {
        const check = await this.checkRepository.updateByOne({ checkId: checkId }, { isDeleted: true, status: status });
    }
    async getCheckInfo(checkId) {
        return await this.checkRepository.getOne({ checkId: checkId }, { isDeleted: false });
    }
    async tokenization(accountInfoObject) {
        const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/account/tokenization`;
        const data = {
            first_name: accountInfoObject.firstName,
            last_name: accountInfoObject.lastName,
            bank_routing: accountInfoObject.bankRouting,
            bank_account: accountInfoObject.bankAccount,
            store: 'firstchoice.com',
        };
        console.log('I am in tokenization');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.seamlesschexKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async updateCheckInfo(bv, fc, response, checkId) {
        const data = {
            status: response.check.status,
            basicVerification: bv?.error ? 'Fail' : 'Pass',
            // fundsConfirmation: fc?.error ? 'Fail' : 'Pass',
            bvReason: bv?.error ? bv.message : '',
            // fcReason: fc?.error ? fc.message : '',
        };
        await this.checkRepository.updateByOne({ checkId: checkId }, data);
    }
    async updateIfCheckDeleted(checkId, status) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: checkId,
        });
        if (!payment)
            return [true, ''];
        await this.deleteCheckInfo(checkId, status);
        await this.paymentRepository.updateMany({ debtorTransId: checkId, isDeleted: { $ne: true } }, {
            captured: 'Failed',
            achWaterfall: false,
            failedReasonCaptured: 'Check has been deleted',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return [true, ''];
    }
    async updateIfCheckDeposited(checkId, status) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: checkId,
            isDeleted: { $ne: true },
        });
        if (!payment)
            return [true, ''];
        await this.checkRepository.updateByOne({ checkId: checkId, isDeleted: false }, { status: status });
        await this.paymentRepository.updateMany({ debtorTransId: checkId }, {
            authorized: 'Success',
            captured: 'Success',
            checkStatus: 'Completed',
            status: 'Pending',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        // await this.debtorRepository.updateById<IDebtor>(foundCheck.debtorId, {
        //   $inc: {commissionPaid: payment.manualCommission},
        // });
        return [true, ''];
    }
    async updateIfCheckFailed(checkId, status) {
        const payment = await this.paymentRepository.getOne({
            debtorTransId: checkId,
            isDeleted: false,
        });
        if (!payment)
            return [true, ''];
        await this.checkRepository.updateByOne({ checkId: checkId, isDeleted: false }, { status: status });
        const updateObj = {
            failedReasonCaptured: 'Check has been failed',
            failedReasonAuthorized: 'Check has been failed',
            updatedAt: common_util_1.default.getCurrentDate(),
        };
        updateObj['checkStatus'] = '';
        updateObj['captured'] = 'Failed';
        updateObj['authorized'] = 'Failed';
        await this.paymentRepository.updateMany({ debtorTransId: checkId, isDeleted: { $ne: true } }, updateObj);
        return [true, ''];
    }
    async checkStatusWebhook(response) {
        if (response?.data) {
            const checkId = response.data.check_id;
            // const payment = await this.paymentRepository.getOne<IPayment>({
            //   debtorTransId: checkId,
            // });
            // const accountsTemp = await debtorUtil.getDebtorAccounts(payment.debtorId);
            // const ccPresent = await debtorUtil.ifCCPresent(accountsTemp);
            switch (response.event) {
                case 'check.changed':
                    switch (response.data.status) {
                        case 'void':
                            await this.updateIfCheckDeleted(checkId, response.data.status);
                            break;
                        case 'deposited':
                            await this.updateIfCheckDeposited(checkId, response.data.status);
                            break;
                        case 'failed':
                            await this.updateIfCheckFailed(checkId, response.data.status);
                            break;
                    }
                    break;
                case 'check.deleted':
                    await this.updateIfCheckDeleted(checkId, response.data.status);
                    break;
            }
        }
        return [true, ''];
    }
}
exports.default = new SeemlesschexUtil();
//# sourceMappingURL=seemlesschex.util.js.map