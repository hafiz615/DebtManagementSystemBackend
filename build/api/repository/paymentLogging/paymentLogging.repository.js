"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLoggingRepository = void 0;
const paymentLogging_model_1 = require("../../../database/models/paymentLogging.model");
const base_repository_1 = require("../base.repository");
class PaymentLoggingRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(paymentLogging_model_1.PaymentLogging);
    }
}
exports.PaymentLoggingRepository = PaymentLoggingRepository;
//# sourceMappingURL=paymentLogging.repository.js.map