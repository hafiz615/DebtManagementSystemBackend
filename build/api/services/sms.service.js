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
const user_repository_1 = require("../repository/user/user.repository");
const uuid_1 = require("uuid");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const notification_repository_1 = require("../repository/notification/notification.repository");
const notificationCount_repository_1 = require("../repository/notificationCount/notificationCount.repository");
const MessagingResponse_1 = __importDefault(require("twilio/lib/twiml/MessagingResponse"));
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
            await email_util_1.default.createNewInbox(smsData, caseData, SmsStatus, (0, uuid_1.v4)(), findUser?._id?.toString() || '', findUser?.name || '', null, null, 'SMS');
            if (caseData) {
                await case_util_1.default.addInHistory({
                    number,
                    To: cleanedTo,
                    Content: Body,
                    Time: new Date(common_util_1.default.getCurrentDate()),
                    Action: 'SMS',
                }, caseData._id.toString());
            }
            const newNotification = new notification_repomodel_1.Notification();
            newNotification.caseId = caseData?._id.toString() || undefined;
            newNotification.text = this.formatText(name?.companyName || 'Unknown');
            newNotification.type = 'SMS';
            await this.notificationRepository.create(newNotification);
            await this.notificationCountRepository.upsert({}, { $inc: { count: 1 } });
            const updatedCount = await this.notificationCountRepository.getAll({});
            app_1.default.socketInstance.emit('notify', {
                notificationCount: updatedCount.length > 0 ? updatedCount[0].count : 0,
                notification: newNotification,
            });
            const twiml = new MessagingResponse_1.default();
            twiml.message('Message received successfully');
            return [true, twiml.toString()];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
    }
    formatText(text) {
        return `SMS received from ${text}`;
    }
}
exports.default = SmsService;
//# sourceMappingURL=sms.service.js.map