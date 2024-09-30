"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class PaynoteUtil {
    async createCustomer(creditor) {
        const creditorNames = creditor.basicInformation.fullName.split(' ');
        let lastName = '';
        if (!creditorNames[1]) {
            lastName = creditorNames[0];
        }
        const apiUrl = `${process.env.paynoteSandboxUrl}/user`;
        var data = {
            firstName: creditorNames[0],
            lastName: lastName,
            email: creditor.basicInformation.email,
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
            return response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    async getCustomer(creditor) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/user/:${creditor.paynoteUserId}`;
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
            return error.message;
        }
    }
    async updateCustomer(creditor) {
        const creditorNames = creditor.basicInformation.fullName.split(' ');
        let lastName = '';
        if (!creditorNames[1]) {
            lastName = creditorNames[0];
        }
        var data = {
            firstName: creditorNames[0],
            lastName: lastName,
        };
        const apiUrl = `${process.env.paynoteSandboxUrl}/user/${creditor.paynoteUserId}/update`;
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
            return error.message;
        }
    }
    async sendPayment(payment) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/check/send`;
        const creditor = payment.caseId.creditor;
        var data = {
            recipient: creditor.paynoteSourceId,
            name: creditor.basicInformation.fullName,
            amount: payment.amount,
            description: 'Sending payment to creditor',
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
            return error.message;
        }
    }
    async getPayment(payment) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/check/:${payment.checkId}`;
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
            return error.message;
        }
    }
    async addFundingSource(data, userId) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/on-demand/funding-source`;
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
            console.log(response, 'popopop');
            return response.data;
        }
        catch (error) {
            console.log(error.response.data, 'okokokoko');
            return error.message;
        }
    }
    async initiateFundingSourceVerifcation(sourceId, userId) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/funding-source/initiate/verification`;
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
            return error.message;
        }
    }
    async verifyFundingSource(sourceId) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/funding-source/verify`;
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
            return error.message;
        }
    }
    async updateFundingSource(data, userId) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/funding-source/update`;
        data['user_id'] = userId;
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
            return response.data;
        }
        catch (error) {
            return error.message;
        }
    }
    async removeFundingSource(sourceId, userId) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/funding-source/remove`;
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
            return error.message;
        }
    }
    async getFundingSource(sourceId) {
        const apiUrl = `${process.env.paynoteSandboxUrl}/funding-source/:${sourceId}`;
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
        const apiUrl = `${process.env.paynoteSandboxUrl}/funding-source/user/:${userId}`;
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
}
exports.default = new PaynoteUtil();
//# sourceMappingURL=paynote.util.js.map