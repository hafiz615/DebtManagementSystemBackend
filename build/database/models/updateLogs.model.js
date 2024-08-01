"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Log.ts
const mongoose_1 = require("mongoose");
const logSchema = new mongoose_1.Schema({
    traceId: String,
    previousData: mongoose_1.Schema.Types.Mixed,
    currentData: mongoose_1.Schema.Types.Mixed,
    model: String,
});
const UpdateLog = (0, mongoose_1.model)('UpdateLog', logSchema);
exports.default = UpdateLog;
//# sourceMappingURL=updateLogs.model.js.map