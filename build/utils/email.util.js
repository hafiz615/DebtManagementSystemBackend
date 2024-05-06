"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mail_1 = __importDefault(require("@sendgrid/mail"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_1 = __importDefault(require("./constants.util"));
dotenv_1.default.config();
class EmailUtil {
    constructor() {
        mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
    }
    async sendInvitationLink(user, link) {
        const msg = {
            to: user.email,
            from: 'mohsin@luminogics.com', // Use the email address or domain you verified above
            subject: `${constants_util_1.default.ACCOUNT_INVITATION_SUBJECT}`,
            text: `Dear ${user.name},

             You've been invited to join our platform! To complete your account setup, please click the link below to set your password:

             ${link}

             If you didn't request this, you can safely ignore this email.

            Thank you,
            Debt-Settlement Team`,
        };
        try {
            await mail_1.default.send(msg);
        }
        catch (error) {
            console.log(error.message);
            return error.message;
        }
    }
}
exports.default = EmailUtil;
//# sourceMappingURL=email.util.js.map