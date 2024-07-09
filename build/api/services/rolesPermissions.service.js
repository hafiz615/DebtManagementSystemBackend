"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const pipelineStatus_repomodel_1 = require("../../database/repomodels/pipelineStatus.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const lodash_1 = require("lodash");
const rolesPermissions_repository_1 = require("../repository/rolesPermissions/rolesPermissions.repository");
class RolesPermissionsService {
    constructor() {
        this.rolesPermissionsRepository = new rolesPermissions_repository_1.RolesPermissionsRepository();
    }
    async createRole(req) {
        const reqTemp = req;
        const newPipeline = new pipelineStatus_repomodel_1.PipelineStatus();
        req.body.userId = reqTemp.id;
        req.body.pipeline = (0, lodash_1.capitalize)(req.body.pipeline);
        const validatedPipeline = dataCopier_util_1.DataCopier.copy(newPipeline, req.body);
        const result = await this.rolesPermissionsRepository.create(validatedPipeline);
        if (!result) {
            return [false, constants_util_1.default.failureAddMessage('pipeline')];
        }
        return [true, result];
    }
    async getAllRoles(req) {
        const result = await this.rolesPermissionsRepository.getAllWithoutPagination();
        if (!result.length) {
            return [false, constants_util_1.default.notFoundMessage('pipelines')];
        }
        return [true, result];
    }
    async getRoleById(req) {
        const result = await this.rolesPermissionsRepository.getById(req.params.id);
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('pipeline')];
        }
        return [true, result];
    }
    async updateRole(req) {
        req.body.pipeline = (0, lodash_1.capitalize)(req.body.pipeline);
        const result = await this.rolesPermissionsRepository.updateById(req.params.id, req.body);
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('pipeline')];
        }
        return [true, result];
    }
}
exports.default = RolesPermissionsService;
//# sourceMappingURL=rolesPermissions.service.js.map