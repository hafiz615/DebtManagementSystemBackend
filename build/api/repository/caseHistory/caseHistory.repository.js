"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseHistoryRepository = void 0;
const caseHistory_model_1 = require("../../../database/models/caseHistory.model");
const base_repository_1 = require("../base.repository");
class CaseHistoryRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(caseHistory_model_1.CaseHistory);
    }
}
exports.CaseHistoryRepository = CaseHistoryRepository;
//# sourceMappingURL=caseHistory.repository.js.map