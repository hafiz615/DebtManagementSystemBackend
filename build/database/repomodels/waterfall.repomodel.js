"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Waterfall = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Waterfall {
    constructor() {
        this.debtorId = null;
        this.paymentId = null;
        this.execute = false;
        this.logTrackingId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Waterfall = Waterfall;
//# sourceMappingURL=waterfall.repomodel.js.map