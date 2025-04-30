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
        const { lawsuit, attorney, lawfirm } = req.body;
        const id = lawsuit?.userId;
        const newLawfirm = lawsuit?.lawfirmCompanyName
            ? {
                lawfirmCompanyName: lawsuit.lawfirmCompanyName,
                platform: req.body.platform,
                userId: id,
            }
            : lawfirm
                ? { ...lawfirm, platform: req.body.platform, userId: id }
                : null;
        const lawfirmTemp = await lawfirm_util_1.default.upsertLawfirm({
            ...newLawfirm,
        });
        const attorneyTemp = await attorney_util_1.default.upsertAttorney({
            ...attorney,
            platform: req.body.platform,
            userId: id,
            lawfirmId: lawfirmTemp.id,
        });
        const lawsuitInfo = this.lawsuitInfo(lawsuit, caseData, attorneyTemp._id, lawfirmTemp._id, id);
        const lawsuitTemp = await this.upsertLawsuit(lawsuitInfo);
        return lawsuitTemp ? [true, lawsuitTemp] : false;
    }
    async lawsuitDetailsDebtorPortal(lawsuitFields, userId) {
        return {
            body: {
                attorney: {
                    name: lawsuitFields?.name || '',
                    phone: await common_util_1.default.cleanPhoneNumber(lawsuitFields?.phone),
                    address: lawsuitFields.address || '',
                    city: lawsuitFields.city || '',
                    SSN: lawsuitFields.SSN || '',
                    state: lawsuitFields.state || '',
                    userId: userId || null,
                    email: lawsuitFields?.email || '',
                },
                lawsuit: {
                    balance: lawsuitFields?.balance || lawsuitFields?.Balance || 0,
                    lawfirmCompanyName: lawsuitFields.lawfirmCompanyName || '',
                    startDate: lawsuitFields.startDate || '',
                    defendentCompanyName: lawsuitFields.defendentCompanyName || '',
                    plantiffCompanyName: lawsuitFields.plantiffCompanyName || '',
                    userId: userId || null,
                },
                lawfirm: {
                    lawfirmCompanyName: lawsuitFields.lawfirmCompanyName,
                    // email: lawsuitFields.email,
                    // phone: await commonUtil.cleanPhoneNumber(lawsuitFields.phone),
                    // address: lawsuitFields.address,
                    // city: lawsuitFields.city,
                    // state: lawsuitFields.state,
                    // EIN: lawsuitFields.EIN,
                    // userId: userId || null,
                },
            },
        };
    }
    async lawsuitDetails(lawsuitFields, userId) {
        return {
            body: {
                attorney: {
                    name: lawsuitFields?.attorney_name || '',
                    phone: await common_util_1.default.cleanPhoneNumber(lawsuitFields?.attorney_telephone),
                    address: lawsuitFields.attorney_address || '',
                    city: lawsuitFields.attorney_city || '',
                    SSN: lawsuitFields.attorney_SSN || '',
                    state: lawsuitFields.attorney_state || '',
                    userId: userId || null,
                },
                lawsuit: {
                    balance: lawsuitFields?.balance || lawsuitFields?.Balance || 0,
                    startDate: lawsuitFields.document_date || '',
                    defendentCompanyName: lawsuitFields.defendant_company || '',
                    plantiffCompanyName: lawsuitFields.plaintiff_company || '',
                    userId: userId || null,
                },
                lawfirm: {
                    lawfirmCompanyName: lawsuitFields.lawfirmCompanyName,
                    email: lawsuitFields.email,
                    phone: await common_util_1.default.cleanPhoneNumber(lawsuitFields.phone),
                    address: lawsuitFields.address,
                    city: lawsuitFields.city,
                    state: lawsuitFields.state,
                    EIN: lawsuitFields.EIN,
                    userId: userId || null,
                    lawfirmFee: common_util_1.default.extractAmount(lawsuitFields?.monthly_subscription_fee),
                },
            },
        };
    }
    lawsuitInfo(lawsuit, caseData, attorneyId, lawfirmId, userId) {
        return {
            attorneyId,
            lawfirmId,
            debtorId: caseData.debtor,
            creditorId: caseData.creditor,
            lawfirmCompanyName: lawsuit.lawfirmCompanyName,
            defendentCompanyName: lawsuit.defendentCompanyName,
            plantiffCompanyName: lawsuit.plantiffCompanyName,
            lawsuitDate: lawsuit.startDate,
            balance: lawsuit?.balance || lawsuit?.Balance,
            userId: userId || null,
        };
    }
    async createLawsuit(data) {
        const newLawsuit = new lawsuit_repomodel_1.Lawsuit();
        const validatedLawsuit = dataCopier_util_1.DataCopier.copy(newLawsuit, data);
        return await this.lawsuitRepository.create(validatedLawsuit);
    }
    async upsertLawsuit(data) {
        const newLawsuit = new lawsuit_repomodel_1.Lawsuit();
        const validatedLawsuit = dataCopier_util_1.DataCopier.copy(newLawsuit, data);
        delete validatedLawsuit.debtorId;
        delete validatedLawsuit.creditorId;
        return await this.lawsuitRepository.upsert({
            debtorId: data.debtorId,
            creditorId: data.creditorId,
            isDeleted: false,
        }, validatedLawsuit);
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
                this.updateLawsuitFee(fee, payment.caseId.debtor._id, payment.caseId.creditor._id);
            }
        }
    }
    async updatePaymentLawsuit(payments) {
        for (const payment of payments) {
            if (payment.caseId) {
                const fee = await this.getLegalFee(payment.caseId);
                if (fee) {
                    this.updateLawsuitFee(fee, payment.caseId.debtor._id, payment.caseId.creditor._id);
                }
            }
        }
    }
    async updateLawsuitFee(fee, debtorId, creditorId) {
        await this.lawsuitRepository.updateByOne({ creditorId, debtorId, isDeleted: { $ne: true } }, {
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
    async getLegalFee(caseData) {
        // const caseData = await this.caseRepository.getById<ICase>(caseId._id);
        if (caseData?.lawsuitExist || caseData?.dummyLawsuitExist) {
            if (caseData?.legalFee > 0) {
                return caseData.legalFee;
            }
            const lawsuitData = await this.lawsuitRepository.getOne({
                debtorId: caseData.debtor._id,
                creditorId: caseData.creditor,
                isDeleted: { $ne: true },
            }, undefined, undefined, ['lawfirmId']);
            if (lawsuitData?.lawfirmId?.lawfirmFee !== 0) {
                return lawsuitData.lawfirmId.lawfirmFee;
            }
            let legalFee = await this.serviceFeeRepository.getOne({
                type: 'legalFee',
            });
            return legalFee ? legalFee.fee : 0;
        }
        return 0;
    }
    async getServiceFee(caseData) {
        // const caseData = await this.caseRepository.getById<ICase>(caseId._id);
        if (caseData?.serviceFee) {
            return caseData.serviceFee;
        }
        const serviceFee = await this.serviceFeeRepository.getOne({
            type: 'serviceFee',
        });
        return serviceFee ? serviceFee.fee : 0;
    }
    async deleteLawsuit(debtorId, creditorId) {
        await this.lawsuitRepository.updateByOne({
            debtorId: debtorId,
            creditorId: creditorId,
            isDeleted: { $ne: true },
        }, {
            isDeleted: true,
        });
    }
    async cancelPlan(debtorId, creditorId) {
        await this.lawsuitRepository.updateByOne({
            debtorId: debtorId,
            creditorId: creditorId,
            isDeleted: { $ne: true },
        }, {
            intervals: [],
            isExempt: false,
        });
    }
}
exports.default = new LawsuitUtil();
//# sourceMappingURL=lawsuit.util.js.map