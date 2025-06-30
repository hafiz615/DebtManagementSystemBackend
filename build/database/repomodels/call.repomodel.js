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
        this.callLegId = '';
        this.callSessionId = '';
        this.caseId = null;
        this.userId = null;
        this.debtorId = null;
        this.creditorId = null;
        this.callerName = 'Unknown';
        this.accountSid = '';
        this.callTo = [];
        this.callFrom = '';
        this.callStartTime = '';
        this.callEndTime = '';
        this.callDirection = '';
        this.callDuration = 0;
        this.callStatus = '';
        this.callRecordingSid = '';
        this.isDeleted = false;
        this.transcriptUrl = '';
        this.type = 'Call';
        this.conferenceName = '';
        this.hangup_cause = '';
        this.hangup_source = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Call = Call;
//# sourceMappingURL=call.repomodel.js.map