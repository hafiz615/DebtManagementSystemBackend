"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Call = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Call {
    constructor() {
        this.callSid = '';
        this.caseId = '';
        this.callerName = '';
        this.accountSid = '';
        this.callTo = '';
        this.callFrom = '';
        this.callStartTime = '';
        this.callDirection = '';
        this.callDuration = '';
        this.callStatus = '';
        this.callRecordingSid = '';
        this.isDeleted = false;
        this.transcriptUrl = '';
        this.type = 'Call';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Call = Call;
//# sourceMappingURL=call.repomodel.js.map