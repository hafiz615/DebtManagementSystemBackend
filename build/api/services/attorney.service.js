"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const case_repository_1 = require("../repository/case/case.repository");
const lawsuit_repository_1 = require("../repository/lawsuit/lawsuit.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
class AttorneyService {
    constructor() {
        this.getLawSuitBalanceSummary = async (req) => {
            const getCase = await this.caseRepository.getById(req.body.caseId, 'debtor creditor');
            if (!getCase)
                return [false, constants_util_1.default.notFoundMessage('Case')];
            const lawSuitBalanceSummary = await this.lawsuitRepository.getOne({
                attorneyId: req.params.id,
                debtorId: getCase.debtor,
                creditorId: getCase.creditor,
            });
            const lawSuit = lawSuitBalanceSummary
                ? {
                    lawSuitId: lawSuitBalanceSummary._id,
                    balance: lawSuitBalanceSummary.balance,
                    receivedBalance: lawSuitBalanceSummary.lawsuitReceiveAmount,
                }
                : null;
            return [true, lawSuit];
        };
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    async cancelLawSuitPaymentPlan(req) {
        const getCase = await this.caseRepository.getById(req.body.caseId, 'debtor creditor');
        if (!getCase)
            return [false, constants_util_1.default.notFoundMessage('Case')];
        const lawSuit = await this.lawsuitRepository.updateByOne({
            attorneyId: req.params.id,
            debtorId: getCase.debtor,
            creditorId: getCase.creditor,
        }, {
            intervals: [],
        });
        const updatePayments = await this.paymentRepository.updateMany({
            caseId: req.body.caseId,
            attorneyId: req.params.id,
            $or: [{ authorized: 'Pending' }, { authorized: 'Failed' }],
        }, {
            isDeleted: true,
        });
        if (!lawSuit || !updatePayments)
            return [false, 'Failed to cancel law suit payment plan'];
        return [true, 'Law suit payment plan canceled successfully'];
    }
}
exports.default = AttorneyService;
//# sourceMappingURL=attorney.service.js.map