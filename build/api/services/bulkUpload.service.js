"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bulkUpload_repository_1 = require("../repository/bulkUpload/bulkUpload.repository");
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const case_repository_1 = require("../repository/case/case.repository");
class BulkUploadService {
    constructor() {
        this.getBulkUploadAnalytics = async (req) => {
            const filter = {};
            let arrayName = '';
            arrayName = String(req.query.array);
            if (arrayName === 'undefined' || !arrayName)
                arrayName = 'default';
            let failedBulkUploads = [];
            let successBulkUploads = [];
            let pendingBulkUploads = [];
            let arBulkUploads = [];
            let pendingBulkUploadsCount = 0;
            let failedBulkUploadsCount = 0;
            let successBulkUploadsCount = 0;
            let arBulkUploadsCount = 0;
            let page = 1;
            let limit = 5;
            // Check if pageNumber and pageSize are provided and valid
            if (req.query.page && !isNaN(Number(req.query.page))) {
                page = Number(req.query.page) ? Number(req.query.page) : page;
            }
            if (req.query.limit && !isNaN(Number(req.query.limit))) {
                limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
            }
            switch (arrayName) {
                case 'default':
                    pendingBulkUploads =
                        await this.bulkUploadRepository.getAll({ status: 'Pending' }, undefined, undefined, { _id: -1 }, { path: 'debtor', select: ['basicInformation.fullName'] }, undefined, page, limit);
                    pendingBulkUploadsCount =
                        await this.bulkUploadRepository.getCount({
                            status: 'Pending',
                        });
                    failedBulkUploads = await this.bulkUploadRepository.getAll({ $and: [{ retries: { $eq: 2 } }, { status: 'Failed' }] }, undefined, undefined, { _id: -1 }, { path: 'debtor', select: ['basicInformation.fullName'] }, undefined, page, limit);
                    failedBulkUploadsCount =
                        await this.bulkUploadRepository.getCount({
                            $and: [{ retries: { $eq: 2 } }, { status: 'Failed' }],
                        });
                    successBulkUploads =
                        await this.bulkUploadRepository.getAll({ status: 'Success' }, undefined, undefined, { _id: -1 }, { path: 'debtor', select: ['basicInformation.fullName'] }, undefined, page, limit);
                    successBulkUploadsCount =
                        await this.bulkUploadRepository.getCount({
                            status: 'Success',
                        });
                    arBulkUploads = await this.bulkUploadRepository.getAll({ status: 'Action Required' }, undefined, undefined, { _id: -1 }, { path: 'debtor', select: ['basicInformation.fullName'] }, undefined, page, limit);
                    arBulkUploadsCount =
                        await this.bulkUploadRepository.getCount({
                            status: 'Action Required',
                        });
                    const response = {
                        pending: pendingBulkUploads,
                        success: successBulkUploads,
                        failed: failedBulkUploads,
                        actionRequired: arBulkUploads,
                        count: {
                            pending: pendingBulkUploadsCount,
                            success: successBulkUploadsCount,
                            failed: failedBulkUploadsCount,
                            actionRequired: arBulkUploadsCount,
                        },
                    };
                    return [true, response];
                case 'actionRequired':
                    filter['status'] = 'Action Required';
                    break;
                case 'pending':
                    filter['status'] = 'Pending';
                    break;
                case 'failed':
                    filter['$and'] = [{ retries: { $eq: 2 } }, { status: 'Failed' }];
                    break;
                case 'success':
                    filter['status'] = 'Success';
            }
            const result = await this.bulkUploadRepository.getAll(filter, undefined, undefined, { _id: -1 }, { path: 'debtor', select: ['basicInformation.fullName'] }, undefined, page, limit);
            const count = await this.bulkUploadRepository.getCount(filter);
            const response = {};
            response[`${arrayName}`] = result;
            const countObj = {};
            countObj[`${arrayName}`] = count;
            response['count'] = countObj;
            return [true, response];
        };
        this.bulkUploadRepository = new bulkUpload_repository_1.BulkUploadRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getBulkCasesDetails(req) {
        const bulk = await this.bulkUploadRepository.getById(req.params.id);
        if (!bulk)
            return [false, constants_util_1.default.notFoundMessage('data')];
        const cases = await this.caseRepository.getAllWithoutPagination({
            _id: bulk.caseIds,
        }, undefined, undefined, { _id: -1 }, ['creditor']);
        if (!cases.length)
            return [false, constants_util_1.default.notFoundMessage('cases')];
        return [true, cases];
    }
}
exports.default = BulkUploadService;
//# sourceMappingURL=bulkUpload.service.js.map