"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseRepository = void 0;
const case_model_1 = require("../../../database/models/case.model");
const base_repository_1 = require("../base.repository");
class CaseRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(case_model_1.Case);
    }
}
exports.CaseRepository = CaseRepository;
//# sourceMappingURL=case.repository.js.map