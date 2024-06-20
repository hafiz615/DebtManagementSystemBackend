"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enum = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Enum {
    constructor() {
        this.enumTarget = '';
        this.enumList = Array();
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Enum = Enum;
//# sourceMappingURL=enum.repomodel.js.map