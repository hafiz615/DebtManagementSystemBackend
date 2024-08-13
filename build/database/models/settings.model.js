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
exports.Settings = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const localStorage_util_1 = __importDefault(require("../../utils/localStorage.util"));
const updateLogs_model_1 = __importDefault(require("./updateLogs.model"));
const settignsModel = new mongoose_1.Schema({
    paymentsAuthorizations: {
        failedAuthorizations: {
            email: {
                type: Boolean,
            },
            sms: {
                type: Boolean,
            },
            smsTemplate: {
                type: String,
            },
            emailTemplate: {
                type: String,
            },
            sendTo: {
                admin: {
                    type: Boolean,
                },
                manager: {
                    type: Boolean,
                },
                negotiator: {
                    type: Boolean,
                },
                debtor: {
                    type: Boolean,
                },
                creditor: {
                    type: Boolean,
                },
            },
        },
        successfulAuthorizations: {
            email: {
                type: Boolean,
            },
            sms: {
                type: Boolean,
            },
            smsTemplate: {
                type: String,
            },
            emailTemplate: {
                type: String,
            },
            sendTo: {
                admin: {
                    type: Boolean,
                },
                manager: {
                    type: Boolean,
                },
                negotiator: {
                    type: Boolean,
                },
                debtor: {
                    type: Boolean,
                },
                creditor: {
                    type: Boolean,
                },
            },
        },
        failedPayments: {
            email: {
                type: Boolean,
            },
            sms: {
                type: Boolean,
            },
            smsTemplate: {
                type: String,
            },
            emailTemplate: {
                type: String,
            },
            sendTo: {
                admin: {
                    type: Boolean,
                },
                manager: {
                    type: Boolean,
                },
                negotiator: {
                    type: Boolean,
                },
                debtor: {
                    type: Boolean,
                },
                creditor: {
                    type: Boolean,
                },
            },
        },
        successPayments: {
            email: {
                type: Boolean,
            },
            sms: {
                type: Boolean,
            },
            smsTemplate: {
                type: String,
            },
            emailTemplate: {
                type: String,
            },
            sendTo: {
                admin: {
                    type: Boolean,
                },
                manager: {
                    type: Boolean,
                },
                negotiator: {
                    type: Boolean,
                },
                debtor: {
                    type: Boolean,
                },
                creditor: {
                    type: Boolean,
                },
            },
        },
        upcomingPayments: {
            email: {
                type: Boolean,
            },
            sms: {
                type: Boolean,
            },
            smsTemplate: {
                type: String,
            },
            emailTemplate: {
                type: String,
            },
            sendTo: {
                admin: {
                    type: Boolean,
                },
                manager: {
                    type: Boolean,
                },
                negotiator: {
                    type: Boolean,
                },
                debtor: {
                    type: Boolean,
                },
                creditor: {
                    type: Boolean,
                },
            },
        },
        retryInterval: {
            failedAuthorization: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
                maxRetry: {
                    type: Number,
                },
            },
            failedPayment: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
                maxRetry: {
                    type: Number,
                },
            },
        },
        authorizationInterval: {
            custom: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
            },
            daily: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
            },
            weekly: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
            },
            fortnightly: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
            },
            monthly: {
                unit: {
                    type: String,
                },
                value: {
                    type: Number,
                },
            },
        },
    },
    notificationTemplates: {
        type: (Array),
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
settignsModel.pre('findOneAndUpdate', logUpdate);
settignsModel.pre('updateMany', logUpdate);
settignsModel.pre('updateOne', logUpdate);
settignsModel.post('findOneAndUpdate', logUpdatePost);
settignsModel.post('updateMany', logUpdatePost);
settignsModel.post('updateOne', logUpdatePost);
exports.Settings = mongoose_1.default.model('Settings', settignsModel);
//# sourceMappingURL=settings.model.js.map