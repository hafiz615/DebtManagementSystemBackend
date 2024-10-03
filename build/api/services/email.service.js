"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const case_repository_1 = require("../repository/case/case.repository");
const mailparser_1 = require("mailparser");
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
    async sendGridEmail(req) {
        // String(parsedMail.from?.value[0].address),
        // Array.isArray(parsedMail.to)
        //   ? parsedMail.to[0].text
        //   : parsedMail.to?.text,
        const parseData = await (0, mailparser_1.simpleParser)(req.body.email);
        // console.log(parseData.to, 'to');
        // console.log(parseData.from, 'from');
        console.log(parseData.subject, 'subject');
        console.log(parseData.text, 'text');
        const subject = parseData.subject;
        const text = parseData.text;
        const checkIfConfirmationEmail = await email_util_1.default.checkIfConfirmationEmail(subject, text);
        if (checkIfConfirmationEmail) {
            const link = await email_util_1.default.getConfirmationLinkFromEmailText(text);
            if (link) {
            }
        }
        // console.log(parseData.textAsHtml, 'textAsHtml');
        // console.log(parseData.html, 'html');
        // console.log(parseData.attachments, 'attachments');
        // console.log(parseData.date, 'date');
        // console.log(parseData.replyTo, 'replyTo');
    }
}
exports.default = EmailService;
//# sourceMappingURL=email.service.js.map