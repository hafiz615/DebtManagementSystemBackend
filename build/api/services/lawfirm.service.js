"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const common_util_1 = __importDefault(require("../../utils/common.util"));
const dotenv_1 = __importDefault(require("dotenv"));
const lawfirm_repository_1 = require("../repository/lawfirm/lawfirm.repository");
const lawfirm_util_1 = __importDefault(require("../../utils/lawfirm.util"));
const attorney_util_1 = __importDefault(require("../../utils/attorney.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const attorney_repository_1 = require("../repository/attorney/attorney.repository");
const lawsuit_repository_1 = require("../repository/lawsuit/lawsuit.repository");
const lawsuit_util_1 = __importDefault(require("../../utils/lawsuit.util"));
const case_repository_1 = require("../repository/case/case.repository");
const lawsuit_repomodel_1 = require("../../database/repomodels/lawsuit.repomodel");
const attorney_util_2 = __importDefault(require("../../utils/attorney.util"));
dotenv_1.default.config();
class LawfirmService {
    constructor() {
        this.createLawfirm = async (req) => {
            const reqTemp = req;
            const platform = req.query.platform ?? true;
            req.body.lawfirm = { ...req.body.lawfirm, platform, userId: reqTemp.id };
            req.body.attorney = { ...req.body.attorney, platform, userId: reqTemp.id };
            const lawfirmExist = await this.lawfirmRepository.getOne({
                name: req.body.lawfirm.name,
            });
            if (lawfirmExist)
                return [false, constants_util_1.default.alreadyExistsMessage('Lawfirm')];
            const attorneyExist = await this.attorneyRepository.getOne({
                SSN: req.body.attorney.SSN,
            });
            if (attorneyExist)
                return [false, constants_util_1.default.alreadyExistsMessage('Attorney')];
            const lawfirm = await lawfirm_util_1.default.createLawfirm(req.body.lawfirm);
            console.log('lawfirm: ', lawfirm);
            if (!lawfirm)
                return [false, constants_util_1.default.failureRegisterMessage('Lawfirm')];
            req.body.attorney.lawfirmId = lawfirm._id;
            const attorney = await attorney_util_1.default.createAttorney(req.body.attorney);
            if (!attorney)
                return [false, constants_util_1.default.failureRegisterMessage('Attorney')];
            const lawsuitData = {
                lawfirmId: lawfirm._id,
                attorneyId: attorney._id,
                debtorId: reqTemp.params.id,
                userId: reqTemp.id,
            };
            const lawsuit = await lawsuit_util_1.default.createLawsuit(lawsuitData);
            return [true, []];
        };
        this.updateLawfirm = async (req) => {
            req.body.lawfirmFee = req.body?.monthly_subscription_fee;
            const updateData = { ...req.body, updatedAt: common_util_1.default.getCurrentDate() };
            const lawfirm = await this.lawfirmRepository.updateById(req.params.id, updateData);
            if (!lawfirm) {
                return [false, constants_util_1.default.notFoundMessage('Lawfirm')];
            }
            return [true, []];
        };
        this.getLawfirm = async (req) => {
            const lawfirms = await this.lawfirmRepository.getAllWithoutPagination({
                isDeleted: { $ne: true },
            });
            return lawfirms
                ? [true, lawfirms]
                : [true, constants_util_1.default.notFoundMessage('Lawfirms')];
        };
        this.assignLawfirmToCase = async (req) => {
            const reqTemp = req;
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor', 'creditor']);
            if (!caseTemp)
                return [false, constants_util_1.default.notFoundMessage('Case')];
            const lawFirm = await this.lawfirmRepository.getById(req.body.lawfirmId);
            if (!lawFirm)
                return [false, constants_util_1.default.notFoundMessage('lawfirm')];
            const lawSuit = new lawsuit_repomodel_1.Lawsuit();
            lawSuit.debtorId = caseTemp.debtor._id;
            lawSuit.creditorId = caseTemp.creditor._id;
            lawSuit.lawfirmId = req.body.lawfirmId;
            lawSuit.lawfirmCompanyName = lawFirm.lawfirmCompanyName;
            lawSuit.userId = reqTemp.id;
            lawSuit.defendentCompanyName =
                caseTemp.debtor.businessInformation.companyName;
            lawSuit.plantiffCompanyName =
                caseTemp.creditor.businessInformation.companyName;
            await this.lawsuitRepository.create(lawSuit);
            const updatedCase = await this.caseRepository.updateById(req.params.id, { dummyLawsuitExist: true });
            return updatedCase
                ? [true, []]
                : [false, constants_util_1.default.failureAddMessage('Lawfirm')];
        };
        this.lawfirmRepository = new lawfirm_repository_1.LawfirmRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async updateLawsuit(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('Case')];
        const lawsuit = await this.lawsuitRepository.updateByOne({
            debtorId: caseTemp.debtor,
            creditorId: caseTemp.creditor,
            isDeleted: { $ne: true },
        }, req.body);
        if (!lawsuit)
            return [false, constants_util_1.default.failureUpdateMessage('lawsuit')];
        return [true, []];
    }
    async addAttorney(req) {
        let reqTemp = req;
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('Case')];
        req.body.userId = reqTemp.id;
        const attorney = await attorney_util_2.default.createAttorney(req.body);
        if (!attorney)
            return [false, constants_util_1.default.failureAddMessage('attorney')];
        await this.lawsuitRepository.updateByOne({
            debtorId: caseTemp.debtor,
            creditorId: caseTemp.creditor,
            isDeleted: { $ne: true },
        }, { attorneyId: attorney._id });
        return [true, []];
    }
}
exports.default = LawfirmService;
//# sourceMappingURL=lawfirm.service.js.map