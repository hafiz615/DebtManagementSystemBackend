"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_1 = __importDefault(require("./constants.util"));
dotenv_1.default.config();
class SeemlesschexUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
    }
    async createCheck(debtor, amount, token, store) {
        if (!debtor.basicInformation?.fullName)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('creditor name'),
            };
        if (!debtor?.basicInformation?.email)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('creditor email'),
            };
        if (!debtor?.basicInformation?.phone)
            return {
                error: true,
                message: constants_util_1.default.notFoundMessage('creditor email'),
            };
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/check/create`;
        var data = {
            name: debtor.basicInformation?.fullName,
            email: debtor.basicInformation?.email,
            amount: 99,
            memo: `First Choice Debt Solutions`,
            token: 'caf4f6e0c35f11efba16f7a09bc7e775',
            store: 'firstchoice.com',
            verify_before_save: true,
            fund_confirmation: true,
        };
        console.log('I am in createCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.seamlessKey,
                    'Content-Type': 'application/json',
                },
            });
            console.log(response.data);
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async getCheck(checkId) {
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/check/${checkId}`;
        console.log('I am in getCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.get(apiUrl, {
                headers: {
                    Authorization: process.env.seamlessKey,
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
                if (bv.code_bv === 'RT03' ||
                    bv.code_bv === 'RT03' ||
                    bv.code_bv === 'RT03') {
                    return {
                        error: true,
                        message: bv.description_bv,
                    };
                }
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
                if (fc.verification_fc === 'Null' ||
                    fc.verification_fc === 'NonParticipatingBank') {
                    return {
                        error: true,
                        message: fc.description_fc,
                    };
                }
                return data;
        }
    }
    async createPaymentLink(amount) {
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/paymentlink/create`;
        var data = {
            amount: amount,
            basic_verification: true,
            fund_confirmation: true,
        };
        console.log('I am in createPaymentLink');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', data);
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, data, {
                headers: {
                    Authorization: process.env.seamlessKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async updateCheck(debtor, token, store, checkId, checkNumber) {
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/check/edit`;
        var data = {
            check_id: checkId,
            number: checkNumber,
            name: debtor.basicInformation?.fullName,
            email: debtor.basicInformation?.email,
            token: 'caf4f6e0c35f11efba16f7a09bc7e775',
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
                    Authorization: process.env.seamlessKey,
                    'Content-Type': 'application/json',
                },
            });
            console.log(response.data);
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
    async voidCheck(checkId) {
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/check/${checkId}`;
        console.log('I am in voidCheck');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.delete(apiUrl, {
                headers: {
                    Authorization: process.env.seamlessKey,
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
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/paymentlink/changestatus/${checkoutToken}`;
        console.log('I am in changePaymentLinkStatus');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.post(apiUrl, {
                headers: {
                    Authorization: process.env.seamlessKey,
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
        const apiUrl = `${process.env.seamlessUrl}/${process.env.seamlessVersion}/paymentlink/${checkoutToken}`;
        console.log('I am in deletePaymentLink');
        console.log('URL: ', apiUrl);
        console.log('Payload: ', {});
        try {
            const response = await axiosInstanceInterceptor_1.default.delete(apiUrl, {
                headers: {
                    Authorization: process.env.seamlessKey,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        }
        catch (error) {
            return error?.response?.data;
        }
    }
}
exports.default = new SeemlesschexUtil();
//# sourceMappingURL=seemlesschex.util.js.map