"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// models/Log.ts
const mongoose_1 = require("mongoose");
const logSchema = new mongoose_1.Schema({
    data: mongoose_1.Schema.Types.Mixed,
    createdAt: { type: Date },
});
const WebhookLog = (0, mongoose_1.model)('webhook', logSchema);
exports.default = WebhookLog;
//# sourceMappingURL=webhook.model.js.map