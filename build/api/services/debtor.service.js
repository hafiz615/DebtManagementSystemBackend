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
        const debtor = await this.debtorRepository.getAll({
            $or: [
                {
                    'basicInformation.fullName': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for name
                    },
                },
                {
                    'basicInformation.email': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for email
                    },
                },
                {
                    'basicInformation.SSID': {
                        $regex: new RegExp(text), // Case-insensitive match for SSID
                    },
                },
                {
                    'basicInformation.phone': {
                        $regex: new RegExp(text), // Case-insensitive match for phone
                    },
                },
            ],
        }, undefined, undefined);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async listingDetails(req) {
        const casesCount = await this.caseRepository.getCount({
            debtor: req.params.id,
        });
        const clientDetails = await case_util_1.default.getClientDetails(req);
        if (!clientDetails) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, { ...clientDetails, debtorTotalCases: casesCount }];
    }
    async searchListing(req) {
        const debtorsCount = await this.debtorRepository.getCount();
        const pipeline = await case_util_1.default.getClientListingPipeline(req);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        return [true, { clientDetails: clientDetails, debtorsCount: debtorsCount }];
    }
    async updateDebtor(req) {
        const email = req.body.basicInformation.email.toLowerCase();
        const getDebtor = await this.debtorRepository.getOne({
            $or: [
                {
                    'basicInformation.email': email,
                },
                {
                    'basicInformation.SSID': req.body.basicInformation.SSID,
                },
                {
                    'basicInformation.phone': req.body.basicInformation.phone,
                },
            ],
        });
        console.log(String(getDebtor._id));
        if (getDebtor) {
            if (getDebtor.basicInformation.email === email &&
                String(getDebtor._id) !== req.params.id) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage('Debtor with basicInformation.email'),
                ];
            }
            if (getDebtor.basicInformation.SSID === req.body.basicInformation.SSID &&
                String(getDebtor._id) !== req.params.id) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage('Debtor with basicInformation.SSN'),
                ];
            }
            if (getDebtor.basicInformation.phone === req.body.basicInformation.phone &&
                String(getDebtor._id) !== req.params.id) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage('Debtor with basicInformation.phone'),
                ];
            }
        }
        const debtor = await this.debtorRepository.updateById(req.params.id, req.body);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map