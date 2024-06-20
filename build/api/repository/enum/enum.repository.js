"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumRepository = void 0;
const enum_model_1 = require("../../../database/models/enum.model");
const base_repository_1 = require("../base.repository");
class EnumRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(enum_model_1.EnumModel);
    }
}
exports.EnumRepository = EnumRepository;
//# sourceMappingURL=enum.repository.js.map