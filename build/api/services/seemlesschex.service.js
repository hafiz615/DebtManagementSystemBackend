"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const payment_repository_1 = require("../repository/payment/payment.repository");
const dotenv_1 = __importDefault(require("dotenv"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const seemlesschex_util_1 = __importDefault(require("../../utils/seemlesschex.util"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
dotenv_1.default.config();
class SeemlesschexService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    async createCheck(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const { amount, token, store } = req.body;
        const response = await seemlesschex_util_1.default.createCheck(debtor, amount, token, store);
        if (!response?.error)
            return [false, response.message];
        const bv = await seemlesschex_util_1.default.checkBasicVerification(response);
        const fc = await seemlesschex_util_1.default.checkFundsVerification(response);
        let updatedPayment = await this.paymentRepository.updateMany({ _id: req.body.transactionIds }, {
            authorized: 'Success',
            captured: 'Pending',
            status: 'Pending',
            debtorTransId: req.body.referenceId,
            transactionType: req.body.transactionType,
            manualCommission: req.body.commission,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (updatedPayment) {
            await this.debtorRepository.updateById(req.params.id, {
                $inc: { commissionPaid: req.body.commission },
            });
        }
        return [true, response.check];
    }
    async createPaymentLink(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor on DMS')];
        const response = await seemlesschex_util_1.default.createPaymentLink(req.body.amount);
        if (response?.error)
            return [false, response.message];
        return [true, response.checkout_link];
    }
}
exports.default = SeemlesschexService;
//# sourceMappingURL=seemlesschex.service.js.map