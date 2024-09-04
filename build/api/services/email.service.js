"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const case_repository_1 = require("../repository/case/case.repository");
class EmailService {
    constructor() {
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async sendSmsEmailDebtorCreditor(req) {
        const reqTemp = req;
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const type = String(req.query.type);
        if (type !== 'email' && type !== 'sms') {
            return [false, 'Type is missing!'];
        }
        return await email_util_1.default.sendEmailSmsToDebtorCreditor(caseTemp._id, reqTemp.id, req.body, type);
    }
}
exports.default = EmailService;
//# sourceMappingURL=email.service.js.map