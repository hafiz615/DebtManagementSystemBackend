"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_util_1 = __importDefault(require("./common.util"));
const targetCF_repository_1 = require("../api/repository/targetCustomFields/targetCF.repository");
class SettingsUtil {
    constructor() {
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
    }
    async addCustomFieldByTarget(customField, body, target, caseId) {
        const { name, value } = body;
        let targetCF = null;
        customField.type =
            customField.type === 'text' ? 'string' : customField.type;
        let valueType = typeof value;
        if (valueType === 'string') {
            const date = new Date(value);
            valueType = !isNaN(date.getTime()) ? 'date' : valueType;
        }
        if (valueType !== customField.type) {
            return [false, 'Custom field and value type mismatched'];
        }
        switch (target) {
            case 'case':
                const temp = await this.targetCFRepository.getOne({
                    target: target,
                    caseId: caseId,
                });
                if (!temp) {
                    targetCF = await this.targetCFRepository.create({
                        target: target,
                        customFields: [body],
                        caseId: caseId,
                        createdAt: common_util_1.default.getCurrentDate(),
                        updatedAt: common_util_1.default.getCurrentDate(),
                    });
                }
                else {
                    targetCF =
                        await this.targetCFRepository.updateByOne({ target: target, caseId: caseId }, {
                            $addToSet: { customFields: body },
                        });
                }
                break;
        }
        return [true, targetCF];
    }
    async mergeSettings(settings, body) {
        const paymentsAuthorizations = [
            'failedAuthorizations',
            'successfulAuthorizations',
            'failedPayments',
            'successPayments',
            'upcomingPayments',
            'retryInterval',
            'authorizationInterval',
        ];
        const notificationTemplates = ['sms', 'email'];
        if (body.paymentsAuthorizations) {
            paymentsAuthorizations.forEach(key => {
                if (!body.paymentsAuthorizations.hasOwnProperty(key)) {
                    body.paymentsAuthorizations[key] =
                        settings.paymentsAuthorizations[key];
                }
            });
        }
        if (body.notificationTemplates) {
            notificationTemplates.forEach(key => {
                if (!body.notificationTemplates.hasOwnProperty(key)) {
                    body.notificationTemplates[key] = settings.notificationTemplates[key];
                }
            });
        }
        return body;
    }
}
exports.default = new SettingsUtil();
//# sourceMappingURL=settings.util.js.map