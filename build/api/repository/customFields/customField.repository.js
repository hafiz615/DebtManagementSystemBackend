"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomFieldsRepository = void 0;
const customField_model_1 = require("../../../database/models/customField.model");
const base_repository_1 = require("../base.repository");
class CustomFieldsRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(customField_model_1.CustomFiled);
    }
}
exports.CustomFieldsRepository = CustomFieldsRepository;
//# sourceMappingURL=customField.repository.js.map