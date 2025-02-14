"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../../app"));
const call_util_1 = __importDefault(require("../../utils/call.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const notification_repomodel_1 = require("../../database/repomodels/notification.repomodel");
const common_util_1 = __importDefault(require("../../utils/common.util"));
const case_repository_1 = require("../repository/case/case.repository");
const inbox_repository_1 = require("../repository/inbox/inbox.repository");
const notification_repository_1 = require("../repository/notification/notification.repository");
const user_repository_1 = require("../repository/user/user.repository");
const uuid_1 = require("uuid");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const notificationCount_repository_1 = require("../repository/notificationCount/notificationCount.repository");
const MessagingResponse_1 = __importDefault(require("twilio/lib/twiml/MessagingResponse"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
class SmsService {
    constructor() {
        this.receivedSmsFallback = async (req) => {
            const twiml = new MessagingResponse_1.default();
            twiml.message('We are experiencing issues. Please try again later or contact support.');
            return [true, twiml.toString()];
        };
        this.receivedMessage = async (req) => {
            const { From, Body, SmsStatus, To } = req.body;
            const number = await common_util_1.default.cleanPhoneNumberConditionally(From);
            const name = await call_util_1.default.getDebtorOrCreditorName(number);
            let caseData = null;
            const newNotification = new notification_repomodel_1.Notification();
            if (name?.creditorId) {
                caseData = await this.caseRepository.getOne({ creditor: name.creditorId, isDeleted: { $ne: true } }, undefined, undefined, [
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                ]);
            }
            else if (name?.debtorId) {
                const findCases = await this.caseRepository.getAllWithoutPagination({ debtor: name.debtorId, isDeleted: { $ne: true } }, undefined, undefined, undefined, [
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                ]);
                newNotification.debtorId = name?.debtorId;
                caseData = findCases.length === 1 ? findCases[0] : null;
            }
            const cleanedTo = await common_util_1.default.cleanPhoneNumber(To);
            const findUser = await this.userRepository.getOne({
                twilioNo: To,
                isDeleted: false,
            });
            const smsData = {
                from: number,
                to: cleanedTo,
                text: Body,
                textAsHtml: Body,
            };
            const inbox = await email_util_1.default.createNewInbox(smsData, caseData, SmsStatus, (0, uuid_1.v4)(), findUser?._id?.toString() || '', findUser?.name || '', null, null, 'SMS');
            if (caseData) {
                await case_util_1.default.addInHistory({
                    From: number,
                    To: cleanedTo,
                    Content: Body,
                    Time: new Date(common_util_1.default.getCurrentDate()),
                    Action: 'SMS',
                    Username: findUser?.name || '',
                }, caseData._id.toString());
            }
            newNotification.caseId = caseData?._id.toString() || undefined;
            newNotification.text = this.formatText(name?.companyName || 'Unknown');
            newNotification.type = 'SMS';
            newNotification.inboxId = inbox.id;
            newNotification.userId = findUser?._id?.toString() || '';
            await this.notificationRepository.create(newNotification);
            let updatedCount;
            if (findUser) {
                await this.notificationCountRepository.upsert({ userId: findUser._id }, { $inc: { count: 1, smsCount: 1 } });
                updatedCount =
                    await this.notificationCountRepository.getOne({
                        userId: findUser._id,
                    });
            }
            app_1.default.socketInstance.emit('notify', {
                notificationCount: updatedCount?.count || 0,
                type: 'SMS',
                smsCount: updatedCount?.smsCount,
                notification: newNotification,
            });
            const twiml = new MessagingResponse_1.default();
            twiml.message('Message received successfully');
            return [true, twiml.toString()];
        };
        this.saveCaseDetailNotification = async (req) => {
            const reqTemp = req;
            const { caseIds, notificationId, inboxId } = req.body;
            const inboxData = await this.inboxRepository.getById(inboxId);
            const notificationData = await this.notificationRepository.getById(notificationId);
            if (!inboxData || !notificationData) {
                return [false, constants_util_1.default.notFoundMessage('Inbox or Notification')];
            }
            const allCases = await this.caseRepository.getAllWithoutPagination({ _id: { $in: caseIds } }, undefined, undefined, undefined, [
                { path: 'debtor', select: ['businessInformation.companyName'] },
                { path: 'creditor', select: ['businessInformation.companyName'] },
            ]);
            if (allCases.length === 0) {
                return [false, constants_util_1.default.notFoundMessage('Cases')];
            }
            const firstCase = allCases[0];
            await this.inboxRepository.updateById(inboxId, {
                caseCode: firstCase.caseCode,
                caseId: firstCase._id.toString(),
                debtorCompanyName: firstCase.debtor?.businessInformation?.companyName,
                creditorCompanyName: firstCase.creditor?.businessInformation?.companyName,
                negotiatorName: firstCase.negotiator,
            });
            await this.notificationRepository.updateById(notificationId, {
                text: this.formatText(firstCase.debtor?.businessInformation?.companyName),
                caseId: allCases.length === 1 ? firstCase._id.toString() : '',
                isLinked: true,
            });
            await case_util_1.default.addInHistory({
                From: inboxData?.from,
                To: inboxData?.to,
                Content: inboxData?.text,
                Time: new Date(common_util_1.default.getCurrentDate()),
                Action: 'SMS',
                Username: reqTemp.name,
            }, firstCase._id.toString());
            const { _id, ...inboxWithoutId } = inboxData;
            for (const caseTemp of allCases.slice(1)) {
                const inboxCreation = await this.inboxRepository.create({
                    ...inboxWithoutId,
                    caseCode: caseTemp.caseCode,
                    caseId: caseTemp._id.toString(),
                    debtorCompanyName: caseTemp.creditor?.businessInformation?.companyName,
                    creditorCompanyName: caseTemp.creditor?.businessInformation?.companyName,
                    negotiatorName: caseTemp.negotiator,
                });
                await case_util_1.default.addInHistory({
                    From: inboxData?.from,
                    To: inboxData?.to,
                    Content: inboxData?.text,
                    Time: new Date(common_util_1.default.getCurrentDate()),
                    Action: 'SMS',
                }, caseTemp._id.toString());
            }
            return [true, 'Inbox successfully linked to the case.'];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
    }
    formatText(text) {
        return `SMS received from ${text}`;
    }
}
exports.default = SmsService;
//# sourceMappingURL=sms.service.js.map