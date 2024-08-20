"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const uuid_1 = require("uuid");
const userModel = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },
    verifyToken: {
        type: String,
        select: false,
    },
    password: {
        type: String,
        select: false,
    },
    role: {
        type: String,
        required: true,
    },
    isActive: { type: Boolean },
    createdBy: { type: String },
    SSID: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    phone: {
        type: String,
    },
    gender: {
        type: String,
    },
    address: {
        type: String,
    },
    sessionIds: {
        type: (Array),
        select: false,
    },
    logTrackingId: {
        type: String,
    },
    isDeleted: { type: Boolean },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },
});
userModel.index({ _id: 1, email: 1 });
userModel.pre('save', async function (next) {
    this.logTrackingId = (0, uuid_1.v4)();
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        this.password = await common_util_1.default.hashPassword(String(this.password));
        next();
    }
    catch (err) {
        console.log('Something went wrong while hashing passowrd', err);
        next(err);
    }
});
const logUpdate = async function (next) {
    const query = this.getQuery();
    const update = this.getUpdate();
    // Retrieve the document before update
    const previousDoc = await this.model.findOne(query);
    this.previousDoc = previousDoc;
    next();
};
const logUpdatePost = async function (doc) {
    let traceId = '', ip = '', userId = '', url = '', method = '';
    const store = localStorage_util_1.default.getStore();
    if (store) {
        if (store.get('traceId'))
            traceId = store.get('traceId');
        if (store.get('ip'))
            ip = store.get('ip');
        if (store.get('userId'))
            userId = store.get('userId');
        if (store.get('url'))
            url = store.get('url');
        if (store.get('method'))
            method = store.get('method');
    }
    const previousDoc = this.previousDoc;
    const logEntry = new updateLogs_model_1.default({
        traceId,
        previousData: previousDoc,
        currentData: doc,
        model: this.model.modelName,
        logTrackingId: previousDoc?.logTrackingId ?? '',
        ip,
        userId,
        url,
        method,
    });
    logEntry.save().catch(err => {
        console.error('Error saving log entry', err);
    });
};
userModel.pre('findOneAndUpdate', logUpdate);
userModel.pre('updateMany', logUpdate);
userModel.pre('updateOne', logUpdate);
userModel.post('findOneAndUpdate', logUpdatePost);
userModel.post('updateMany', logUpdatePost);
userModel.post('updateOne', logUpdatePost);
exports.User = mongoose_1.default.model('Users', userModel);
//# sourceMappingURL=user.model.js.map