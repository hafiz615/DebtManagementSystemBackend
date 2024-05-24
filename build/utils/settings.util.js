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
    async addCustomFieldByTarget(customField, body, target) {
        const { name, value } = body;
        let targetCF = null;
        customField.type =
            customField.type === 'Text' ? 'string' : customField.type;
        let valueType = typeof value;
        if (valueType === 'string') {
            const date = new Date(value);
            valueType = !isNaN(date.getTime()) ? 'Date' : valueType;
        }
        if (valueType !== customField.type) {
            return [false, 'Custom field and value type mismatched'];
        }
        switch (target) {
            case 'case':
                const temp = await this.targetCFRepository.getOne({
                    target: target,
                });
                if (!temp) {
                    targetCF = await this.targetCFRepository.create({
                        target: target,
                        customFields: [body],
                        createdAt: common_util_1.default.getCurrentDate(),
                        updatedAt: common_util_1.default.getCurrentDate(),
                    });
                }
                else {
                    targetCF =
                        await this.targetCFRepository.updateByOne({ target: target }, {
                            $addToSet: { customFields: body },
                        });
                }
                break;
        }
        return [true, targetCF];
    }
}
exports.default = new SettingsUtil();
//# sourceMappingURL=settings.util.js.map