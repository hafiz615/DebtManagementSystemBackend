"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtorRepository = void 0;
const debtor_model_1 = require("../../../database/models/debtor.model");
const base_repository_1 = require("../base.repository");
class DebtorRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(debtor_model_1.Debtor);
    }
}
exports.DebtorRepository = DebtorRepository;
//# sourceMappingURL=debtor.repository.js.map