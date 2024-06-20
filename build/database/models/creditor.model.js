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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Creditor = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const creditorModel = new mongoose_1.Schema({
    basicInformation: {
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
    },
    businessInformation: {
        companyName: {
            type: String,
            required: true,
        },
        businessCategory: {
            type: String,
            required: true,
        },
    },
    contacts: {
        type: (Array),
    },
    notes: {
        type: String,
    },
    lastFundedDate: {
        type: Date,
        required: true,
    },
    historicalRange: {
        minimum: {
            type: Number,
            required: true,
        },
        maximum: {
            type: Number,
            required: true,
        },
    },
    creditorSecurityKey: {
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
exports.Creditor = mongoose_1.default.model('Creditors', creditorModel);
//# sourceMappingURL=creditor.model.js.map