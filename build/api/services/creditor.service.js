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
const bulkUpload_repository_1 = require("../repository/bulkUpload/bulkUpload.repository");
const bulkUpload_repomodel_1 = require("../../database/repomodels/bulkUpload.repomodel");
const paynote_util_1 = __importDefault(require("../../utils/paynote.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const syncCreditor_repository_1 = require("../repository/syncCreditor/syncCreditor.repository");
const debtor_util_1 = __importDefault(require("../../utils/debtor.util"));
dotenv_1.default.config();
class CreditorService {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.bulkUploadRepository = new bulkUpload_repository_1.BulkUploadRepository();
        this.syncCreditorRepository = new syncCreditor_repository_1.SyncCreditorRepository();
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
        const url = process.env.seamlesschexMerchantUrl;
        const params = {
            customer_vault: 'add_customer',
            security_key: process.env.seamlesschexMerchantSecurityKey,
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
        const bulkId = String(req.query.bulk);
        if (bulkId !== 'undefined') {
            const bulkDoc = await this.bulkUploadRepository.getById(bulkId);
            const caseIds = bulkDoc.caseIds;
            const bulkUploads = [];
            for (const caseId of caseIds) {
                const newBulkUpload = new bulkUpload_repomodel_1.BulkUpload();
                newBulkUpload.driveUrl = bulkDoc.driveUrl;
                newBulkUpload.debtor = bulkDoc.debtor;
                newBulkUpload.status = 'Success';
                newBulkUpload.createdByName = bulkDoc.createdByName;
                newBulkUpload.createdById = bulkDoc.createdById;
                newBulkUpload.caseIds = [caseId];
                newBulkUpload.time = [new Date(common_util_1.default.getCurrentDate())];
                newBulkUpload.retries = bulkDoc.retries;
                bulkUploads.push(newBulkUpload);
            }
            await this.bulkUploadRepository.updateById(bulkDoc._id, {
                status: 'Moved to Success',
            });
            await this.bulkUploadRepository.createMany(bulkUploads);
        }
        return [true, constants_util_1.default.successUpdateMessage('Creditors and cases')];
    }
    async createPaynoteCustomer(req) {
        const creditor = await this.creditorRepository.getById(req.params.id);
        if (!creditor)
            return [false, constants_util_1.default.notFoundMessage('creditor')];
        const result = await paynote_util_1.default.createCustomer(creditor);
        console.log(result);
        if (result.error) {
            let message = '';
            if (result?.messages) {
                message = result.messages[0];
            }
            else {
                message = result.message;
            }
            return [false, message];
        }
        if (result?.success)
            await this.creditorRepository.updateById(creditor._id, {
                paynoteUserId: result.user.user_id,
            });
        return [true, 'Customer added successfully'];
    }
    async pausePayments(req) {
        if (req.query.pause !== 'true' && req.query.pause !== 'false') {
            return [false, 'Query param missing!'];
        }
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('creditor')];
        const updateCase = await this.caseRepository.updateById(req.params.id, {
            creditorPaymentsProceed: req.query.pause,
        });
        if (!updateCase)
            return [false, constants_util_1.default.failureUpdateMessage('payments')];
        const word = req.query.pause === 'true' ? 'resumed' : 'paused';
        return [true, `Funds transfer ${word} successfully`];
    }
    async syncPaynoteCreditor(req) {
        const creditor = await this.creditorRepository.getById(req.params.id);
        if (!creditor)
            return [false, constants_util_1.default.notFoundMessage('creditor')];
        const email = req.body.email.toLowerCase();
        let page = 1;
        let limit = 100;
        const result = await paynote_util_1.default.getAllCustomerDetails(page, limit);
        if (result?.error) {
            let message = await paynote_util_1.default.getPaynoteErrorMessage(result);
            return [false, message];
        }
        const resultSync = await paynote_util_1.default.processSyncCreditorPaynote(result.list.data, email);
        if (resultSync[0]) {
            await paynote_util_1.default.updateSyncCreditorObject(resultSync[1], req.params.id);
            await paynote_util_1.default.upsertCreditorPaynoteEmail(req.params.id, email);
            return resultSync;
        }
        const lastPage = result.list.last_page;
        if (lastPage === page) {
            await paynote_util_1.default.updateSyncCreditorObject(resultSync[1], req.params.id);
            return resultSync;
        }
        let returnValue = null;
        if (lastPage > page) {
            for (let i = page + 1; i <= lastPage; i++) {
                const result = await paynote_util_1.default.getAllCustomerDetails(i, limit);
                if (result?.error) {
                    let message = await paynote_util_1.default.getPaynoteErrorMessage(result);
                    return [false, message];
                }
                const resultSync = await paynote_util_1.default.processSyncCreditorPaynote(result.list.data, email);
                if (resultSync[0]) {
                    await paynote_util_1.default.updateSyncCreditorObject(resultSync[1], req.params.id);
                    await paynote_util_1.default.upsertCreditorPaynoteEmail(req.params.id, email);
                    return resultSync;
                }
                if (!resultSync[0] && i === lastPage) {
                    await paynote_util_1.default.updateSyncCreditorObject(resultSync[1], req.params.id);
                    returnValue = [false, 'Could not found user in paynote'];
                }
            }
            return returnValue;
        }
    }
    async getCreditorSyncEmail(req) {
        const creditor = await this.creditorRepository.getById(req.params.id);
        if (!creditor)
            return [false, constants_util_1.default.notFoundMessage('creditor')];
        const result = await this.syncCreditorRepository.getOne({
            creditorId: req.params.id,
        });
        if (!result)
            return [true, creditor.basicInformation.email];
        return [true, result.email];
    }
    async mcaByMonth(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const scoreCard = await debtor_util_1.default.getScoreCard(caseTemp.debtor);
        const monthlyMca = scoreCard.scoreCard['monthlymca'];
        if (!monthlyMca.data.length)
            return [false, constants_util_1.default.notFoundMessage('monthly mca')];
        const groupedByMonth = monthlyMca.data.reduce((acc, item) => {
            if (!acc[item.month]) {
                acc[item.month] = [];
            }
            acc[item.month].push(item);
            return acc;
        }, {});
        return [true, groupedByMonth];
    }
}
exports.default = CreditorService;
//# sourceMappingURL=creditor.service.js.map