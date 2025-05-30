"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
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
const notification_repository_1 = require("../repository/notification/notification.repository");
const emailThreading_repository_1 = require("../repository/emailThreading/emailThreading.repository");
const inbox_utils_1 = __importDefault(require("../../utils/inbox.utils"));
class EmailService {
    constructor() {
        this.extractThreadId = (header) => {
            const match = header && header.match(/threadId-([^&@>]+)/);
            return match ? match[1] : null;
        };
        this.extractCaseId = (header) => {
            const match = header && header.match(/caseId-([^&@>]+)/);
            return match ? match[1] : null;
        };
        this.extractUserId = (header) => {
            const match = header && header.match(/userId-([^&@>]+)/);
            return match ? match[1] : null;
        };
        this.extractUserName = (header) => {
            const match = header && header.match(/userName-([^&@>]+)/);
            return match ? match[1] : null;
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.domainVerifyRepository = new domainVerify_repository_1.DomainVerifyRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
        this.uploadUtil = new upload_util_1.default();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.emailThreadingRepository = new emailThreading_repository_1.EmailThreadingRepository();
    }
    async sendSmsEmailDebtorCreditor(req) {
        const reqTemp = req;
        const threadId = reqTemp.query.threadId;
        // const reqTemp: any = req;
        const type = String(req.query.type);
        if (type !== 'email' && type !== 'sms' && type !== 'compose') {
            return [false, 'Type is missing!'];
        }
        let caseTemp = null;
        const isMongoId = common_util_1.default.isMongoId(req.params.id);
        if (isMongoId) {
            caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [
                { path: 'debtor', select: ['businessInformation.companyName'] },
                { path: 'creditor', select: ['businessInformation.companyName'] },
            ]);
        }
        return await email_util_1.default.sendEmailSmsToDebtorCreditor(caseTemp, reqTemp.id, req.body, type, reqTemp?.files?.files || [], threadId, reqTemp.name);
    }
    async sendGridEmail(req) {
        const reqTemp = req;
        const parseData = await (0, mailparser_1.simpleParser)(req.body.email);
        // console.log(parseData, 'okoko');
        const subject = parseData.subject;
        const text = parseData.text;
        const from = parseData.from?.value[0].address;
        const fromName = parseData.from?.value[0].name;
        const to = Array.isArray(parseData.to)
            ? parseData.to[0].text
            : parseData.to?.text;
        const cc = Array.isArray(parseData.cc)
            ? parseData.cc[0].text.split(',')
            : parseData.cc?.text.split(',') || [];
        const attachments = parseData.attachments;
        const referencesHeader = parseData.headers.get('references');
        console.log('referencesHeader: ', referencesHeader);
        if (referencesHeader) {
            const data = await this.uploadUtil.sendGridAwsS3FileUpload(attachments, false);
            for (const obj of data) {
                const mimeType = common_util_1.default.getMimeType(obj.key);
                obj.url = await this.uploadUtil.getS3FileSignedUrl(obj.key, mimeType, 60 * 60 * 24 * 365 * 10, process.env.s3BucketName);
            }
            const caseId = this.extractCaseId(referencesHeader.toString());
            console.log('caseId: ', caseId);
            const userId = this.extractUserId(referencesHeader.toString());
            console.log('userId: ', userId);
            const userName = this.extractUserName(referencesHeader.toString());
            console.log('userName: ', userName);
            const threadId = this.extractThreadId(referencesHeader.toString());
            console.log('threadId: ', threadId);
            // Split the text at "wrote:"
            const testParts = text.split('wrote:');
            const extractedText = testParts[0]?.trim() + ' wrote:';
            console.log('Extracted Text:', extractedText);
            const htmlText = parseData.textAsHtml;
            const splitParts = htmlText.split(/(wrote:<\/p>)/);
            const extractedHtml = splitParts[0] + (splitParts[1] || '');
            console.log('extractedHtml: ', extractedHtml);
            let caseData = null;
            if (caseId) {
                console.log('caseId Check in caseID: ', caseId);
                const historyObj = {
                    Username: userName,
                    Subject: subject,
                    From: from,
                    To: to,
                    Content: extractedHtml,
                    Time: new Date(common_util_1.default.getCurrentDate()),
                    Action: 'EMAIL',
                    Attachments: data,
                };
                if (cc.length)
                    historyObj['CC'] = cc;
                await case_util_1.default.addInHistory(historyObj, caseId);
                caseData = await this.caseRepository.getById(caseId, undefined, undefined, [
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                ]);
            }
            const emailData = {
                from,
                to,
                subject,
                extractedText,
                textAsHtml: extractedHtml,
                cc: cc,
                attachments: data,
            };
            if (threadId) {
                console.log('threadId: ', threadId);
                console.log('threadId: inside the thread ID ', threadId);
                const notification = await email_util_1.default.createInbox(caseData, 'received', emailData, threadId, userId, userName, 'EMAIL');
                if (!caseData) {
                    notification.text = email_util_1.default.formatText(userName);
                }
                await this.notificationRepository.create(notification);
                const notificationCount = await this.notificationCountRepository.getOne({ userId: userId }, undefined, undefined, undefined, undefined);
                app_1.default.socketInstance.emit('notify', {
                    notificationCount: notificationCount.count,
                    type: 'EMAIL',
                    emailCount: notificationCount.emailCount,
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
    async emailThreading(req) {
        const id = req.query?.userId ?? null;
        const inboxFilters = await inbox_utils_1.default.getAllInboxFilters(req);
        const threadFilters = {
            isDeleted: { $ne: true },
        };
        const emailThreading = await this.emailThreadingRepository.getAllWithoutPagination(threadFilters, undefined, undefined, undefined, {
            path: 'firstInboxMessage',
            match: inboxFilters,
        });
        const filteredThreads = emailThreading.filter((thread) => thread.firstInboxMessage);
        if (!filteredThreads.length) {
            return [false, constants_util_1.default.notFoundMessage('email')];
        }
        return [true, filteredThreads];
    }
    async eachThreadingMails(req) {
        const emailThreading = await this.emailThreadingRepository.getOne({ threadId: req.params.id, isDeleted: { $ne: true } }, undefined, undefined, { path: 'previousMessages', populate: ['previousMessages'] });
        if (!emailThreading)
            return [false, constants_util_1.default.notFoundMessage('email.')];
        return [true, emailThreading];
    }
}
exports.default = EmailService;
//# sourceMappingURL=email.service.js.map