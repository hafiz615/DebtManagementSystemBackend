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
exports.Creditor = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const creditorModel = new mongoose_1.Schema({
    basicInformation: {
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
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
        type: [
            {
                name: String,
                title: String,
                phone: String,
                email: String,
                relationWithCreditor: String,
                country: String,
                state: String,
                city: String,
                zipCode: String,
            },
        ],
    },
    notes: {
        type: String,
    },
    lastFundedDate: {
        type: Date,
        required: false,
    },
    historicalRange: {
        minimum: {
            type: Number,
            required: false,
        },
        maximum: {
            type: Number,
            required: true,
        },
    },
    creditorSecurityKey: {
        type: String,
    },
    accountTitle: {
        type: String,
    },
    accountTitleMapping: {
        type: (Array),
    },
    paymentType: {
        type: String,
    },
    customerVaultId: {
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
    aggression: {
        type: Number,
    },
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
    let traceId = '';
    const store = localStorage_util_1.default.getStore();
    if (store) {
        traceId = store.get('traceId');
    }
    const previousDoc = this.previousDoc;
    const logEntry = new updateLogs_model_1.default({
        traceId: traceId,
        previousData: previousDoc,
        currentData: doc,
        model: this.model.modelName,
    });
    logEntry.save().catch(err => {
        console.error('Error saving log entry', err);
    });
};
creditorModel.pre('findOneAndUpdate', logUpdate);
creditorModel.pre('updateMany', logUpdate);
creditorModel.pre('updateOne', logUpdate);
creditorModel.post('findOneAndUpdate', logUpdatePost);
creditorModel.post('updateMany', logUpdatePost);
creditorModel.post('updateOne', logUpdatePost);
exports.Creditor = mongoose_1.default.model('Creditors', creditorModel);
//# sourceMappingURL=creditor.model.js.map