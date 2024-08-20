"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mail_1 = __importDefault(require("@sendgrid/mail"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_1 = __importDefault(require("./constants.util"));
const notificationConfiguration_repository_1 = require("../api/repository/notificationConfiguration/notificationConfiguration.repository");
const settings_repository_1 = require("../api/repository/setting/settings.repository");
const case_repository_1 = require("../api/repository/case/case.repository");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const user_repository_1 = require("../api/repository/user/user.repository");
const lodash_1 = __importDefault(require("lodash"));
const handlebars_1 = __importDefault(require("handlebars"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
dotenv_1.default.config();
class EmailUtil {
    constructor() {
        mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
        this.notificationConfigurationRepository =
            new notificationConfiguration_repository_1.NotificationConfigurationRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    async sendInvitationLink(user, link) {
        const msg = {
            to: user.email,
            from: 'ralph@firstchoicedebtsolutions.org', // Use the email address or domain you verified above
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
    async sendEmailOrSmsByEvent(value, caseId, paymentId, userId) {
        const event = await this.notificationConfigurationRepository.getOne({ value });
        if (event) {
            const userPermissions = event.userPermission;
            let [user, debtor, creditor, caseTemp, payment] = await this.initializeValues(caseId, paymentId, userId);
            for (const userPermission of userPermissions) {
                if (userPermission.email_allowed && userPermission.email_template) {
                    const template = await this.getTemplate(userPermission.email_template);
                    if (!template)
                        continue;
                    const allValues = await this.getValuesFromHtml(template.content);
                    if (!allValues.length)
                        continue;
                    let replacements = await this.getPopulatedObject(event, debtor, creditor, caseTemp, user, payment, allValues);
                    if (!Object.keys(replacements).length)
                        continue;
                    const nestedObject = await this.unflat(replacements);
                    const compiledHtml = handlebars_1.default.compile(template.content);
                    const html = compiledHtml(nestedObject);
                    const emails = await this.getEmail(caseTemp, userPermission.role);
                    await this.sendEmail(emails, template.from
                        ? template.from
                        : 'ralph@firstchoicedebtsolutions.org', template.subject, html);
                }
                if (userPermission.sms_allowed && userPermission.sms_template) {
                }
            }
        }
    }
    async sendEmailOrSmsByEventForCommission(value, payment) {
        const event = await this.notificationConfigurationRepository.getOne({ value });
        if (event) {
            const userPermissions = event.userPermission;
            let debtor = await this.debtorRepository.getById(payment.debtorId);
            for (const userPermission of userPermissions) {
                if (userPermission.email_allowed && userPermission.email_template) {
                    const template = await this.getTemplate(userPermission.email_template);
                    if (!template)
                        continue;
                    const allValues = await this.getValuesFromHtml(template.content);
                    if (!allValues.length)
                        continue;
                    let replacements = await this.getPopulatedObject(event, debtor, null, null, null, payment, allValues);
                    if (!Object.keys(replacements).length)
                        continue;
                    const nestedObject = await this.unflat(replacements);
                    const compiledHtml = handlebars_1.default.compile(template.content);
                    const html = compiledHtml(nestedObject);
                    await this.sendEmail('ralph@firstchoicedebtsolutions.org', template.from
                        ? template.from
                        : 'ralph@firstchoicedebtsolutions.org', template.subject, html);
                }
                if (userPermission.sms_allowed && userPermission.sms_template) {
                }
            }
        }
    }
    async getEmail(caseTemp, role) {
        switch (role) {
            case 'Admin':
                const users = await this.userRepository.getAllWithoutPagination({
                    role: role,
                });
                const emails = users.map(user => {
                    return user.email;
                });
                return emails;
            case 'Debtor':
                return caseTemp.debtor.basicInformation.email;
            case 'Creditor':
                return caseTemp.creditor.basicInformation.email;
            case 'Case Manager':
                const manager = await this.userRepository.getById(caseTemp.managerId);
                return manager.email;
            case 'Negotiator':
                const negotiator = await this.userRepository.getById(caseTemp.negotiatorId);
                return negotiator.email;
            default:
                break;
        }
    }
    async unflat(replacements) {
        const nestedObject = {};
        Object.keys(replacements).forEach(key => {
            lodash_1.default.set(nestedObject, key, replacements[key]);
        });
        return nestedObject;
    }
    async getTemplate(id) {
        const result = await this.settingsRepository.getOne({
            notificationTemplates: {
                $elemMatch: {
                    templateId: id,
                },
            },
        }, undefined, 'notificationTemplates.$');
        return result?.notificationTemplates?.length
            ? result?.notificationTemplates[0]
            : null;
    }
    async initializeValues(caseId, paymentId, userId) {
        console.log(userId, 'userIduserId');
        let debtor = null, creditor = null, user = null, payment = null, caseTemp = null;
        if (caseId) {
            const result = await this.caseRepository.getById(caseId, undefined, undefined, ['debtor', 'creditor']);
            caseTemp = result;
            debtor = result.debtor;
            creditor = result.creditor;
        }
        if (paymentId) {
            const result = await this.paymentRepository.getById(paymentId, undefined, undefined, {
                path: 'caseId',
                populate: ['debtor', 'creditor'],
            });
            payment = result;
            caseTemp = result.caseId;
            debtor = result.caseId.debtor;
            creditor = result.caseId.creditor;
        }
        if (userId) {
            user = await this.userRepository.getById(userId);
        }
        return [user, debtor, creditor, caseTemp, payment];
    }
    async getValuesFromHtml(html) {
        const regex = /\{\{([^}]+)\}\}/g;
        const matches = [];
        let match = [];
        while ((match = regex.exec(html)) !== null) {
            matches.push(match[1].trim());
        }
        return matches;
    }
    async getPopulatedObject(event, debtor, creditor, caseTemp, user, payment, keys) {
        // keys = ['debtor.basicInformation.fullName', 'case.totalDebt'];
        const populatedObj = {};
        for (const key of keys) {
            const [beforeDot, ...afterDot] = key.split('.');
            const joinedString = afterDot.join('.');
            switch (beforeDot) {
                case 'case':
                    populatedObj[key] = lodash_1.default.get(caseTemp, joinedString) ?? '';
                    break;
                case 'debtor':
                    populatedObj[key] = lodash_1.default.get(debtor, joinedString) ?? '';
                    break;
                case 'creditor':
                    populatedObj[key] = lodash_1.default.get(creditor, joinedString) ?? '';
                    break;
                case 'payment':
                    populatedObj[key] = lodash_1.default.get(payment, joinedString) ?? '';
                    break;
                case 'event':
                    populatedObj[key] = lodash_1.default.get(event, joinedString) ?? '';
                    break;
                case 'user':
                    populatedObj[key] = lodash_1.default.get(user, joinedString) ?? '';
                    break;
                default:
                    populatedObj[key] = '';
                    break;
            }
        }
        return populatedObj;
    }
    async sendEmail(to, from, subject, html) {
        const msg = {
            to: to,
            from: from, // Use the email address or domain you verified above
            subject: subject,
            html: html,
        };
        try {
            await mail_1.default.send(msg);
        }
        catch (error) {
            console.log(error.response.body);
            return error.message;
        }
    }
}
exports.default = new EmailUtil();
//# sourceMappingURL=email.util.js.map