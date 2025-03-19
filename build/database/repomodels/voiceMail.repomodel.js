"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceMail = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class VoiceMail {
    constructor() {
        this.callSid = '';
        this.callTo = '';
        this.callFrom = '';
        this.callRecordingSid = '';
        this.transcriptUrl = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.VoiceMail = VoiceMail;
//# sourceMappingURL=voiceMail.repomodel.js.map