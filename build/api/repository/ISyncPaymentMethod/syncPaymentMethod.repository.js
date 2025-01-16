"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncPaymentMethodRepository = void 0;
const syncPaymentMethod_model_1 = require("../../../database/models/syncPaymentMethod.model");
const base_repository_1 = require("../base.repository");
class SyncPaymentMethodRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(syncPaymentMethod_model_1.SyncPaymentMethod);
    }
}
exports.SyncPaymentMethodRepository = SyncPaymentMethodRepository;
//# sourceMappingURL=syncPaymentMethod.repository.js.map