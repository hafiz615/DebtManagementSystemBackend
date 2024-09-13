"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const axiosInstanceInterceptor_1 = __importDefault(require("../../utils/axiosInstanceInterceptor"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
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
                    'basicInformation.fullName': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for email
                    },
                },
                {
                    'basicInformation.phone': {
                        $regex: new RegExp(text),
                    },
                },
                {
                    'businessInformation.companyName': {
                        $regex: new RegExp(text, 'i'),
                    },
                },
            ],
        }, undefined, undefined, { _id: -1 });
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
    async updateCreditor(req) {
        let creditor = null;
        const getCreditor = await this.creditorRepository.getById(req.params.id);
        if (!getCreditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        if (req.body.businessInformation) {
            const alreadyPresent = await this.creditorRepository.getOne({
                _id: { $ne: req.params.id },
                'businessInformation.companyName': req.body.businessInformation.companyName,
            });
            if (alreadyPresent) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage(`Creditor with companyName ${req.body.businessInformation.companyName}`),
                ];
            }
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            creditor = await this.creditorRepository.updateById(req.params.id, req.body);
        }
        if (req.body.contact && req.query.contact === 'add') {
            creditor = await this.creditorRepository.updateById(req.params.id, {
                $push: { contacts: req.body.contact },
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        if (req.body.contact && req.query.contact === 'edit') {
            creditor = await this.creditorRepository.updateByOne({
                _id: req.params.id,
                contacts: { $elemMatch: { _id: req.body.contact._id } },
            }, {
                $set: { 'contacts.$': req.body.contact },
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        // if (req.body.paymentToken && req.body.paymentType) {
        //   const customerVaultResponse = await caseUtil.createVault(
        //     req.body.paymentToken
        //   );
        //   if (!customerVaultResponse[0]) return customerVaultResponse;
        //   creditor = await this.creditorRepository.updateById<ICreditor>(
        //     req.params.id,
        //     {customerVaultId: customerVaultResponse[1]}
        //   );
        // }
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
        // if (req.query.filter === 'true' || req.query.search === 'true') {
        //   casesCount = clientDetails.caseHistory.length;
        // } else {
        //   casesCount = await this.caseRepository.getCount<ICase>({
        //     creditor: req.params.id,
        //     isDeleted: false,
        //   });
        // }
        casesCount = clientDetails.caseHistory.length;
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
        let countFilter = {};
        if (keyword === 'viewCreditorsForSelf') {
            match['$or'] = [
                { caseOwnerId: reqTemp.id },
                { negotiatorId: reqTemp.id },
                { managerId: reqTemp.id },
            ];
            countFilter['$or'] = [
                { caseOwnerId: reqTemp.id },
                { negotiatorId: reqTemp.id },
                { managerId: reqTemp.id },
            ];
        }
        const pipeline = await case_util_1.default.getCreditorListingPipeline(req, match);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        creditorsCount = clientDetails.length;
        // if (req.query.filter === 'true' || req.query.search === 'true') {
        //   creditorsCount = clientDetails.length;
        // } else {
        //   if (keyword === 'viewCreditorsForSelf') {
        //     const cases =
        //       await this.caseRepository.getAllWithoutPagination<ICase>(countFilter);
        //     const setCount = new Set<string>();
        //     for (const caseTemp of cases) {
        //       setCount.add(String(caseTemp.creditor));
        //     }
        //     creditorsCount = setCount.size;
        //   } else {
        //     creditorsCount = await this.creditorRepository.getCount<ICreditor>();
        //   }
        // }
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
        const creditor = await this.creditorRepository.updateById(req.params.id, { accountTitle: title, updatedAt: common_util_1.default.getCurrentDate() });
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
    async createVault(paymentToken, id, paymentType) {
        const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
        const params = {
            customer_vault: 'add_customer',
            security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
            payment_token: paymentToken,
        };
        const response = await axiosInstanceInterceptor_1.default.get(url, { params });
        const responseNum = new URLSearchParams(response.data).get('response');
        if (responseNum === '1') {
            const customerVault = new URLSearchParams(response.data).get('customer_vault_id');
            const creditor = await this.creditorRepository.updateById(id, {
                customerVaultId: customerVault,
                paymentType: paymentType,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            return [true, creditor];
        }
        return [false, 'Unable to create customer vault'];
    }
    async updateMultipleCreditors(req) {
        const cases = req.body.cases;
        const result = [];
        const createCases = [];
        for (const tempCase of cases) {
            if (!tempCase?.creditor?._id) {
                createCases.push(tempCase);
                continue;
            }
            tempCase.creditor.updatedAt = common_util_1.default.getCurrentDate();
            const updatedCreditor = await this.creditorRepository.updateById(tempCase.creditor._id, tempCase.creditor);
            delete tempCase.creditor;
            let caseUpdated = await this.caseRepository.updateById(tempCase._id, tempCase);
            if (updatedCreditor && caseUpdated)
                result.push(true);
        }
        if (createCases.length) {
            const reqTemp = req;
            case_util_1.default.createCreditorsCasesFromExtraction(createCases, reqTemp.name, reqTemp.id, req.params.id);
        }
        if (!result.length && !createCases.length)
            return [false, constants_util_1.default.failureUpdateMessage('cases and creditors')];
        return [true, constants_util_1.default.successUpdateMessage('Creditors and cases')];
    }
}
exports.default = CreditorService;
//# sourceMappingURL=creditor.service.js.map