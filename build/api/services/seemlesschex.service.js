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
const debtor_util_1 = __importDefault(require("../../utils/debtor.util"));
dotenv_1.default.config();
class SeemlesschexService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.checkRepository = new check_repository_1.CheckRepository();
    }
    async createCheck(req) {
        // const type = String(req.query.type);
        // if (type !== 'client' && type !== 'creditor') {
        //   return [false, constants.notFoundMessage('query type is invalid')];
        // }
        const debtor = await this.debtorRepository.getById(req.body.debtorId);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        const { amount, referenceId, transactionType, commission, transactionIds, data, transactionDate, } = req.body;
        const decryptedData = common_util_1.default.getDecryptedData(data);
        const tokenResponse = await seemlesschex_util_1.default.tokenization(decryptedData);
        if (tokenResponse?.error)
            return [false, tokenResponse.message];
        const response = await seemlesschex_util_1.default.createCheck(debtor, amount, tokenResponse.tokenization.token, decryptedData);
        if (response?.error)
            return [false, response.message];
        const bv = await seemlesschex_util_1.default.checkBasicVerification(response);
        // const fc = await seemlesschexUtil.checkFundsVerification(response);
        let authorized = 'Success';
        // if (fc?.error || bv?.error) authorized = 'Failed'
        if (bv?.error)
            authorized = 'Failed';
        await seemlesschex_util_1.default.saveCheckInfo(bv, null, response, req.body.debtorId);
        // const additionalIds = [];
        // if (type === 'client') {
        //   for (const transactionId of transactionIds) {
        //     const payment =
        //       await this.paymentRepository.getById<IPayment>(transactionId);
        //     const otherPayments: IPayment[] =
        //       await paymentUtil.getOtherPayments(payment);
        //     otherPayments.forEach(payment => {
        //       additionalIds.push(String(payment._id));
        //     });
        //   }
        // }
        // const mergedIds = transactionIds.concat(additionalIds);
        await this.paymentRepository.updateMany({ _id: transactionIds }, {
            authorized: authorized,
            debtorTransId: response.check.check_id,
            paymentMode: transactionType,
            manualAmount: amount,
            dueDate: transactionDate,
            paymentGateway: 'Seamlesschex',
            transactionType: 'ACH',
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return [true, response.check];
    }
    async createPaymentLink(req) {
        const debtor = await this.debtorRepository.getById(req.body.debtorId);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('debtor on DMS')];
        const response = await debtor_util_1.default.createPaymentLinkOrNot(req.body.debtorId, req.body.amount, debtor?.basicInformation?.fullName);
        if (!response[0])
            return response;
        return response;
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
        // const fc = await seemlesschexUtil.checkFundsVerification(response);
        let authorized = 'Success';
        // if (bv?.error || fc?.error) authorized = 'Failed';
        if (bv?.error)
            authorized = 'Failed';
        await seemlesschex_util_1.default.updateCheckInfo(bv, null, response, checkId);
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
        await seemlesschex_util_1.default.deleteCheckInfo(checkId, 'void');
        await this.paymentRepository.updateMany({ debtorTransId: checkId }, {
            authorized: 'Pending',
            captured: 'Pending',
            status: 'Upcoming',
            debtorTransId: '',
            paymentMode: '',
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
            paymentMode: 'Check',
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
        console.log(response, 'response');
        return seemlesschex_util_1.default.checkStatusWebhook(response);
    }
}
exports.default = SeemlesschexService;
//# sourceMappingURL=seemlesschex.service.js.map