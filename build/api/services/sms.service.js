"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const call_util_1 = __importDefault(require("../../utils/call.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
const case_repository_1 = require("../repository/case/case.repository");
const user_repository_1 = require("../repository/user/user.repository");
const uuid_1 = require("uuid");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const MessagingResponse_1 = __importDefault(require("twilio/lib/twiml/MessagingResponse"));
class SmsService {
    constructor() {
        this.receivedSmsFallback = async (req) => {
            console.log('Fallback triggered:', req.body);
            const twiml = new MessagingResponse_1.default();
            twiml.message('We are experiencing issues. Please try again later or contact support.');
            return [true, twiml.toString()];
        };
        this.receivedMessage = async (req) => {
            const { From, Body, SmsStatus, To } = req.body;
            const number = await common_util_1.default.cleanPhoneNumber(From);
            const name = await call_util_1.default.getDebtorOrCreditorName(number);
            let caseData = name?.creditorId
                ? await this.caseRepository.getOne({ creditor: name.creditorId, isDeleted: { $ne: true } }, undefined, undefined, [
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                ])
                : null;
            if (!caseData && name?.debtorId) {
                const findCases = await this.caseRepository.getAllWithoutPagination({ debtor: name.debtorId, isDeleted: { $ne: true } }, undefined, undefined, undefined, [
                    { path: 'creditor', select: ['businessInformation.companyName'] },
                    { path: 'debtor', select: ['businessInformation.companyName'] },
                ]);
                caseData = findCases.length === 1 ? findCases[0] : null;
            }
            const findUser = await this.userRepository.getOne({
                twilioNo: To,
                isDeleted: false,
            });
            const smsData = {
                from: From,
                to: To,
                text: Body,
                textAsHtml: Body,
            };
            const hello = await email_util_1.default.createNewInbox(smsData, caseData, SmsStatus, (0, uuid_1.v4)(), findUser?._id?.toString() || '', findUser?.name || '', null, null, 'SMS');
            if (caseData) {
                await case_util_1.default.addInHistory({
                    From,
                    To,
                    Content: Body,
                    Time: new Date(common_util_1.default.getCurrentDate()),
                    Action: 'SMS',
                }, caseData._id.toString());
            }
            const twiml = new MessagingResponse_1.default();
            twiml.message('Message received successfully');
            return [true, twiml.toString()];
        };
        this.caseRepository = new case_repository_1.CaseRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
}
exports.default = SmsService;
//# sourceMappingURL=sms.service.js.map