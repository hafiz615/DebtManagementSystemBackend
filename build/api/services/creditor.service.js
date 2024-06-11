"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
class CreditorService {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getCreditor(text) {
        const creditor = await this.creditorRepository.getAll({
            $or: [
                {
                    'basicInformation.email': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for email
                    },
                },
                {
                    'basicInformation.phone': {
                        $regex: new RegExp(text),
                    },
                },
            ],
        });
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
    async updateCreditor(req) {
        const email = req.body.basicInformation.email.toLowerCase();
        const getCreditor = await this.creditorRepository.getOne({
            $or: [
                {
                    'basicInformation.email': email,
                },
                {
                    'basicInformation.phone': req.body.basicInformation.phone,
                },
            ],
        });
        if (getCreditor) {
            if (getCreditor.basicInformation.email === email &&
                String(getCreditor._id) !== req.params.id) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage('Creditor with basicInformation.email'),
                ];
            }
            if (getCreditor.basicInformation.phone ===
                req.body.basicInformation.phone &&
                String(getCreditor._id) !== req.params.id) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage('Creditor with basicInformation.phone'),
                ];
            }
        }
        const creditor = await this.creditorRepository.updateById(req.params.id, { ...req.body });
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
    async listingDetails(req) {
        const casesCount = await this.caseRepository.getCount({
            creditor: req.params.id,
        });
        const clientDetails = await case_util_1.default.getCreditorDetails(req);
        if (!clientDetails) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, { ...clientDetails, creditorTotalCases: casesCount }];
    }
    async listing(req) {
        const creditorsCount = await this.creditorRepository.getCount();
        const pipeline = await case_util_1.default.getCreditorListingPipeline(req);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        return [
            true,
            { clientDetails: clientDetails, creditorsCount: creditorsCount },
        ];
    }
}
exports.default = CreditorService;
//# sourceMappingURL=creditor.service.js.map