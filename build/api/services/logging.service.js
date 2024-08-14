"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const updateLogs_model_1 = __importDefault(require("../../database/models/updateLogs.model"));
const logs_model_1 = __importDefault(require("../../database/models/logs.model"));
class LoggingService {
    async getLogsByTraceId(req) {
        const updateLogs = await updateLogs_model_1.default.find({ traceId: req.params.id });
        const traceLogs = await logs_model_1.default.find({ traceId: req.params.id });
        const allLogs = [...traceLogs, ...updateLogs];
        if (!allLogs.length) {
            return [false, constants_util_1.default.notFoundMessage('logs')];
        }
        return [true, allLogs];
    }
    async getLogsByTrackingId(req) {
        const updateLogs = await updateLogs_model_1.default.find({ logTrackingId: req.params.id });
        if (!updateLogs.length) {
            return [false, constants_util_1.default.notFoundMessage('logs')];
        }
        return [true, updateLogs];
    }
}
exports.default = LoggingService;
//# sourceMappingURL=logging.service.js.map