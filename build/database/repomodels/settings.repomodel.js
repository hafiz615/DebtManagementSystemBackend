"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
class Notify {
    constructor() {
        this.email = false;
        this.sms = false;
        this.template = '';
        this.sendTo = {
            admin: false,
            manager: false,
            negotiator: false,
            debtor: false,
            creditor: false,
        };
    }
}
class RetryInterval {
    constructor() {
        this.unit = '';
        this.value = 0;
        this.maxRetry = 0;
        this.retryCount = 0;
    }
}
class UnitVal {
    constructor() {
        this.unit = '';
        this.value = 0;
    }
}
class EmailNotify {
    constructor() {
        this.name = '';
        this.event = '';
        this.html = '';
    }
}
class SmsNotify {
    constructor() {
        this.name = '';
        this.event = '';
        this.text = '';
    }
}
class Settings {
    constructor() {
        this.paymentsAuthorizations = {
            failedAuthorizations: Notify,
            successfulAuthorizations: Notify,
            failedPayments: Notify,
            successPayments: Notify,
            upcomingPayments: Notify,
            retryInterval: {
                failedAuthorization: RetryInterval,
                failedPayment: RetryInterval,
            },
            authorizationInterval: {
                custom: UnitVal,
                daily: UnitVal,
                weekly: UnitVal,
                fortnightly: UnitVal,
                monthly: UnitVal,
            },
        };
        this.notificationTemplates = {
            email: Array(),
            sms: Array(),
        };
        this.customFields = Array();
    }
}
exports.Settings = Settings;
//# sourceMappingURL=settings.repomodel.js.map