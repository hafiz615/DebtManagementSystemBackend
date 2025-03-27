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
            req.body.lawfirm = req.body?.monthly_subscription_fee;
            const updateData = { ...req.body, updatedAt: common_util_1.default.getCurrentDate() };
            const lawfirm = await this.lawfirmRepository.updateById(req.params.id, updateData);
            if (!lawfirm) {
                return [false, constants_util_1.default.notFoundMessage('Lawfirm')];
            }
            return [true, lawfirm];
        };
        this.lawfirmRepository = new lawfirm_repository_1.LawfirmRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.attorneyRepository = new attorney_repository_1.AttorneyRepository();
        this.lawsuitRepository = new lawsuit_repository_1.LawsuitRepository();
    }
}
exports.default = LawfirmService;
//# sourceMappingURL=lawfirm.service.js.map