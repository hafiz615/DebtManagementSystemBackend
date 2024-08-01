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
exports.Contact = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const contactModel = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        // unique: true,
    },
    email: {
        type: String,
        // unique: true,
        required: true,
    },
    relationWithDebtor: {
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
contactModel.pre('findOneAndUpdate', logUpdate);
contactModel.pre('updateMany', logUpdate);
contactModel.pre('updateOne', logUpdate);
contactModel.post('findOneAndUpdate', logUpdatePost);
contactModel.post('updateMany', logUpdatePost);
contactModel.post('updateOne', logUpdatePost);
exports.Contact = mongoose_1.default.model('Contacts', contactModel);
//# sourceMappingURL=contact.model.js.map