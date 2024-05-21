"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const settings_repository_1 = require("../repository/setting/settings.repository");
const settings_repomodel_1 = require("../../database/repomodels/settings.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
class SettingsService {
    constructor() {
        this.settingsRepository = new settings_repository_1.SettingsRepository();
    }
    async addSettings(req) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAll({});
        if (!findSettings) {
            const newSettings = new settings_repomodel_1.Settings();
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            settigns = await this.settingsRepository.updateById(findSettings[0].id, {
                ...req.body,
            });
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
    async addCustomFields(req) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAll({});
        if (!findSettings) {
            const newSettings = new settings_repomodel_1.Settings();
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            settigns = await this.settingsRepository.updateById(findSettings[0].id, {
                ...req.body,
            });
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
    async editCustomFields(req) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAll({});
        if (!findSettings) {
            const newSettings = new settings_repomodel_1.Settings();
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            settigns = await this.settingsRepository.updateById(findSettings[0].id, {
                ...req.body,
            });
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
    async getCustomFields(req) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAll({});
        if (!findSettings) {
            const newSettings = new settings_repomodel_1.Settings();
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            settigns = await this.settingsRepository.updateById(findSettings[0].id, {
                ...req.body,
            });
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
    async deleteCustomField(req) {
        let settigns = null;
        const findSettings = await this.settingsRepository.getAll({});
        if (!findSettings) {
            const newSettings = new settings_repomodel_1.Settings();
            const validatedSettings = dataCopier_util_1.DataCopier.copy(newSettings, req.body);
            settigns =
                await this.settingsRepository.create(validatedSettings);
        }
        else {
            settigns = await this.settingsRepository.updateById(findSettings[0].id, {
                ...req.body,
            });
        }
        if (!settigns) {
            return [false, constants_util_1.default.failureUpdateMessage('settings')];
        }
        return [true, settigns];
    }
}
exports.default = SettingsService;
//# sourceMappingURL=settings.service.js.map