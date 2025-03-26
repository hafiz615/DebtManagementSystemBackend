"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Log.ts
const mongoose_1 = require("mongoose");
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
    createdAt: { type: Date },
});
const PaymentLog = (0, mongoose_1.model)('PaymentLog', logSchema);
exports.default = PaymentLog;
//# sourceMappingURL=paymentLogs.model.js.map