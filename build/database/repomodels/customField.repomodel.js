"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetCustomFields = exports.CustomFiled = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class CustomFiled {
    constructor() {
        this.name = '';
        this.type = '';
        this.target = '';
        this.description = '';
        this.shared = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.CustomFiled = CustomFiled;
class TargetCustomFields {
    constructor() {
        this.target = '';
        this.customFields = Array();
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.TargetCustomFields = TargetCustomFields;
//# sourceMappingURL=customField.repomodel.js.map