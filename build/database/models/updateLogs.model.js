"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/Log.ts
const mongoose_1 = require("mongoose");
const common_util_1 = __importDefault(require("../../utils/common.util"));
const logSchema = new mongoose_1.Schema({
    traceId: String,
    previousData: mongoose_1.Schema.Types.Mixed,
    currentData: mongoose_1.Schema.Types.Mixed,
    model: String,
    logTrackingId: String,
    ip: String,
    userId: String,
    url: String,
    method: String,
    createdAt: { type: Date, default: common_util_1.default.getCurrentDate() },
});
const UpdateLog = (0, mongoose_1.model)('UpdateLog', logSchema);
exports.default = UpdateLog;
//# sourceMappingURL=updateLogs.model.js.map