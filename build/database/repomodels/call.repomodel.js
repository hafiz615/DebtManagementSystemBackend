"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Call = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Call {
    constructor() {
        this.callSid = null;
        this.caseId = ''; // Link to the associated case
        this.callerName = ''; // The name of the person who made the call
        this.accountSid = null;
        this.callTo = ''; // Phone number or ID of the person being called
        this.callFrom = ''; // Phone number or ID of the caller
        this.callStartTime = ''; // The start date/time of the call
        this.callDuration = null; // The duration of the call
        this.callStatus = null; // The status of the call (e.g., completed, missed)
        this.callRecordingSid = ''; // The identifier for the recording of the call
        this.transcriptUrl = ''; // The URL to the call transcript (if available)
        this.createdAt = common_util_1.default.getCurrentDate(); // Created date
        this.updatedAt = common_util_1.default.getCurrentDate(); // Last updated date
    }
}
exports.Call = Call;
//# sourceMappingURL=call.repomodel.js.map