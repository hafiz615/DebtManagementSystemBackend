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
const common_util_1 = __importDefault(require("../../utils/common.util"));
const settings_util_1 = __importDefault(require("../../utils/settings.util"));
const notificationConfiguration_repository_1 = require("../repository/notificationConfiguration/notificationConfiguration.repository");
const notificationConfiguration_repomodel_1 = require("../../database/repomodels/notificationConfiguration.repomodel");
class SettingsService {
    constructor() {
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.customFieldsRepository = new customField_repository_1.CustomFieldsRepository();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
        this.notificationConfigurationRepository =
            new notificationConfiguration_repository_1.NotificationConfigurationRepository();
    }
    async addSettings(req, keyword) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAllWithoutPagination();
        if (!findSettings?.length) {
            const newSettings = new settings_repomodel_1.Settings();
            if (req.body?.notificationTemplates?.length) {
                req.body.notificationTemplates[0].templateId = 'Template-001';
            }
            // if (req.body?.notificationTemplates?.sms?.length) {
            //   req.body.notificationTemplates.sms[0].templateId = 'Template-001';
            // }
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            if (req.body?.notificationTemplates?.length >
                findSettings[0]?.notificationTemplates?.length) {
                let num = req.body.notificationTemplates.length;
                req.body.notificationTemplates[num - 1].templateId =
                    'Template-' + num.toString().padStart(3, '0');
            }
            // if (
            //   req.body?.notificationTemplates?.sms?.length >
            //   findSettings[0].notificationTemplates.sms.length
            // ) {
            //   let num = req.body.notificationTemplates.sms.length;
            //   req.body.notificationTemplates.sms[num - 1].templateId =
            //     'Template-' + num.toString().padStart(3, '0');
            // }
            if (keyword === 'editPaymentsNotificationSettings') {
                const paymentsNoti = await common_util_1.default.checkPermission(keyword, req);
                const authInterval = await common_util_1.default.checkPermission(keyword, req);
                const retryInterval = await common_util_1.default.checkPermission(keyword, req);
                if (!paymentsNoti && req.body.paymentsAuthorizations) {
                    delete req.body.paymentsAuthorizations.failedAuthorizations;
                    delete req.body.paymentsAuthorizations.successfulAuthorizations;
                    delete req.body.paymentsAuthorizations.failedPayments;
                    delete req.body.paymentsAuthorizations.successPayments;
                    delete req.body.paymentsAuthorizations.upcomingPayments;
                }
                if (!retryInterval && req.body.paymentsAuthorizations) {
                    delete req.body.paymentsAuthorizations.retryInterval;
                }
                if (!authInterval && req.body.paymentsAuthorizations) {
                    delete req.body.paymentsAuthorizations.authorizationInterval;
                }
            }
            const mergedSettings = await settings_util_1.default.mergeSettings(findSettings[0], req.body);
            settigns = await this.settingsRepository.updateById(findSettings[0].id, mergedSettings);
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
    async getSettings(templatePermission, paymentsPermission, customFieldsPermission) {
        const findSettings = await this.settingsRepository.getAllWithoutPagination();
        const customFields = await this.customFieldsRepository.getAllWithoutPagination();
        if (!findSettings.length) {
            return [
                true,
                {
                    paymentsAuthorizations: null,
                    notificationTemplates: null,
                    customFields: customFields.length ? customFields : null,
                },
            ];
        }
        return [
            true,
            {
                paymentsAuthorizations: paymentsPermission
                    ? findSettings[0].paymentsAuthorizations
                    : null,
                notificationTemplates: templatePermission
                    ? findSettings[0].notificationTemplates
                    : null,
                customFields: customFieldsPermission ? customFields : null,
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
    async getCustomFieldsByTarget(req) {
        if (!req.query.target)
            return [false, 'Target is missing'];
        const target = String(req.query.target);
        const customFields = await this.customFieldsRepository.getAllWithoutPagination({
            $or: [{ target: target }, { shared: true }],
        }, undefined, undefined, { _id: -1 });
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
        if (!req.query.caseId) {
            return [false, 'Case id is missing'];
        }
        const target = String(req.query.target);
        const customField = await this.customFieldsRepository.getOne({
            $and: [{ target: target }, { name: name }],
        });
        if (!customField) {
            return [false, constants_util_1.default.notFoundMessage('custom field')];
        }
        return await settings_util_1.default.addCustomFieldByTarget(customField, req.body, target, String(req.query.caseId));
    }
    async updateCustomFieldByTarget(req) {
        if (!req.query.target)
            return [false, 'Target is missing'];
        if (!req.query.caseId) {
            return [false, 'Case id is missing'];
        }
        const target = String(req.query.target);
        const updatedCustomFields = req.body.customFields;
        if (!updatedCustomFields || !updatedCustomFields.length)
            return [false, 'CustomFields missing!'];
        // Update the target custom field with the new custom fields array
        const targetCF = await this.targetCFRepository.updateByOne({ target: target, caseId: String(req.query.caseId) }, { $set: { customFields: updatedCustomFields } });
        if (!targetCF) {
            return [false, constants_util_1.default.failureUpdateMessage('custom fields')];
        }
        return [true, targetCF];
    }
    async removeCustomFieldByTarget(req) {
        if (!req.query.target) {
            return [false, 'Target is missing'];
        }
        if (!req.query.caseId) {
            return [false, 'Case id is missing'];
        }
        let targetCF = await this.targetCFRepository.updateByOne({ target: String(req.query.target), caseId: String(req.query.caseId) }, {
            $pull: { customFields: req.body },
        });
        console.log(targetCF);
        if (!targetCF) {
            return [false, constants_util_1.default.notFoundMessage('custom field')];
        }
        return [true, targetCF];
    }
    async deleteCustomField(req) {
        const findCustomField = await this.customFieldsRepository.getById(req.params.id);
        if (!findCustomField) {
            return [false, constants_util_1.default.notFoundMessage('custom field')];
        }
        let findCustomFieldInCase = await this.targetCFRepository.getAllWithoutPagination({
            customFields: { $elemMatch: { name: findCustomField.name } },
        });
        if (findCustomFieldInCase.length) {
            return [
                false,
                'The custom field is currently assigned to a case and cannot be deleted. Please delete it from all cases before deleting',
            ];
        }
        let customField = await this.customFieldsRepository.delete({
            _id: req.params.id,
        });
        if (!customField) {
            return [false, constants_util_1.default.failureDeleteMessage('custom field')];
        }
        return [true, customField];
    }
    async editNotificationTemplate(req) {
        // if (
        //   String(req.query.type) !== 'sms' &&
        //   String(req.query.type) !== 'email'
        // ) {
        //   return [false, 'type is missing'];
        // }
        //const type = String(req.query.type);
        let result = null;
        // switch (type) {
        //   case 'sms':
        result = await this.settingsRepository.updateByOne({ 'notificationTemplates.templateId': req.body.templateId }, {
            $set: {
                'notificationTemplates.$': req.body,
            },
        });
        //  break;
        // case 'email':
        //   result = await this.settingsRepository.updateByOne(
        //     {'notificationTemplates.email.templateId': req.body.templateId},
        //     {
        //       $set: {
        //         'notificationTemplates.email.$': req.body,
        //       },
        //     }
        //   );
        //   break;
        //  }
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('notification template')];
        }
        return [true, result];
    }
    async deleteNotificationTemplate(req) {
        // const type = String(req?.query?.type);
        // if (type !== 'sms' && type !== 'email') {
        //   return [false, 'type is missing'];
        // }
        let result = null;
        const templateId = req.body.templateId;
        // switch (type) {
        //   case 'sms':
        result = await this.settingsRepository.updateByOne({ 'notificationTemplates.templateId': req.body.templateId }, {
            $pull: {
                notificationTemplates: { templateId },
            },
        });
        // break;
        //   case 'email':
        //     result = await this.settingsRepository.updateByOne(
        //       {'notificationTemplates.email.templateId': req.body.templateId},
        //       {
        //         $pull: {
        //           'notificationTemplates.email': {templateId},
        //         },
        //       }
        //     );
        //     break;
        // }
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('notification template')];
        }
        return [true, result];
    }
    async addNotificationConfiguration(req) {
        let result = null, createConfiguration;
        let find = await this.notificationConfigurationRepository.getOne({ value: req.body.value });
        if (!find) {
            const newConfiguration = new notificationConfiguration_repomodel_1.NotificationConfiguration();
            const validatedConfiguration = dataCopier_util_1.DataCopier.copy(newConfiguration, req.body);
            let createConfiguration = await this.notificationConfigurationRepository.create(validatedConfiguration);
            const findSettings = await this.settingsRepository.getAllWithoutPagination();
            result = await this.settingsRepository.updateById(findSettings[0].id, {
                $push: {
                    notificationConfiguration: {
                        value: createConfiguration.value,
                        label: createConfiguration.label,
                        id: createConfiguration.id,
                    },
                },
            });
        }
        else {
            result = await this.notificationConfigurationRepository.updateByOne({ value: req.body.value }, {
                $set: req.body,
            });
        }
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('notification template')];
        }
        return [true, result];
    }
    async getNotificationConfiguration(req) {
        let result = null;
        const type = String(req?.query?.type);
        switch (type) {
            case 'all':
                result =
                    await this.settingsRepository.getAllWithoutPagination();
                result = result[0]?.notificationConfiguration;
                break;
            default:
                result =
                    await this.notificationConfigurationRepository.getOne({ value: type });
        }
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('notification template')];
        }
        return [true, result];
    }
}
exports.default = SettingsService;
//# sourceMappingURL=settings.service.js.map