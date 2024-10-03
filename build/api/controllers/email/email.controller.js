"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const email_service_1 = __importDefault(require("../../services/email.service"));
const mailparser_1 = require("mailparser");
class EmailController {
    constructor() {
        this.sendSmsEmailDebtorCreditor = async (req, res) => {
            try {
                const response = await this.emailService.sendSmsEmailDebtorCreditor(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: response[1],
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.sendGridEmail = async (req, res) => {
            try {
                // String(parsedMail.from?.value[0].address),
                // Array.isArray(parsedMail.to)
                //   ? parsedMail.to[0].text
                //   : parsedMail.to?.text,
                const parseData = await (0, mailparser_1.simpleParser)(req.body.email);
                // console.log(parseData.to, 'to');
                // console.log(parseData.from, 'from');
                console.log(parseData.subject, 'subject');
                console.log(parseData.text, 'text');
                // console.log(parseData.textAsHtml, 'textAsHtml');
                // console.log(parseData.html, 'html');
                // console.log(parseData.attachments, 'attachments');
                // console.log(parseData.date, 'date');
                // console.log(parseData.replyTo, 'replyTo');
                return res.status(200).send('ok');
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.OK)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.emailService = new email_service_1.default();
    }
}
exports.default = new EmailController();
//# sourceMappingURL=email.controller.js.map