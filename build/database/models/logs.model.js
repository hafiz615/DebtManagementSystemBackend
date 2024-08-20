"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Log.ts
const mongoose_1 = require("mongoose");
const logSchema = new mongoose_1.Schema({
    traceId: String,
    ip: String,
    url: String,
    method: String,
    requestPayload: mongoose_1.Schema.Types.Mixed,
    responsePayload: mongoose_1.Schema.Types.Mixed,
    responseStatus: Number,
    userId: String,
    timeTaken: Number,
    calledAt: { type: Date },
});
const Log = (0, mongoose_1.model)('Log', logSchema);
exports.default = Log;
//# sourceMappingURL=logs.model.js.map