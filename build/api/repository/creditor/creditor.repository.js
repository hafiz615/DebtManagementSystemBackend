"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditorRepository = void 0;
const creditor_model_1 = require("../../../database/models/creditor.model");
const base_repository_1 = require("../base.repository");
class CreditorRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(creditor_model_1.Creditor);
    }
}
exports.CreditorRepository = CreditorRepository;
//# sourceMappingURL=creditor.repository.js.map