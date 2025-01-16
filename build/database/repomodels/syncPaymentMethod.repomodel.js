"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncPaymentMethod = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class syncPaymentMethod {
    constructor() {
        this.syncId = '';
        this.email = '';
        this.platform = '';
        this.customerVaultId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.syncPaymentMethod = syncPaymentMethod;
//# sourceMappingURL=syncPaymentMethod.repomodel.js.map