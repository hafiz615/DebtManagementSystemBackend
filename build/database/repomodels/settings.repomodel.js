"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Settings {
    constructor() {
        this.paymentsAuthorizations = {
            failedAuthorizations: {
                email: false,
                sms: false,
                smsTemplate: '',
                emailTemplate: '',
                sendTo: {
                    admin: false,
                    manager: false,
                    negotiator: false,
                    debtor: false,
                    creditor: false,
                },
            },
            successfulAuthorizations: {
                email: false,
                sms: false,
                smsTemplate: '',
                emailTemplate: '',
                sendTo: {
                    admin: false,
                    manager: false,
                    negotiator: false,
                    debtor: false,
                    creditor: false,
                },
            },
            failedPayments: {
                email: false,
                sms: false,
                smsTemplate: '',
                emailTemplate: '',
                sendTo: {
                    admin: false,
                    manager: false,
                    negotiator: false,
                    debtor: false,
                    creditor: false,
                },
            },
            successPayments: {
                email: false,
                sms: false,
                smsTemplate: '',
                emailTemplate: '',
                sendTo: {
                    admin: false,
                    manager: false,
                    negotiator: false,
                    debtor: false,
                    creditor: false,
                },
            },
            upcomingPayments: {
                email: false,
                sms: false,
                smsTemplate: '',
                emailTemplate: '',
                sendTo: {
                    admin: false,
                    manager: false,
                    negotiator: false,
                    debtor: false,
                    creditor: false,
                },
            },
            retryInterval: {
                failedAuthorization: {
                    unit: 'days',
                    value: 2,
                    maxRetry: 2,
                },
                failedPayment: {
                    unit: 'days',
                    value: 2,
                    maxRetry: 2,
                },
            },
            authorizationInterval: {
                custom: {
                    unit: 'hours',
                    value: 8,
                },
                daily: {
                    unit: 'hours',
                    value: 8,
                },
                weekly: {
                    unit: 'days',
                    value: 2,
                },
                fortnightly: {
                    unit: 'days',
                    value: 2,
                },
                monthly: {
                    unit: 'days',
                    value: 2,
                },
            },
        };
        this.notificationTemplates = Array();
        this.notificationConfiguration = Array();
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Settings = Settings;
//# sourceMappingURL=settings.repomodel.js.map