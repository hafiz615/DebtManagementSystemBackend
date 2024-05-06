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
    jwtToken: {
        type: String,
        select: false,
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
exports.User = mongoose_1.default.model('Users', userModel);
//# sourceMappingURL=user.model.js.map