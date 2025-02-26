"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFeeRepository = void 0;
const serviceFee_model_1 = require("../../../database/models/serviceFee.model");
const base_repository_1 = require("../base.repository");
class ServiceFeeRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(serviceFee_model_1.ServiceFee);
    }
}
exports.ServiceFeeRepository = ServiceFeeRepository;
//# sourceMappingURL=serviceFee.repository.js.map