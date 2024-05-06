"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const constants_util_1 = __importDefault(require("./constants.util"));
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
}
exports.default = new CommonUtil();
//# sourceMappingURL=common.util.js.map