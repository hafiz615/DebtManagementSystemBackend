"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const constants_util_1 = __importDefault(require("./constants.util"));
const rolesPermissions_service_1 = __importDefault(require("../api/services/rolesPermissions.service"));
class CommonUtil {
    getCurrentDate() {
        let date = new Date().toUTCString();
        return date;
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
}
exports.default = new CommonUtil();
//# sourceMappingURL=common.util.js.map