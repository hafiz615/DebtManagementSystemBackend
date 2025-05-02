"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// utils/axiosLogger.ts
const axios_1 = __importDefault(require("axios"));
const logs_model_1 = __importDefault(require("../database/models/logs.model"));
const axiosInstance = axios_1.default.create();
axiosInstance.interceptors.request.use(async (config) => {
    const { url, method, data, params } = config;
    const userId = config.headers.userId; // Assuming userId is passed in headers
    config.metadata = { startTime: new Date() };
    const logEntry = new logs_model_1.default({
        url,
        method,
        requestPayload: data || params,
        responsePayload: null,
        responseStatus: null,
        userId,
        timeTaken: null,
        calledAt: new Date(),
    });
    config.metadata.logEntry = logEntry;
    return config;
}, error => {
    return Promise.reject(error);
});
axiosInstance.interceptors.response.use(async (response) => {
    const config = response.config;
    const { data, status } = response;
    const endTime = new Date();
    const timeTaken = endTime.getTime() - (config.metadata?.startTime?.getTime() || 0);
    const logEntry = config.metadata?.logEntry;
    if (logEntry) {
        logEntry.responsePayload = data;
        logEntry.responseStatus = status;
        logEntry.timeTaken = timeTaken;
        await logEntry.save();
    }
    return response;
}, async (error) => {
    const config = error.config;
    if (config && config.metadata?.logEntry) {
        const endTime = new Date();
        const timeTaken = endTime.getTime() - (config.metadata.startTime?.getTime() || 0);
        const logEntry = config.metadata.logEntry;
        logEntry.responsePayload = error.response?.data;
        logEntry.responseStatus = error.response?.status;
        logEntry.timeTaken = timeTaken;
        await logEntry.save();
    }
    return Promise.reject(error);
});
exports.default = axiosInstance;
//# sourceMappingURL=axiosInstanceInterceptor.js.map