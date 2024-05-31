"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const settings_repository_1 = require("../repository/setting/settings.repository");
const settings_repomodel_1 = require("../../database/repomodels/settings.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const customField_repository_1 = require("../repository/customFields/customField.repository");
const customField_repomodel_1 = require("../../database/repomodels/customField.repomodel");
const targetCF_repository_1 = require("../repository/targetCustomFields/targetCF.repository");
const settings_util_1 = __importDefault(require("../../utils/settings.util"));
class SettingsService {
    constructor() {
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.customFieldsRepository = new customField_repository_1.CustomFieldsRepository();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
    }
    async addSettings(req) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAll({});
        if (!findSettings.length) {
            const newSettings = new settings_repomodel_1.Settings();
            if (req.body?.notificationTemplates?.email?.length) {
                req.body.notificationTemplates.email[0].templateId = 'Template-001';
            }
            if (req.body?.notificationTemplates?.sms?.length) {
                req.body.notificationTemplates.sms[0].templateId = 'Template-001';
            }
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            if (req.body?.notificationTemplates?.email?.length >
                findSettings[0].notificationTemplates.email.length) {
                let num = req.body.notificationTemplates.email.length;
                req.body.notificationTemplates.email[num - 1].templateId =
                    'Template-' + num.toString().padStart(3, '0');
            }
            if (req.body?.notificationTemplates?.sms?.length >
                findSettings[0].notificationTemplates.sms.length) {
                let num = req.body.notificationTemplates.sms.length;
                req.body.notificationTemplates.sms[num - 1].templateId =
                    'Template-' + num.toString().padStart(3, '0');
            }
            settigns = await this.settingsRepository.updateById(findSettings[0].id, {
                ...req.body,
            });
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
    async getSettings() {
        const findSettings = await this.settingsRepository.getAll();
        const customFields = await this.customFieldsRepository.getAll();
        if (!findSettings.length) {
            return [
                true,
                {
                    paymentsAuthorizations: null,
                    notificationTemplates: null,
                    customFields: customFields,
                },
            ];
        }
        return [
            true,
            {
                paymentsAuthorizations: findSettings[0].paymentsAuthorizations,
                notificationTemplates: findSettings[0].notificationTemplates,
                customFields: customFields,
            },
        ];
    }
    async addCustomField(req) {
        const newCustomField = new customField_repomodel_1.CustomFiled();
        const validatedCustomField = dataCopier_util_1.DataCopier.copy(newCustomField, req.body);
        let customField = await this.customFieldsRepository.create(validatedCustomField);
        if (!customField) {
            return [false, constants_util_1.default.failureAddMessage('Custom field')];
        }
        return [true, customField];
    }
    async editCustomField(req) {
        let customField = await this.customFieldsRepository.updateById(req.params.id, req.body);
        if (!customField) {
            return [false, constants_util_1.default.failureUpdateMessage('Custom field')];
        }
        return [true, customField];
    }
    async getCustomFieldsByTarget(target) {
        const customFields = await this.customFieldsRepository.getAll({ $or: [{ target: target }, { shared: true }] });
        if (!customFields.length) {
            return [false, constants_util_1.default.notFoundMessage('Custom fields')];
        }
        return [true, customFields];
    }
    async addCustomFieldByTarget(req) {
        const { name, value } = req.body;
        if (!req.query.target) {
            return [false, 'Target is missing'];
        }
        const target = String(req.query.target);
        const customField = await this.customFieldsRepository.getOne({
            $and: [{ target: target }, { name: name }],
        });
        if (!customField) {
            return [false, constants_util_1.default.notFoundMessage('custom field')];
        }
        return await settings_util_1.default.addCustomFieldByTarget(customField, req.body, target);
    }
    async removeCustomFieldByTarget(req) {
        if (!req.query.target) {
            return [false, 'Target is missing'];
        }
        let targetCF = await this.targetCFRepository.updateByOne({ target: String(req.query.target) }, {
            $pull: { customFields: req.body },
        });
        console.log(targetCF);
        if (!targetCF) {
            return [false, constants_util_1.default.notFoundMessage('custom field')];
        }
        return [true, targetCF];
    }
    async deleteCustomField(req) {
        let customField = await this.customFieldsRepository.delete({
            _id: req.params.id,
        });
        if (!customField) {
            return [false, constants_util_1.default.failureDeleteMessage('custom field')];
        }
        return [true, customField];
    }
}
exports.default = SettingsService;
//# sourceMappingURL=settings.service.js.map