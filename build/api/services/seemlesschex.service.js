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
const check_repository_1 = require("../repository/check/check.repository");
dotenv_1.default.config();
class SeemlesschexService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.checkRepository = new check_repository_1.CheckRepository();
    }
    async createCheck(req) {
        const debtor = await this.debtorRepository.getById(req.body.debtorId);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const { amount, referenceId, transactionType, commission, transactionIds, data, transactionDate, } = req.body;
        const decryptedData = common_util_1.default.getDecryptedData(data);
        const tokenResponse = await seemlesschex_util_1.default.tokenization(decryptedData);
        if (tokenResponse?.error)
            return [false, tokenResponse.message];
        let totalAmount = amount + commission;
        const response = await seemlesschex_util_1.default.createCheck(debtor, totalAmount, tokenResponse.tokenization.token, decryptedData);
        if (response?.error)
            return [false, response.message];
        const bv = await seemlesschex_util_1.default.checkBasicVerification(response);
        const fc = await seemlesschex_util_1.default.checkFundsVerification(response);
        let authorized = 'Success';
        if (fc?.error || bv?.error)
            authorized = 'Failed';
        await seemlesschex_util_1.default.saveCheckInfo(bv, fc, response, req.body.debtorId);
        await this.paymentRepository.updateMany({ _id: transactionIds }, {
            authorized: authorized,
            captured: 'Pending',
            status: 'Pending',
            debtorTransId: response.check.check_id,
            transactionType: transactionType,
            manualCommission: commission,
            dueDate: transactionDate,
            paymentGateway: 'Seemlesschex',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return [true, response.check];
    }
    async createPaymentLink(req) {
        const debtor = await this.debtorRepository.getById(req.body.debtorId);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor on DMS')];
        const response = await seemlesschex_util_1.default.createPaymentLink(req.body.amount);
        if (response?.error)
            return [false, response.message];
        return [true, response.checkout_link];
    }
    async updateCheck(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const { data, checkId } = req.body;
        const foundCheck = await this.checkRepository.getOne({
            checkId: checkId,
            isDeleted: false,
        });
        if (!foundCheck)
            return [false, constants_util_1.default.notFoundMessage('check')];
        const decryptedData = common_util_1.default.getDecryptedData(data);
        const tokenResponse = await seemlesschex_util_1.default.tokenization(decryptedData);
        if (tokenResponse?.error)
            return [false, tokenResponse.message];
        const response = await seemlesschex_util_1.default.updateCheck(debtor, tokenResponse.tokenization.token, checkId, decryptedData);
        if (response?.error)
            return [false, response.message];
        const bv = await seemlesschex_util_1.default.checkBasicVerification(response);
        const fc = await seemlesschex_util_1.default.checkFundsVerification(response);
        let authorized = 'Success';
        if (bv?.error || fc?.error)
            authorized = 'Failed';
        await seemlesschex_util_1.default.updateCheckInfo(bv, fc, response, checkId);
        await this.paymentRepository.updateMany({ debtorTransId: checkId }, {
            authorized: authorized,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return [true, response.check];
    }
    async voidCheck(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const { checkId } = req.body;
        const foundCheck = await this.checkRepository.getOne({
            checkId: checkId,
            isDeleted: false,
        });
        if (!foundCheck)
            return [false, constants_util_1.default.notFoundMessage('check')];
        const response = await seemlesschex_util_1.default.voidCheck(checkId);
        if (response?.error)
            return [false, response.message];
        await seemlesschex_util_1.default.deleteCheckInfo(checkId);
        await this.paymentRepository.updateMany({ debtorTransId: checkId }, {
            authorized: 'Pending',
            captured: 'Pending',
            status: 'Upcoming',
            debtorTransId: '',
            transactionType: '',
            manualCommission: 0,
            paymentGateway: '',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return [true, []];
    }
    async getClientChecks(req) {
        let debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        let payments = await this.paymentRepository.getAllWithoutPagination({
            transactionType: 'Check',
            debtorId: req.params.id,
        }, undefined, undefined, { _id: -1 });
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('payments')];
        }
        const groupedByTransId = payments.reduce((acc, item) => {
            if (!acc[item.debtorTransId]) {
                acc[item.debtorTransId] = [];
            }
            acc[item.debtorTransId].push(item);
            return acc;
        }, {});
        for (const [key, value] of Object.entries(groupedByTransId)) {
            const checkInfo = await seemlesschex_util_1.default.getCheckInfo(key);
            groupedByTransId[key] = { payments: value, checkInfo };
        }
        return [true, groupedByTransId];
    }
    async statusChanged(req) {
        const response = req.body;
        const checkId = response.data.check_id;
        switch (response.event) {
            case 'check.changed':
                switch (response.data.status) {
                    case 'void':
                        await seemlesschex_util_1.default.updateIfCheckDeleted(checkId, response.data.status);
                        break;
                    case 'deposited':
                        await seemlesschex_util_1.default.updateIfCheckDeposited(checkId, response.data.status);
                        break;
                    case 'failed':
                        await seemlesschex_util_1.default.updateIfCheckFailed(checkId, response.data.status);
                        break;
                }
                break;
            case 'check.deleted':
                await seemlesschex_util_1.default.updateIfCheckDeleted(checkId, response.data.status);
                break;
        }
        return [true, ''];
    }
}
exports.default = SeemlesschexService;
//# sourceMappingURL=seemlesschex.service.js.map