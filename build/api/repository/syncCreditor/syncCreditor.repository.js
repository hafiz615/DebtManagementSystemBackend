"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncCreditorRepository = void 0;
const syncCreditor_model_1 = require("../../../database/models/syncCreditor.model");
const base_repository_1 = require("../base.repository");
class SyncCreditorRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(syncCreditor_model_1.SyncCreditor);
    }
}
exports.SyncCreditorRepository = SyncCreditorRepository;
//# sourceMappingURL=syncCreditor.repository.js.map