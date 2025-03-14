"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const lawfirm_repository_1 = require("../api/repository/lawfirm/lawfirm.repository");
const lawfirm_repomodel_1 = require("../database/repomodels/lawfirm.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
const common_util_1 = __importDefault(require("./common.util"));
dotenv_1.default.config();
class LawfirmUtil {
    constructor() {
        this.lawfirmRepository = new lawfirm_repository_1.LawfirmRepository();
    }
    async createLawfirm(data) {
        const newLawfirm = new lawfirm_repomodel_1.Lawfirm();
        const validatedLawfirm = dataCopier_util_1.DataCopier.copy(newLawfirm, data);
        return await this.lawfirmRepository.create(validatedLawfirm);
    }
    async upsertLawfirm(data) {
        const newLawfirm = new lawfirm_repomodel_1.Lawfirm();
        const validatedLawfirm = dataCopier_util_1.DataCopier.copy(newLawfirm, data);
        return await this.lawfirmRepository.upsert({ lawfirmCompanyName: data.lawfirmCompanyName }, validatedLawfirm);
    }
    async lawfirmDetails(data) {
        return {
            lawfirmCompanyName: data.result.lawfirmCompanyName,
            email: data.result.email,
            phone: await common_util_1.default.cleanPhoneNumber(data.result.phone),
            address: data.result.address,
            city: data.result.city,
            state: data.result.state,
            EIN: data.result.EIN,
        };
    }
    async lawfirmData(req) {
        return {
            name: req.body['lawfirm.name'],
            email: req.body['lawfirm.email'],
            phone: req.body['lawfirm.phone'],
            address: req.body['lawfirm.address'],
            city: req.body['lawfirm.city'],
            state: req.body['lawfirm.state'],
            status: req.body['lawfirm.status'],
            EIN: req.body['lawfirm.EIN'],
            lawfirmFee: req.body['lawfirm.lawfirmFee'],
            platform: req.body['lawfirm.platform'] === 'true',
        };
    }
}
exports.default = new LawfirmUtil();
//# sourceMappingURL=lawfirm.util.js.map