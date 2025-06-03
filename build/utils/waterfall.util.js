"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const waterfall_repository_1 = require("../api/repository/waterfall/waterfall.repository");
const common_util_1 = __importDefault(require("./common.util"));
class WaterfallUtil {
    constructor() {
        this.waterfallRepository = new waterfall_repository_1.WaterfallRepository();
    }
    async upsertWaterfall(debtorId, paymentId, execute) {
        return await this.waterfallRepository.upsert({ debtorId, paymentId }, {
            execute: execute,
            $setOnInsert: { createdAt: common_util_1.default.getCurrentDate() },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
    }
}
exports.default = new WaterfallUtil();
//# sourceMappingURL=waterfall.util.js.map