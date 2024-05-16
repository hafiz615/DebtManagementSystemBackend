"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
class DebtorService {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getDebtor(text) {
        const debtor = await this.debtorRepository.getOne({
            $or: [
                {
                    'basicInformation.email': text.toLowerCase(),
                },
                {
                    'basicInformation.SSID': text,
                },
                {
                    'basicInformation.phone': text,
                },
            ],
        }, undefined, undefined, ['contacts']);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async listingDetails(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        const cases = await this.caseRepository.getAll({ debtor: req.params.id }, undefined, undefined, undefined, ['debtor', { path: 'creditor', select: ['basicInformation.fullName'] }], undefined, Number(req.query.page), Number(req.query.limit));
        const clientDetails = await case_util_1.default.getClientDetails(cases);
        return [true, { debtor: debtor.basicInformation, ...clientDetails }];
    }
    async searchListing(req) {
        const pipeline = await case_util_1.default.getClientListingPipeline(req);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        return [true, clientDetails];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map