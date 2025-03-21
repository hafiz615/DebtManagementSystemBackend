"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const attorney_repository_1 = require("../api/repository/attorney/attorney.repository");
const attorney_repomodel_1 = require("../database/repomodels/attorney.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
dotenv_1.default.config();
class AttorneyUtil {
    constructor() {
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
    }
    async createAttorney(data) {
        const newattorney = new attorney_repomodel_1.Attorney();
        const validatedattorney = dataCopier_util_1.DataCopier.copy(newattorney, data);
        return await this.attorneyRepository.create(validatedattorney);
    }
    async upsertAttorney(data) {
        const newattorney = new attorney_repomodel_1.Attorney();
        const validatedattorney = dataCopier_util_1.DataCopier.copy(newattorney, data);
        return await this.attorneyRepository.upsert({ phone: data.phone }, validatedattorney);
    }
    async attorneyData(req) {
        return {
            name: req.body['attorney.name'],
            email: req.body['attorney.email'],
            phone: req.body['attorney.phone'],
            address: req.body['attorney.address'],
            city: req.body['attorney.city'],
            state: req.body['attorney.state'],
            SSN: req.body['attorney.SSN'],
            status: req.body['attorney.status'],
            attorneyFee: req.body['attorney.attorneyFee'],
            platform: req.body['attorney.platform'] === 'true',
        };
    }
}
exports.default = new AttorneyUtil();
//# sourceMappingURL=attorney.util.js.map