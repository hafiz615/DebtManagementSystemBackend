"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const serviceFee_repository_1 = require("../api/repository/serviceFee/serviceFee.repository");
const dotenv_1 = __importDefault(require("dotenv"));
const case_repository_1 = require("../api/repository/case/case.repository");
dotenv_1.default.config();
class ServiceFeeUtil {
    constructor() {
        this.serviceFeeRepository = new serviceFee_repository_1.ServiceFeeRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getServiceFeeAmount(caseId) {
        const caseData = await this.caseRepository.getById(caseId, undefined, undefined, ['debtor']);
        if (caseData.debtor?.serviceFee) {
            return caseData.debtor?.serviceFee;
        }
        const serviceFee = await this.serviceFeeRepository.getOne({
            type: 'serviceFee',
        });
        return serviceFee?.fee ?? 0;
    }
    async getFee() {
        const result = await this.serviceFeeRepository.getAllWithoutPagination({});
        let feeObj = {};
        for (const fee of result) {
            feeObj[fee.type] = fee.fee;
        }
        return Object.keys(feeObj).length ? [true, feeObj] : [true, null];
    }
}
exports.default = new ServiceFeeUtil();
//# sourceMappingURL=serviceFee.util.js.map