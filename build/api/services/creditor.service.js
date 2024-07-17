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
        let casesCount = 0;
        let page = 1;
        let limit = 5;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        let clientDetails = await case_util_1.default.getCreditorDetails(req);
        if (req.query.filter === 'true' || req.query.search === 'true') {
            casesCount = clientDetails.caseHistory.length;
        }
        else {
            casesCount = await this.caseRepository.getCount({
                creditor: req.params.id,
                isDeleted: false,
            });
        }
        clientDetails.caseHistory = clientDetails.caseHistory.slice((page - 1) * limit, page * limit);
        if (!clientDetails) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, { ...clientDetails, creditorTotalCases: casesCount }];
    }
    async listing(req, keyword) {
        let creditorsCount = 0;
        let page = 1;
        let limit = 10;
        let reqTemp = req;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        let match = { isDeleted: { $ne: true } };
        if (keyword === 'viewCreditorsForSelf') {
            match['$or'] = [
                { caseOwnerId: reqTemp.id },
                { negotiatorId: reqTemp.id },
                { managerId: reqTemp.id },
            ];
        }
        const pipeline = await case_util_1.default.getCreditorListingPipeline(req, match);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        if (req.query.filter === 'true' || req.query.search === 'true') {
            creditorsCount = clientDetails.length;
        }
        else {
            creditorsCount = await this.creditorRepository.getCount();
        }
        const paginatedDetails = clientDetails.slice((page - 1) * limit, page * limit);
        return [
            true,
            { clientDetails: paginatedDetails, creditorsCount: creditorsCount },
        ];
    }
    async updateCreditorAccountTitle(req) {
        const title = String(req.query.title);
        if (!title)
            return [false, 'Title is missing'];
        const creditor = await this.creditorRepository.updateById(req.params.id, { 'businessInformation.accountTitle': title });
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
}
exports.default = CreditorService;
//# sourceMappingURL=creditor.service.js.map