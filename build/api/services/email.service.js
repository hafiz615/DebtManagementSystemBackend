"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const case_repository_1 = require("../repository/case/case.repository");
const mailparser_1 = require("mailparser");
const domainVerify_repository_1 = require("../repository/domainVerify/domainVerify.repository");
const domainVerify_repomodel_1 = require("../../database/repomodels/domainVerify.repomodel");
const common_util_1 = __importDefault(require("../../utils/common.util"));
class EmailService {
    constructor() {
        this.caseRepository = new case_repository_1.CaseRepository();
        this.domainVerifyRepository = new domainVerify_repository_1.DomainVerifyRepository();
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
        const from = parseData.from?.value[0].address;
        const checkIfConfirmationEmail = await email_util_1.default.checkIfConfirmationEmail(subject, text);
        console.log(checkIfConfirmationEmail, 'checkIfConfirmationEmail');
        if (checkIfConfirmationEmail) {
            const link = await email_util_1.default.getConfirmationLinkFromEmailText(text);
            console.log(link, 'link');
            if (link) {
                const newDomainVerify = new domainVerify_repomodel_1.DomainVerify();
                newDomainVerify.link = link;
                newDomainVerify.from = from;
                await this.domainVerifyRepository.create(newDomainVerify);
            }
        }
        // console.log(parseData.textAsHtml, 'textAsHtml');
        // console.log(parseData.html, 'html');
        // console.log(parseData.attachments, 'attachments');
        // console.log(parseData.date, 'date');
        // console.log(parseData.replyTo, 'replyTo');
    }
    async getAllLinks() {
        const links = await this.domainVerifyRepository.getAllWithoutPagination({
            isVerified: false,
        });
        if (!links.length) {
            return [false, constants_util_1.default.notFoundMessage('links')];
        }
        return [true, links];
    }
    async linkVerified(req) {
        const verified = await this.domainVerifyRepository.updateByOne({ _id: req.params.id }, {
            isVerified: true,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!verified) {
            return [false, constants_util_1.default.failureDeleteMessage('link')];
        }
        return [true, ''];
    }
}
exports.default = EmailService;
//# sourceMappingURL=email.service.js.map