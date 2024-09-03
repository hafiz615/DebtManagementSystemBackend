"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Justification = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Justification {
    constructor() {
        this.gemini = false;
        this.llama = false;
        this.chatGpt = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Justification = Justification;
//# sourceMappingURL=justification.repomodel.js.map