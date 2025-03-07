"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const common_util_1 = __importDefault(require("./common.util"));
class EasyPayDirectSeamless {
    async addInvoice(platform, amount, email) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyPlatform(platform);
        const url = urlSecurityKey.url;
        const params = {
            invoicing: 'add_invoice',
            security_key: urlSecurityKey.securityKey,
            amount: String(amount),
            email: email,
        };
        const response = await axiosInstanceInterceptor_1.default.post(url, new URLSearchParams(params), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('Final Params:', params);
        console.log('Response Data:', response.data);
        const responseNum = new URLSearchParams(response.data).get('response');
        if (responseNum === '1') {
            const invoiceId = new URLSearchParams(response.data).get('invoice_id');
            return [true, invoiceId];
        }
        return [false, 'Unable to create invoice'];
    }
    async sendInvoice(platform, invoiceId) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyPlatform(platform);
        const url = urlSecurityKey.url;
        const params = {
            invoicing: 'send_invoice',
            security_key: urlSecurityKey.securityKey,
            invoice_id: invoiceId,
        };
        const response = await axiosInstanceInterceptor_1.default.post(url, new URLSearchParams(params), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('Send Invoice Params:', params);
        console.log('Response Data:', response.data);
        const responseNum = new URLSearchParams(response.data).get('response');
        if (responseNum === '1') {
            return [true, 'Invoice sent successfully'];
        }
        return [false, 'Unable to send invoice'];
    }
    async closeInvoice(platform, invoiceId) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyPlatform(platform);
        const url = urlSecurityKey.url;
        const params = {
            invoicing: 'close_invoice',
            security_key: urlSecurityKey.securityKey,
            invoice_id: invoiceId,
        };
        const response = await axiosInstanceInterceptor_1.default.post(url, new URLSearchParams(params), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('Close Invoice Params:', params);
        console.log('Response Data:', response.data);
        const responseNum = new URLSearchParams(response.data).get('response');
        if (responseNum === '1') {
            return [true, 'Invoice closed successfully'];
        }
        return [false, 'Unable to close invoice'];
    }
}
exports.default = new EasyPayDirectSeamless();
//# sourceMappingURL=easyPayDirectSeamless.js.map