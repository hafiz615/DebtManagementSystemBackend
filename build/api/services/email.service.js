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
const case_util_1 = __importDefault(require("../../utils/case.util"));
const inbox_repository_1 = require("../repository/inbox/inbox.repository");
const app_1 = __importDefault(require("../../app"));
const notificationCount_repository_1 = require("../repository/notificationCount/notificationCount.repository");
class EmailService {
    constructor() {
        this.extractCaseId = (header) => {
            const match = header && header.match(/caseId-([^@>]+)/);
            return match ? match[1] : null;
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.domainVerifyRepository = new domainVerify_repository_1.DomainVerifyRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
    }
    async sendSmsEmailDebtorCreditor(req) {
        const reqTemp = req;
        const type = String(req.query.type);
        if (type !== 'email' && type !== 'sms' && type !== 'compose') {
            return [false, 'Type is missing!'];
        }
        let caseTemp = null;
        if (type !== 'compose') {
            caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_1.default.notFoundMessage('case')];
            }
        }
        return await email_util_1.default.sendEmailSmsToDebtorCreditor(caseTemp ? String(caseTemp._id) : null, reqTemp.id, req.body, type);
    }
    async sendGridEmail(req) {
        const parseData = await (0, mailparser_1.simpleParser)(req.body.email);
        const subject = parseData.subject;
        const text = parseData.text;
        const from = parseData.from?.value[0].address;
        const to = Array.isArray(parseData.to)
            ? parseData.to[0].text
            : parseData.to?.text;
        const referencesHeader = parseData.headers.get('references');
        if (referencesHeader) {
            const caseId = this.extractCaseId(referencesHeader.toString());
            if (caseId) {
                await case_util_1.default.addInHistory({
                    From: from,
                    To: to,
                    Content: parseData.textAsHtml,
                    Time: new Date(common_util_1.default.getCurrentDate()),
                    Action: 'EMAIL',
                    Subject: subject,
                }, caseId);
                const caseData = await this.caseRepository.getById(caseId, undefined, undefined, [
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                ]);
                const emailData = {
                    from,
                    to,
                    subject,
                    text,
                    textAsHtml: parseData.textAsHtml,
                    cc: parseData.cc,
                };
                const notification = await email_util_1.default.createInbox(caseData, 'received', emailData);
                const notificationCount = await this.notificationCountRepository.getAll(undefined, undefined, undefined, undefined, undefined);
                app_1.default.socketInstance.emit('notify', {
                    notificationCount: notificationCount[0].count,
                    notification: notification,
                });
                return true;
            }
        }
        const checkIfConfirmationEmail = await email_util_1.default.checkIfConfirmationEmail(subject, text);
        console.log(checkIfConfirmationEmail, 'checkIfConfirmationEmail');
        if (checkIfConfirmationEmail) {
            const link = await email_util_1.default.getConfirmationLinkFromEmailText(text);
            console.log(link, 'link');
            if (link) {
                const newDomainVerify = new domainVerify_repomodel_1.DomainVerify();
                newDomainVerify.link = link;
                newDomainVerify.from = from;
                newDomainVerify.subject = subject;
                newDomainVerify.text = text;
                await this.domainVerifyRepository.create(newDomainVerify);
            }
            return true;
        }
        return true;
    }
    async getAllLinks() {
        const links = await this.domainVerifyRepository.getAllWithoutPagination({
            isVerified: false,
        }, undefined, undefined, { _id: -1 });
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