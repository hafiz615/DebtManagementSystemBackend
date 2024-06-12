"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
class DebtorService {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getDebtor(text) {
        const debtor = await this.debtorRepository.getAll({
            $or: [
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
        });
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
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
        let clientDetails = await case_util_1.default.getClientDetails(req);
        if (req.query.filter === 'true' || req.query.search === 'true') {
            casesCount = clientDetails.caseHistory.length;
        }
        else {
            casesCount = await this.caseRepository.getCount({
                debtor: req.params.id,
            });
        }
        clientDetails.caseHistory = clientDetails.caseHistory.slice((page - 1) * limit, page * limit);
        if (!clientDetails) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, { ...clientDetails, debtorTotalCases: casesCount }];
    }
    async searchListing(req) {
        let debtorsCount = 0;
        let page = 1;
        let limit = 10;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        const pipeline = await case_util_1.default.getClientListingPipeline(req);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        if (req.query.filter === 'true' || req.query.search === 'true') {
            debtorsCount = clientDetails.length;
        }
        else {
            debtorsCount = await this.debtorRepository.getCount();
        }
        const paginatedDetails = clientDetails.slice((page - 1) * limit, page * limit);
        return [
            true,
            { clientDetails: paginatedDetails, debtorsCount: debtorsCount },
        ];
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
        if (req.body.basicInformation.weeklyBudget !==
            getDebtor.basicInformation.weeklyBudget) {
            const response = await case_util_1.default.checkWeeklyBudget({ debtor: req.body }, true, getDebtor);
            if (!response.status) {
                return [
                    false,
                    'Weekly budget is not fulfiling the payment plan of debtor',
                ];
            }
            req.body.weeklyCommission = response.commission;
        }
        req.body;
        const debtor = await this.debtorRepository.updateById(req.params.id, req.body);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async createVault(paymentToken, id, paymentType) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            customer_vault: 'add_customer',
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            payment_token: paymentToken,
        };
        const response = await axios_1.default.get(url, { params });
        const responseNum = new url_1.URLSearchParams(response.data).get('response');
        if (responseNum === '1') {
            const customerVault = new url_1.URLSearchParams(response.data).get('customer_vault_id');
            const debtor = await this.debtorRepository.updateById(id, {
                customerVaultId: customerVault,
                paymentType: paymentType,
            });
            return [true, debtor];
        }
        return [false, 'Unable to create customer vault'];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map