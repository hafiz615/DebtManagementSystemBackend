"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logs_model_1 = __importDefault(require("../database/models/logs.model"));
const common_util_1 = __importDefault(require("../utils/common.util"));
const localStorage_util_1 = __importDefault(require("../utils/localStorage.util"));
const bson_1 = require("bson");
const logMiddleware = (req, res, next) => {
    const start = new Date(common_util_1.default.getCurrentDate()).getTime();
    // Capture the original send function
    const originalSend = res.send;
    let logCreated = false;
    // Override the send function to capture the response payload
    res.send = function (body) {
        if (!logCreated) {
            const end = new Date(common_util_1.default.getCurrentDate()).getTime();
            const timeTaken = end - start;
            // Convert response body to JSON if it is not already an object
            let responsePayload = null;
            try {
                responsePayload = JSON.parse(body);
                const estimatedSize = bson_1.BSON.serialize(responsePayload).length;
            }
            catch (error) {
                // responsePayload = body;
                responsePayload = null;
            }
            const store = localStorage_util_1.default.getStore();
            let traceId = '';
            if (store) {
                traceId = store.get('traceId');
            }
            const logEntry = new logs_model_1.default({
                traceId: traceId,
                ip: req.ip,
                url: req.originalUrl,
                method: req.method,
                requestPayload: req.body,
                responsePayload,
                responseStatus: res.statusCode,
                userId: req.id, // Assuming userId is attached to req object
                timeTaken,
                calledAt: start,
            });
            logEntry.save().catch(err => {
                console.error('Error saving log entry', err);
            });
            logCreated = true;
        }
        // Call the original send function with the response data and return the response object
        return originalSend.call(this, body);
    };
    next();
};
exports.default = logMiddleware;
//# sourceMappingURL=logs.middleware.js.map