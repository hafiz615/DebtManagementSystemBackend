"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUpload = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class BulkUpload {
    constructor() {
        this.debtor = null;
        this.status = 'Pending';
        this.retries = 0;
        this.driveUrl = '';
        this.errorMessage = '';
        this.createdByName = '';
        this.createdById = '';
        this.caseIds = Array();
        this.time = Array();
        this.debtorAlreadyExisted = false;
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.BulkUpload = BulkUpload;
//# sourceMappingURL=bulkUpload.repomodel.js.map