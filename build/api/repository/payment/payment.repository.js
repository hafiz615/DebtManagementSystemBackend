"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const payment_model_1 = require("../../../database/models/payment.model");
const base_repository_1 = require("../base.repository");
class PaymentRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(payment_model_1.Payment);
    }
}
exports.PaymentRepository = PaymentRepository;
//# sourceMappingURL=payment.repository.js.map