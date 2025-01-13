"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Draft = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Draft {
    constructor() {
        this.userId = '';
        this.caseId = '';
        this.from = '';
        this.to = '';
        this.cc = null;
        this.subject = '';
        this.content = '';
        this.caseCode = '';
        this.debtorCompanyName = '';
        this.creditorCompanyName = '';
        this.negotiatorName = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Draft = Draft;
//# sourceMappingURL=draft.repomodel.js.map