"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fee = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Fee {
    constructor() {
        this.fee = 0;
        this.type = '';
        this.userId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Fee = Fee;
//# sourceMappingURL=fee.repomodel.js.map