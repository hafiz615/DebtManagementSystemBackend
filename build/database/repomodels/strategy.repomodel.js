"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strategy = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Strategy {
    constructor() {
        this.caseId = '';
        this.name = '';
        this.data = null;
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Strategy = Strategy;
//# sourceMappingURL=strategy.repomodel.js.map