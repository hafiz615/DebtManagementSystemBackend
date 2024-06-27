"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const status_repository_1 = require("../repository/status/status.repository");
const status_repomodel_1 = require("../../database/repomodels/status.repomodel");
const lodash_1 = require("lodash");
const case_repository_1 = require("../repository/case/case.repository");
class StatusService {
    constructor() {
        this.statusRepository = new status_repository_1.StatusRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async getCaseStatuses(req) {
        const result = await this.statusRepository.getAllWithoutPagination();
        if (!result.length) {
            return [false, constants_util_1.default.notFoundMessage('statuses')];
        }
        return [true, result[0]];
    }
    async addStatus(req) {
        const capitalizeStatus = (0, lodash_1.capitalize)(req.body.status);
        const getAllStatuses = await this.statusRepository.getAllWithoutPagination();
        if (!getAllStatuses.length) {
            const status = new status_repomodel_1.Status();
            status.status = [capitalizeStatus];
            const createStatus = await this.statusRepository.create(status);
            return [true, createStatus];
        }
        const statusFind = getAllStatuses[0];
        const duplicateStatus = await this.statusRepository.getOne({
            _id: statusFind._id,
            status: { $in: capitalizeStatus },
        });
        if (duplicateStatus && duplicateStatus.status) {
            return [false, constants_util_1.default.Messages.STATUS_CASE_EXIST];
        }
        const result = await this.statusRepository.updateById(statusFind._id, { $addToSet: { status: capitalizeStatus } });
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('status')];
        }
        return [true, result];
    }
    async getStatusesById(req) {
        const result = await this.statusRepository.getById(req.params.id);
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('statuses')];
        }
        return [true, result];
    }
    async updateStatus(req) {
        const updateStatusCap = (0, lodash_1.capitalize)(req.body.update);
        const originalStatusCap = (0, lodash_1.capitalize)(req.body.original);
        const findStatus = await this.statusRepository.getOne({
            _id: req.params.id,
            status: { $in: updateStatusCap },
        });
        if (findStatus && findStatus.status) {
            return [false, constants_util_1.default.Messages.STATUS_CASE_EXIST];
        }
        const result = await this.statusRepository.updateByOne({
            _id: req.params.id,
            status: { $in: originalStatusCap },
        }, { $set: { 'status.$': updateStatusCap } });
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('status')];
        }
        return [true, result];
    }
    async updateStatusArray(req) {
        const result = await this.statusRepository.updateById(req.params.id, {
            status: req.body.status,
        });
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('status')];
        }
        return [true, result];
    }
    async deleteStatus(req) {
        const originalStatusCap = (0, lodash_1.capitalize)(req.body.original);
        const updateStatusCap = (0, lodash_1.capitalize)(req.body.update);
        const findStatus = await this.statusRepository.getById(req.params.id);
        if (!findStatus) {
            return [false, constants_util_1.default.notFoundMessage('statuses')];
        }
        const statusArr = findStatus.status;
        const originalIndex = statusArr.findIndex(item => item === originalStatusCap);
        const updateIndex = statusArr.findIndex(item => item === updateStatusCap);
        statusArr[originalIndex] = updateStatusCap;
        statusArr.splice(updateIndex, 1);
        const result = await this.statusRepository.updateById(req.params.id, {
            status: statusArr,
        });
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('status')];
        }
        await this.caseRepository.updateMany({ status: req.body.original }, { status: req.body.update });
        return [true, result];
    }
}
exports.default = StatusService;
//# sourceMappingURL=status.service.js.map