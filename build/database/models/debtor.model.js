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
exports.Debtor = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const debtorModel = new mongoose_1.Schema({
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
        SSID: {
            type: String,
            required: true,
            unique: true,
        },
        country: {
            type: String,
        },
        state: {
            type: String,
        },
        city: {
            type: String,
        },
        zipCode: {
            type: String,
        },
        status: {
            type: String,
            enum: ['Customer', 'On hold', 'Canceled', 'Declared Bankrupcy'],
        },
        phone: {
            type: String,
            required: true,
            unique: true,
        },
        address: {
            type: String,
        },
        weeklyBudget: {
            type: Number,
        },
    },
    businessInformation: {
        companyName: {
            type: String,
            required: true,
        },
        EIN: {
            type: String,
            required: true,
        },
        businessCategory: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        country: {
            type: String,
        },
        state: {
            type: String,
        },
        city: {
            type: String,
        },
        zipCode: {
            type: String,
        },
        phone: {
            type: String,
            unique: true,
        },
        address: {
            type: String,
        },
    },
    contacts: {
        type: (Array),
    },
    documents: {
        type: (Array),
    },
    paymentType: {
        type: String,
    },
    customerVaultId: {
        type: String,
    },
    totalCommission: {
        type: Number,
        select: false,
    },
    commissionPaid: {
        type: Number,
        select: false,
    },
    weeklyCommission: {
        type: Number,
        select: false,
    },
    weeklyCommissionPaid: {
        type: Boolean,
        select: false,
    },
    weeklyCommissionDate: {
        type: Date,
        select: false,
    },
    commissionPaymentId: {
        type: String,
        // ref: 'Payments',
        select: false,
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
exports.Debtor = mongoose_1.default.model('Debtors', debtorModel);
//# sourceMappingURL=debtor.model.js.map