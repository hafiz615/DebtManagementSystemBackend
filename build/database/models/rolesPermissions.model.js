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
exports.RolesPermissions = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const rolesPermissionsModel = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    createdBy: {
        type: String,
    },
    generalPermissions: {
        createNewCase: {
            type: Boolean,
        },
        importBulkCases: {
            type: Boolean,
        },
        viewUserListing: {
            type: Boolean,
        },
        addNewUser: {
            type: Boolean,
        },
        deleteUser: {
            type: Boolean,
        },
        createAdminUser: {
            type: Boolean,
        },
        viewHomeScreen: {
            type: Boolean,
        },
        viewPaymentsAndAuthorizations: {
            type: Boolean,
        },
        retryPayment: {
            type: Boolean,
        },
        viewCaseDetails: {
            type: Boolean,
        },
        viewClientsForSelf: {
            type: Boolean,
        },
        viewClientsForAllUsers: {
            type: Boolean,
        },
        viewCreditorsForSelf: {
            type: Boolean,
        },
        viewCreditorsForAllUsers: {
            type: Boolean,
        },
    },
    settings: {
        editPaymentsNotificationSettings: {
            type: Boolean,
        },
        editAuthorizationInterval: {
            type: Boolean,
        },
        editRetryInterval: {
            type: Boolean,
        },
        viewNotificationTemplates: {
            type: Boolean,
        },
        viewCustomFields: {
            type: Boolean,
        },
        addNotificationTemplate: {
            type: Boolean,
        },
        editNotificationTemplate: {
            type: Boolean,
        },
        addCustomFields: {
            type: Boolean,
        },
        deleteNotificationTemplate: {
            type: Boolean,
        },
        editCustomFields: {
            type: Boolean,
        },
        deleteCustomFields: {
            type: Boolean,
        },
        viewCaseStatuses: {
            type: Boolean,
        },
        addCaseStatus: {
            type: Boolean,
        },
        editCaseStatus: {
            type: Boolean,
        },
        deleteCaseStatus: {
            type: Boolean,
        },
        viewPipeline: {
            type: Boolean,
        },
        createPipeline: {
            type: Boolean,
        },
        editPipeline: {
            type: Boolean,
        },
        deletePipeline: {
            type: Boolean,
        },
    },
    analytics: {
        viewAnalyticsForSelf: {
            type: Boolean,
        },
        viewAnalyticsForAllusers: {
            type: Boolean,
        },
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
exports.RolesPermissions = mongoose_1.default.model('RolesPermissions', rolesPermissionsModel);
//# sourceMappingURL=rolesPermissions.model.js.map