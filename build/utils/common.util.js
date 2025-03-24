"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const constants_util_1 = __importDefault(require("./constants.util"));
const rolesPermissions_service_1 = __importDefault(require("../api/services/rolesPermissions.service"));
const n_krypta_1 = require("n-krypta");
const dotenv_1 = __importDefault(require("dotenv"));
const enums_1 = require("../enums");
const mime_types_1 = __importDefault(require("mime-types"));
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const attorney_repository_1 = require("../api/repository/attorney/attorney.repository");
dotenv_1.default.config();
class CommonUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
    }
    getCurrentDate() {
        let date = new Date().toUTCString();
        return date;
    }
    async getUserByType(id, type) {
        switch (type) {
            case 'creditor':
                return {
                    obj: await this.creditorRepository.getById(id),
                    model: new creditor_repository_1.CreditorRepository(),
                };
            case 'attorney':
                return {
                    obj: await this.attorneyRepository.getById(id),
                    model: new attorney_repository_1.AttorneyRepository(),
                };
            default:
                return null;
        }
    }
    async getUserDetails(data) {
        return {
            name: data?.basicInformation?.fullName || data?.name,
            email: data?.basicInformation?.email || data?.email,
        };
    }
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return await bcryptjs_1.default.hash(String(password), salt);
    }
    checkPasswordRegex(password) {
        const passRegex = constants_util_1.default.passwordRegex;
        return passRegex.test(password);
    }
    async checkPermission(keyword, req) {
        const rolesPermissionsService = new rolesPermissions_service_1.default();
        const role = req.role;
        const getRole = await rolesPermissionsService.getRole(role);
        const permissions = {
            ...getRole.generalPermissions,
            ...getRole.settings,
            ...getRole.analytics,
        };
        // if (keyword === 'addNewUser' && req.body.role === 'Admin') {
        //   return permissions['createAdminUser'];
        // }
        return permissions[keyword];
    }
    async calculatePercentageChange(oldValue, newValue) {
        const difference = newValue - oldValue;
        const percentageChange = (difference / oldValue) * 100;
        return Number(percentageChange.toFixed(2)); // Returns the result rounded to 2 decimal places
    }
    async cleanPhoneNumber(phoneNumber) {
        let cleanedNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
        if (cleanedNumber.startsWith('1')) {
            cleanedNumber = cleanedNumber.substring(1);
        }
        return cleanedNumber;
    }
    async cleanedNumber(num) {
        return num.replace(/\D/g, '').slice(-10);
    }
    async removeDashesAndRoundBrackets(data) {
        if (typeof data === 'number')
            return String(data);
        if (!data)
            return '-';
        return data.replace(/[-()]/g, '');
    }
    async getValuePercenatge(data) {
        if (typeof data === 'number')
            return String(data);
        if (!data)
            return '-';
        const result = data.match(/\d+%/);
        if (result) {
            return result[0];
        }
        else {
            return data;
        }
    }
    async getFirstAndLastNameByFullName(fullName) {
        const creditorNames = fullName.split(' ');
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
        return data;
    }
    getDecryptedData(data) {
        return (0, n_krypta_1.decrypt)(data, process.env.kryptaSecretKey);
    }
    async getUrlAndSecurityKeyPlatform(platform) {
        let securityKey = '';
        let url = '';
        switch (platform) {
            case enums_1.paymentPlatform.easypay:
                securityKey = process.env.easypaySecurityKey;
                url = process.env.easypayUrl;
                break;
            case enums_1.paymentPlatform.seamlesschexMerchant:
                securityKey = process.env.seamlesschexMerchantSecurityKey;
                url = process.env.seamlesschexMerchantUrl;
                break;
        }
        return { securityKey, url };
    }
    async getUrlAndSecurityKeyQuery(platform) {
        let securityKey = '';
        let url = '';
        switch (platform) {
            case enums_1.paymentPlatform.easypay:
                securityKey = process.env.easypaySecurityKey;
                url = process.env.easypayQueryUrl;
                break;
            case enums_1.paymentPlatform.seamlesschexMerchant:
                securityKey = process.env.seamlesschexMerchantSecurityKey;
                url = process.env.seamlesschexMerchantQueryUrl;
                break;
        }
        return { securityKey, url };
    }
    async getPageAndLimit(defaultPage, defaultLimit, req) {
        let page = 0, limit = 0;
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : defaultPage;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : defaultLimit;
        }
        return { page, limit };
    }
    getMimeType(fileName) {
        return mime_types_1.default.lookup(fileName) || 'application/octet-stream';
    }
}
exports.default = new CommonUtil();
//# sourceMappingURL=common.util.js.map