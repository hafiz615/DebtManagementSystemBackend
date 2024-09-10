"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const email_service_1 = __importDefault(require("../../services/email.service"));
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
                // Access the parsed email data sent by SendGrid
                console.log('req.bodyyyy', req.body);
                const emailData = req.body;
                // Extract email fields
                const to = emailData.to; // Recipient
                const from = emailData.from; // Sender
                const subject = emailData.subject; // Subject
                const text = emailData.text; // Body (plain text)
                const html = emailData.html; // Body (HTML)
                console.log(to, 'to');
                console.log(from, 'from');
                console.log(subject, 'subject');
                console.log(text, 'text');
                console.log(html, 'html');
                // Handle attachments
                if (req.files && Array.isArray(req.files)) {
                    req.files.forEach(file => {
                        console.log(`Received file: ${file.originalname}`);
                        // file.buffer contains the binary data of the file
                    });
                }
                if (req?.file) {
                    console.log('File:', req.file?.originalname);
                }
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