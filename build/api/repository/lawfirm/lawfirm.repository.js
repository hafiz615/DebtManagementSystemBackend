"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawfirmRepository = void 0;
const lawfirm_model_1 = require("../../../database/models/lawfirm.model");
const base_repository_1 = require("../base.repository");
class LawfirmRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(lawfirm_model_1.Lawfirm);
    }
}
exports.LawfirmRepository = LawfirmRepository;
//# sourceMappingURL=lawfirm.repository.js.map