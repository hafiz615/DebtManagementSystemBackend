"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainVerify = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class DomainVerify {
    constructor() {
        this.link = '';
        this.isVerified = false;
        this.from = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.DomainVerify = DomainVerify;
//# sourceMappingURL=domainVerify.repomodel.js.map