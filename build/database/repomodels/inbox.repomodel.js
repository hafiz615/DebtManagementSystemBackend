"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inbox = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
// import {v4} from 'uuid';
class Inbox {
    constructor() {
        this.from = '';
        this.to = '';
        this.cc = null;
        this.subject = '';
        this.text = '';
        this.textAsHtml = '';
        this.caseCode = '';
        this.caseId = '';
        this.isRead = false;
        this.type = '';
        this.debtorCompanyName = '';
        this.creditorCompanyName = '';
        this.negotiatorName = '';
        this.threadId = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Inbox = Inbox;
//# sourceMappingURL=inbox.repomodel.js.map