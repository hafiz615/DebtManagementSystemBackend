"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsRepository = void 0;
const settings_model_1 = require("../../../database/models/settings.model");
const base_repository_1 = require("../base.repository");
class SettingsRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(settings_model_1.Settings);
    }
}
exports.SettingsRepository = SettingsRepository;
//# sourceMappingURL=settings.repository.js.map