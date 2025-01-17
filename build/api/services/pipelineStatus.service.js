"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const pipelineStatus_repository_1 = require("../repository/pipelineStatus/pipelineStatus.repository");
const pipelineStatus_repomodel_1 = require("../../database/repomodels/pipelineStatus.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const lodash_1 = require("lodash");
const case_repository_1 = require("../repository/case/case.repository");
const targetCF_repository_1 = require("../repository/targetCustomFields/targetCF.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
class PipelineStatusService {
    constructor() {
        this.pipelineStatusRepository = new pipelineStatus_repository_1.PipelineStatusRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
    }
    async createPipeline(req) {
        const reqTemp = req;
        const newPipeline = new pipelineStatus_repomodel_1.PipelineStatus();
        req.body.userId = reqTemp.id;
        req.body.pipeline = (0, lodash_1.capitalize)(req.body.pipeline);
        const validatedPipeline = dataCopier_util_1.DataCopier.copy(newPipeline, req.body);
        const result = await this.pipelineStatusRepository.create(validatedPipeline);
        if (!result) {
            return [false, constants_util_1.default.failureAddMessage('pipeline')];
        }
        return [true, result];
    }
    async getAllPipelines(req) {
        const result = await this.pipelineStatusRepository.getAllWithoutPagination({}, undefined, undefined, { _id: -1 });
        if (!result.length) {
            return [false, constants_util_1.default.notFoundMessage('pipelines')];
        }
        return [true, result];
    }
    async addStatusPipeline(req) {
        req.body.name = (0, lodash_1.capitalize)(req.body.name);
        const findStatus = await this.pipelineStatusRepository.getById(req.params.id, {
            status: { $elemMatch: { name: req.body.name } },
        });
        if (findStatus && findStatus.status) {
            return [false, constants_util_1.default.Messages.STATUS_PIPELINE_EXIST];
        }
        const result = await this.pipelineStatusRepository.updateById(req.params.id, { $addToSet: { status: req.body }, updatedAt: common_util_1.default.getCurrentDate() });
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('pipeline')];
        }
        return [true, result];
    }
    async getPipelineById(req) {
        const result = await this.pipelineStatusRepository.getById(req.params.id);
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('pipeline')];
        }
        return [true, result];
    }
    async updatePipeline(req) {
        req.body.pipeline = (0, lodash_1.capitalize)(req.body.pipeline);
        req.body.updatedAt = common_util_1.default.getCurrentDate();
        const result = await this.pipelineStatusRepository.updateById(req.params.id, req.body);
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('pipeline')];
        }
        return [true, result];
    }
    async deletePipeline(req) {
        const getPipeline = await this.pipelineStatusRepository.getById(req.params.id);
        if (!getPipeline) {
            return [false, constants_util_1.default.notFoundMessage('pipeline')];
        }
        if (getPipeline.status.length) {
            return [false, constants_util_1.default.Messages.PIPELINE_DELETE_STATUS_ERROR];
        }
        const result = await this.pipelineStatusRepository.delete({
            _id: req.params.id,
        });
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('pipeline')];
        }
        return [true, result];
    }
    async updateStatusPipeline(req) {
        req.body.update.name = (0, lodash_1.capitalize)(req.body.update.name);
        req.body.original.name = (0, lodash_1.capitalize)(req.body.original.name);
        const findStatus = await this.pipelineStatusRepository.getById(req.params.id, {
            status: { $elemMatch: { name: req.body.update.name } },
        });
        if (findStatus && findStatus.status) {
            return [false, constants_util_1.default.Messages.STATUS_PIPELINE_EXIST];
        }
        const result = await this.pipelineStatusRepository.updateByOne({
            _id: req.params.id,
            status: { $elemMatch: { name: req.body.original.name } },
        }, {
            $set: { 'status.$': req.body.update },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('pipeline')];
        }
        return [true, result];
    }
    async deleteStatusPipeline(req) {
        req.body.original.name = (0, lodash_1.capitalize)(req.body.original.name);
        let result = null;
        if (!Object.keys(req.body.update).length) {
            result = await this.deleteStatus(req.params.id, req.body.original);
        }
        else {
            req.body.update.name = (0, lodash_1.capitalize)(req.body.update.name);
            const pipeline = await this.pipelineStatusRepository.getById(req.params.id);
            if (!pipeline) {
                return [false, constants_util_1.default.notFoundMessage('pipeline')];
            }
            const statusArr = pipeline.status;
            const originalIndex = statusArr.findIndex(item => item.name === req.body.original.name);
            const updateIndex = statusArr.findIndex(item => item.name === req.body.update.name);
            statusArr[originalIndex] = req.body.update;
            statusArr.splice(updateIndex, 1);
            // result = await this.deleteStatus(req.params.id, req.body.original);
            result = await this.pipelineStatusRepository.updateById(req.params.id, { status: statusArr, updatedAt: common_util_1.default.getCurrentDate() });
        }
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('status')];
        }
        return [true, result];
    }
    async deleteStatus(id, original) {
        return await this.pipelineStatusRepository.updateById(id, {
            $pull: { status: original },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
    }
    async getPipelineDetails(req) {
        const pipeline = await this.pipelineStatusRepository.getById(req.params.id);
        if (!pipeline) {
            return [false, constants_util_1.default.notFoundMessage('pipeline')];
        }
        if (!pipeline.status.length)
            return [false, constants_util_1.default.notFoundMessage('pipeline statuses')];
        const statusNames = pipeline.status.map(status => status.name);
        const cases = await this.caseRepository.getAllWithoutPagination({ isDeleted: false, status: { $in: statusNames } }, undefined, undefined, { _id: -1 }, ['debtor', 'creditor']);
        if (!cases.length) {
            return [false, constants_util_1.default.notFoundMessage('cases')];
        }
        const result = {};
        statusNames.forEach(statusName => {
            const matchingCases = cases.filter(caseItem => caseItem.status === statusName);
            const annualizedValue = matchingCases.reduce((sum, obj) => sum + (obj.totalDebt || 0), 0);
            result[statusName] = { cases: matchingCases, annualizedValue };
        });
        return [true, result];
    }
    async getCasesByCustomFieldAndValue(req) {
        const { name, value } = req.body;
        const pipeline = await this.pipelineStatusRepository.getById(req.params.id);
        if (!pipeline) {
            return [false, constants_util_1.default.notFoundMessage('pipeline')];
        }
        if (!pipeline.status.length)
            return [false, constants_util_1.default.notFoundMessage('pipeline statuses')];
        const statusNames = pipeline.status.map(status => status.name);
        let customFields = await this.targetCFRepository.getAllWithoutPagination({
            customFields: { $elemMatch: { name: name, value: value } },
        });
        const caseIds = customFields.map(data => {
            return data.caseId;
        });
        const cases = await this.caseRepository.getAllWithoutPagination({ isDeleted: false, status: { $in: statusNames }, _id: caseIds }, undefined, undefined, { _id: -1 }, ['debtor', 'creditor']);
        if (!cases.length) {
            return [false, constants_util_1.default.notFoundMessage('cases')];
        }
        const result = {};
        statusNames.forEach(statusName => {
            const matchingCases = cases.filter(caseItem => caseItem.status === statusName);
            const annualizedValue = matchingCases.reduce((sum, obj) => sum + (obj.totalDebt || 0), 0);
            result[statusName] = { cases: matchingCases, annualizedValue };
        });
        return [true, result];
    }
}
exports.default = PipelineStatusService;
//# sourceMappingURL=pipelineStatus.service.js.map