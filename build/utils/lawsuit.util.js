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
const serviceFee_repository_1 = require("../api/repository/serviceFee/serviceFee.repository");
const common_util_1 = __importDefault(require("./common.util"));
dotenv_1.default.config();
class LawsuitUtil {
    constructor() {
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
        this.lawfirmRepository = new lawfirm_repository_1.LawfirmRepository();
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.serviceFeeRepository = new serviceFee_repository_1.ServiceFeeRepository();
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
                platform: req.body.platform,
                userId: null,
            });
        }
        const lawfirmId = lawfirmExist ? lawfirmExist._id : createdLawfirm._id;
        const attorneyExist = await this.attorneyRepository.getOne({
            SSN: attorney.SSN,
        });
        attorney.platform = req.body.platform;
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
            balance: lawsuit.balance,
        };
        const lawsuitTemp = await this.createLawsuit(lawsuitData);
        return lawsuitTemp ? [true, lawsuitTemp] : false;
    }
    async lawsuitDetails(lawsuitFields) {
        return {
            body: {
                attorney: {
                    name: lawsuitFields?.attorney_name || '',
                    phone: lawsuitFields?.attorney_telephone || '',
                    address: lawsuitFields.attorney_address || '',
                    city: lawsuitFields.attorney_city || '',
                    SSN: lawsuitFields.attorney_SSN || '',
                    state: lawsuitFields.attorney_state || '',
                },
                lawsuit: {
                    balance: lawsuitFields.balance || '',
                    startDate: lawsuitFields.document_date || '',
                    defendentCompanyName: lawsuitFields.defendant_company || '',
                    plantiffCompanyName: lawsuitFields.plaintiff_company || '',
                    lawfirmCompanyName: lawsuitFields.lawfirmCompanyName || '',
                },
            },
        };
    }
    async createLawsuit(data) {
        const newLawsuit = new lawsuit_repomodel_1.Lawsuit();
        const validatedLawsuit = dataCopier_util_1.DataCopier.copy(newLawsuit, data);
        return await this.lawsuitRepository.create(validatedLawsuit);
    }
    async updateFee(payments) {
        for (const payment of payments) {
            const updateObjPayment = {};
            if (payment.caseId) {
                const fee = await this.getLegalFee(payment.caseId);
                updateObjPayment['legalFee'] = fee;
                updateObjPayment['serviceFee'] = await this.getServiceFee(payment.caseId);
                updateObjPayment['updatedAt'] = common_util_1.default.getCurrentDate();
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
                this.updateLawsuitFee(fee, payment.caseId.debtor, payment.caseId.creditor);
            }
        }
    }
    async updatePaymentLawsuit(payments) {
        for (const payment of payments) {
            if (payment.caseId) {
                const fee = await this.getLegalFee(payment.caseId);
                this.updateLawsuitFee(fee, payment.caseId.debtor, payment.caseId.creditor);
            }
        }
    }
    async updateLawsuitFee(fee, debtorId, creditorId) {
        await this.lawsuitRepository.updateByOne({ creditorId, debtorId }, {
            $inc: {
                lawsuitReceiveAmount: fee,
                lawsuitReceiveCount: 1,
            },
        });
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
    async getTotalServiceFee(payments) {
        let totalServiceFee = 0;
        for (const payment of payments) {
            if (payment.caseId) {
                totalServiceFee += await this.getServiceFee(payment.caseId);
            }
        }
        return totalServiceFee;
    }
    async getLegalFee(caseId) {
        const caseData = await this.caseRepository.getById(caseId);
        if (caseData.legalFee !== 0) {
            return caseData.legalFee;
        }
        const lawsuitData = await this.lawsuitRepository.getOne({
            debtorId: caseData.debtor,
            creditorId: caseData.creditor,
        });
        let legalFee = null;
        if (lawsuitData && lawsuitData.lawsuitStatus) {
            legalFee = await this.serviceFeeRepository.getOne({
                type: 'legalFee',
            });
        }
        return legalFee ? legalFee.fee : 0;
    }
    async getServiceFee(caseId) {
        const caseData = await this.caseRepository.getById(caseId);
        if (caseData.serviceFee !== 0) {
            return caseData.serviceFee;
        }
        const serviceFee = await this.serviceFeeRepository.getOne({
            type: 'serviceFee',
        });
        return serviceFee ? serviceFee.fee : 0;
    }
}
exports.default = new LawsuitUtil();
//# sourceMappingURL=lawsuit.util.js.map