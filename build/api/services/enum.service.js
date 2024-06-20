"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const enum_repository_1 = require("../repository/enum/enum.repository");
const enum_repomodel_1 = require("../../database/repomodels/enum.repomodel");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
class EnumService {
    constructor() {
        this.enumRepository = new enum_repository_1.EnumRepository();
    }
    async createEnum(req) {
        const newEnum = new enum_repomodel_1.Enum();
        const validatedEnum = dataCopier_util_1.DataCopier.copy(newEnum, req.body);
        const result = await this.enumRepository.create(validatedEnum);
        if (!result) {
            return [false, constants_util_1.default.failureAddMessage('enum list')];
        }
        return [true, result];
    }
    async getAllEnums(req) {
        const result = await this.enumRepository.getAllWithoutPagination();
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('enums')];
        }
        return [true, result];
    }
    async getEnumByTarget(req) {
        const result = await this.enumRepository.getOne({
            enumTarget: String(req.query.target),
        });
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('enum')];
        }
        return [true, result];
    }
}
exports.default = EnumService;
//# sourceMappingURL=enum.service.js.map