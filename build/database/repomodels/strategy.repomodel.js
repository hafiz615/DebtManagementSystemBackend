"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Status {
    constructor() {
        this.caseId = '';
        this.name = '';
        this.data = null;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Status = Status;
//# sourceMappingURL=strategy.repomodel.js.map