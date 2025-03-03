"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFeeRepository = void 0;
const fee_model_1 = require("../../../database/models/fee.model");
const base_repository_1 = require("../base.repository");
class ServiceFeeRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(fee_model_1.Fee);
    }
}
exports.ServiceFeeRepository = ServiceFeeRepository;
//# sourceMappingURL=serviceFee.repository.js.map