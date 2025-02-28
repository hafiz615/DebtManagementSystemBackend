"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const lawsuit_repository_1 = require("../api/repository/lawsuit/lawsuit.repository");
const lawsuit_repomodel_1 = require("../database/repomodels/lawsuit.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const case_repository_1 = require("../api/repository/case/case.repository");
const lawfirm_util_1 = __importDefault(require("./lawfirm.util"));
const lawfirm_repository_1 = require("../api/repository/lawfirm/lawfirm.repository");
const attorney_repository_1 = require("../api/repository/attorney/attorney.repository");
const attorney_util_1 = __importDefault(require("./attorney.util"));
dotenv_1.default.config();
class LawsuitUtil {
    constructor() {
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
        this.lawfirmRepository = new lawfirm_repository_1.LawfirmRepository();
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async lawsuitFormation(req, caseData) {
        const { lawsuit, attorney } = req.body;
        const lawfirmExist = await this.lawfirmRepository.getOne({
            lawfirmCompanyName: lawsuit.lawfirmCompanyName,
        });
        let createdLawfirm = null;
        let createdAttorney = null;
        if (!lawfirmExist) {
            createdLawfirm = await lawfirm_util_1.default.createLawfirm({
                lawfirmCompanyName: lawsuit.lawfirmCompanyName,
                userId: null,
            });
        }
        const lawfirmId = lawfirmExist ? lawfirmExist._id : createdLawfirm._id;
        const attorneyExist = await this.attorneyRepository.getOne({
            SSN: attorney.SSN,
        });
        attorney.lawfirmId = lawfirmId;
        if (!attorneyExist) {
            createdAttorney = await attorney_util_1.default.createAttorney(attorney);
        }
        const attorneyId = attorneyExist ? attorneyExist._id : createdAttorney._id;
        const lawsuitData = {
            attorneyId: attorneyId,
            lawfirmId: lawfirmId,
            debtorId: caseData.debtor,
            userId: null,
            creditorId: caseData.creditor,
            lawfirmCompanyName: lawsuit.lawfirmCompanyName,
            defendentCompanyName: lawsuit.defendentCompanyName,
            plantiffCompanyName: lawsuit.plantiffCompanyName,
            lawsuitDate: lawsuit.startDate,
        };
        const lawsuitTemp = await this.createLawsuit(lawsuitData);
        return lawsuitTemp ? [true, lawsuitTemp] : false;
    }
    async createLawsuit(data) {
        const newLawsuit = new lawsuit_repomodel_1.Lawsuit();
        const validatedLawsuit = dataCopier_util_1.DataCopier.copy(newLawsuit, data);
        return await this.lawsuitRepository.create(validatedLawsuit);
    }
    async updateLegalFee(payments) {
        for (const payment of payments) {
            const updateObjPayment = {};
            if (payment.caseId) {
                updateObjPayment['legalFee'] = await this.getLegalFee(payment.caseId);
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
    }
    async getTotalLegalFee(payments) {
        let totalLegalFee = 0;
        for (const payment of payments) {
            if (payment.caseId) {
                totalLegalFee += await this.getLegalFee(payment.caseId);
            }
        }
        return totalLegalFee;
    }
    async getLegalFee(caseId) {
        const caseData = await this.caseRepository.getById(caseId);
        const lawsuitData = await this.lawsuitRepository.getOne({
            debtorId: caseData.debtor,
            creditorId: caseData.creditor,
        }, undefined, undefined, [
            { path: 'lawfirmId', select: ['lawfirmFee'] },
            { path: 'attorneyId', select: ['attorneyFee'] },
        ]);
        const legalFee = lawsuitData
            ? lawsuitData.attorneyId?.attorneyFee
            : lawsuitData.lawfirmId?.lawfirmFee;
        return legalFee;
    }
}
exports.default = new LawsuitUtil();
//# sourceMappingURL=lawsuit.util.js.map