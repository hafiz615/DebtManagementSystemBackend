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
exports.Case = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const caseModel = new mongoose_1.Schema({
    debtor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: 'Debtors',
    },
    creditor: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: 'Creditors',
    },
    totalDebt: {
        type: Number,
        required: true,
    },
    lastPaymentDate: {
        type: Date,
    },
    paidAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: 'Customer',
    },
    caseOwner: {
        type: String,
    },
    caseOwnerId: {
        type: String,
    },
    negotiator: {
        type: String,
    },
    negotiatorId: {
        type: String,
    },
    manager: {
        type: String,
    },
    managerId: {
        type: String,
    },
    caseCode: {
        type: String,
        required: true,
    },
    remaining: {
        type: Number,
        required: true,
    },
    // documents: {
    //   type: Array<{
    //     key: {type: String; required: true};
    //     originalFileName: {type: String; required: true};
    //     url: {type: String; default: ''};
    //   }>,
    // },
    intervals: {
        type: [
            {
                amount: { type: Number, required: true },
                startDate: { type: Date, required: true },
                frequency: { type: Number, default: 0 },
                timePeriod: { type: String, required: true },
            },
        ],
    },
    contractDetails: {
        type: {},
    },
    isDeleted: {
        type: Boolean,
    },
    confidence: {
        type: Number,
    },
    closeDate: {
        type: Date,
    },
    notes: {
        type: String,
    },
    chatId: {
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
caseModel.pre('findOneAndUpdate', logUpdate);
caseModel.pre('updateMany', logUpdate);
caseModel.pre('updateOne', logUpdate);
caseModel.post('findOneAndUpdate', logUpdatePost);
caseModel.post('updateMany', logUpdatePost);
caseModel.post('updateOne', logUpdatePost);
exports.Case = mongoose_1.default.model('Cases', caseModel);
//# sourceMappingURL=case.model.js.map