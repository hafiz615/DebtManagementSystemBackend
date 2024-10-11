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
exports.Debtor = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const uuid_1 = require("uuid");
const debtorSchema = new mongoose_1.Schema({
    basicInformation: {
        fullName: {
            type: String,
        },
        email: {
            type: String,
        },
        SSID: {
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
        },
        phone: {
            type: String,
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
        },
        EIN: {
            type: String,
        },
        businessCategory: {
            type: String,
        },
        description: {
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
        },
        address: {
            type: String,
        },
    },
    contacts: {
        type: [
            {
                name: String,
                title: String,
                phone: String,
                email: String,
                relationWithDebtor: String,
                state: String,
                city: String,
                zipCode: String,
            },
        ],
    },
    documents: {
        type: (Array),
    },
    accounts: {
        type: (Array),
    },
    // paymentType: {
    //   type: String,
    // },
    createdBy: {
        type: String,
    },
    // customerVaultId: {
    //   type: String,
    // },
    extractedFields: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    totalCommission: {
        type: Number,
        select: false,
    },
    commissionPercentage: {
        type: Number,
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
    logTrackingId: {
        type: String,
    },
    bulkUpload: {
        type: Boolean,
    },
    weeklyBudgetUpdated: {
        type: Boolean,
    },
    emailKey: {
        type: String,
    },
    strategy1MaxProfit: {
        type: Number,
    },
    strategy3MaxProfit: {
        type: Number,
    },
    strategy1BudgetCustom: {
        type: Number,
    },
    strategy3BudgetCustom: {
        type: Number,
    },
    weeklyBudgetKeyStrategy1: {
        type: String,
    },
    weeklyBudgetKeyStrategy3: {
        type: String,
    },
    weeklyBudgetStrategy1: {
        type: Number,
    },
    weeklyBudgetStrategy3: {
        type: Number,
    },
    profitMargin: {
        type: Number,
    },
    moneyThumbAppId: {
        type: Number,
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
debtorSchema.pre('save', async function (next) {
    this.logTrackingId = (0, uuid_1.v4)();
    next();
});
// Middleware for logging updates
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
debtorSchema.pre('findOneAndUpdate', logUpdate);
debtorSchema.pre('updateMany', logUpdate);
debtorSchema.pre('updateOne', logUpdate);
debtorSchema.post('findOneAndUpdate', logUpdatePost);
debtorSchema.post('updateMany', logUpdatePost);
debtorSchema.post('updateOne', logUpdatePost);
exports.Debtor = mongoose_1.default.model('Debtors', debtorSchema);
//# sourceMappingURL=debtor.model.js.map