"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const case_repository_1 = require("../repository/case/case.repository");
const lawsuit_repository_1 = require("../repository/lawsuit/lawsuit.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
const attorney_repository_1 = require("../repository/attorney/attorney.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
class AttorneyService {
    constructor() {
        this.getLawsuitDetails = async (req) => {
            const getCase = await this.caseRepository.getById(req.params.id, 'debtor creditor');
            if (!getCase)
                return [false, constants_util_1.default.notFoundMessage('Case')];
            const lawSuitBalanceSummary = await this.lawsuitRepository.getOne({
                debtorId: getCase.debtor,
                creditorId: getCase.creditor,
            }, undefined, undefined, ['attorneyId', 'lawfirmId']);
            if (!lawSuitBalanceSummary)
                return [true, null];
            const { attorneyId, lawfirmId, ...lawsuitData } = lawSuitBalanceSummary;
            return [
                true,
                { lawSuit: lawsuitData, attorney: attorneyId, lawfirm: lawfirmId },
            ];
        };
        this.updateAttorney = async (req) => {
            const updateData = { ...req.body, updatedAt: common_util_1.default.getCurrentDate() };
            const attorney = await this.attorneyRepository.updateById(req.params.id, updateData);
            if (!attorney) {
                return [false, constants_util_1.default.notFoundMessage('Attorney')];
            }
            return [true, attorney];
        };
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
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
            isExempt: false,
        });
        const updatePayments = await this.paymentRepository.updateMany({
            caseId: req.body.caseId,
            attorneyId: req.params.id,
            $or: [{ authorized: 'Pending' }, { authorized: 'Failed' }],
        }, {
            isDeleted: true,
        });
        if (!lawSuit || !updatePayments)
            return [false, 'Failed to cancel lawsuit payment plan'];
        return [true, 'Lawsuit payment plan canceled successfully'];
    }
}
exports.default = AttorneyService;
//# sourceMappingURL=attorney.service.js.map