"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const pipelineStatus_repository_1 = require("../repository/pipelineStatus/pipelineStatus.repository");
const pipelineStatus_repomodel_1 = require("../../database/repomodels/pipelineStatus.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
class PipelineStatusService {
    constructor() {
        this.pipelineStatusRepository = new pipelineStatus_repository_1.PipelineStatusRepository();
    }
    async createPipeline(req) {
        const reqTemp = req;
        const newPipeline = new pipelineStatus_repomodel_1.PipelineStatus();
        newPipeline.userId = reqTemp.id;
        const validatedPipeline = dataCopier_util_1.DataCopier.copy(newPipeline, req.body);
        const result = await this.pipelineStatusRepository.create(validatedPipeline);
        if (!result) {
            return [false, constants_util_1.default.failureAddMessage('pipeline')];
        }
        return [true, result];
    }
    async getAllPipelines(req) {
        const result = await this.pipelineStatusRepository.getAllWithoutPagination();
        if (!result.length) {
            return [false, constants_util_1.default.notFoundMessage('pipelines')];
        }
        return [true, result];
    }
    async addStatusPipeline(req) {
        const { name, type } = req.body.status;
        if (!name || !type) {
            return [false, 'Body is invalid'];
        }
        const findStatus = await this.pipelineStatusRepository.getById(req.params.id, {
            status: { $elemMatch: { name: name } },
        });
        if (findStatus.status) {
            return [false, constants_util_1.default.Messages.STATUS_PIPELINE_EXIST];
        }
        const result = await this.pipelineStatusRepository.updateById(req.params.id, { $addToSet: { status: req.body.status } });
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
        delete req.body.status;
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
        const { name, type } = req.body.update;
        const findStatus = await this.pipelineStatusRepository.getById(req.params.id, {
            status: { $elemMatch: { name: name } },
        });
        if (findStatus.status) {
            return [false, constants_util_1.default.Messages.STATUS_PIPELINE_EXIST];
        }
        const result = await this.pipelineStatusRepository.updateByOne({
            _id: req.params.id,
            status: { $elemMatch: { name: req.body.original.name } },
        }, { $set: { 'status.$': req.body.update } });
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('pipeline')];
        }
        return [true, result];
    }
    async deleteStatusPipeline(req) {
        let result = null;
        if (!Object.keys(req.body.update).length) {
            result = await this.deleteStatus(req.params.id, req.body.original);
        }
        else {
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
            result = await this.pipelineStatusRepository.updateById(req.params.id, { status: statusArr });
        }
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('status')];
        }
        return [true, result];
    }
    async deleteStatus(id, original) {
        return await this.pipelineStatusRepository.updateById(id, {
            $pull: { status: original },
        });
    }
}
exports.default = PipelineStatusService;
//# sourceMappingURL=pipelineStatus.service.js.map