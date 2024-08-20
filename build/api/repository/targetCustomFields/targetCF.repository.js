"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetCFRepository = void 0;
const targetCF_model_1 = require("../../../database/models/targetCF.model");
const base_repository_1 = require("../base.repository");
class TargetCFRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(targetCF_model_1.TargetCustomFields);
    }
}
exports.TargetCFRepository = TargetCFRepository;
//# sourceMappingURL=targetCF.repository.js.map