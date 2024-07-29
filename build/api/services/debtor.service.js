"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const url_1 = require("url");
const payment_repository_1 = require("../repository/payment/payment.repository");
const payment_service_1 = __importDefault(require("./payment.service"));
const paymentLogging_repomodel_1 = require("../../database/repomodels/paymentLogging.repomodel");
const paymentLogging_repository_1 = require("../repository/paymentLogging/paymentLogging.repository");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
class DebtorService {
    constructor() {
        this.getAllDebtors = async (req) => {
            let debtors = await this.debtorRepository.getAllWithoutPagination();
            if (!debtors.length) {
                return [false, constants_util_2.default.notFoundMessage('debtors')];
            }
            return [true, debtors];
        };
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.paymentService = new payment_service_1.default();
        this.paymentLoggingRepository = new paymentLogging_repository_1.PaymentLoggingRepository();
    }
    async getDebtor(text) {
        const debtor = await this.debtorRepository.getAll({
            $or: [
                {
                    'basicInformation.email': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for email
                    },
                },
                {
                    'basicInformation.fullName': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for email
                    },
                },
                {
                    'basicInformation.SSID': {
                        $regex: new RegExp(text), // Case-insensitive match for SSID
                    },
                },
                {
                    'basicInformation.phone': {
                        $regex: new RegExp(text), // Case-insensitive match for phone
                    },
                },
            ],
        });
        // const uploadUtil = new UploadUtil();
        // for (let doc of debtor[0].documents) {
        //   const url = await uploadUtil.getS3FileSignedUrl(doc.key);
        //   console.log(url);
        // }
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async listingDetails(req) {
        let casesCount = 0;
        let page = 1;
        let limit = 5;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        let clientDetails = await case_util_1.default.getClientDetails(req);
        if (req.query.filter === 'true' || req.query.search === 'true') {
            casesCount = clientDetails.caseHistory.length;
        }
        else {
            casesCount = await this.caseRepository.getCount({
                debtor: req.params.id,
                isDeleted: false,
            });
        }
        if (!clientDetails) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        clientDetails.caseHistory = clientDetails?.caseHistory?.slice((page - 1) * limit, page * limit);
        return [true, { ...clientDetails, debtorTotalCases: casesCount }];
    }
    async searchListing(req, keyword) {
        let debtorsCount = 0;
        let page = 1;
        let limit = 10;
        let reqTemp = req;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        let match = { isDeleted: { $ne: true } };
        let countFilter = {};
        if (keyword === 'viewClientsForSelf') {
            match['$or'] = [
                { caseOwnerId: reqTemp.id },
                { negotiatorId: reqTemp.id },
                { managerId: reqTemp.id },
            ];
            countFilter['$or'] = [
                { caseOwnerId: reqTemp.id },
                { negotiatorId: reqTemp.id },
                { managerId: reqTemp.id },
            ];
        }
        const pipeline = await case_util_1.default.getClientListingPipeline(req, match);
        const clientDetails = await this.caseRepository.applyAggregate(pipeline);
        if (req.query.filter === 'true' || req.query.search === 'true') {
            debtorsCount = clientDetails.length;
        }
        else {
            if (keyword === 'viewClientsForSelf') {
                const cases = await this.caseRepository.getAllWithoutPagination(countFilter);
                const setCount = new Set();
                for (const caseTemp of cases) {
                    setCount.add(String(caseTemp.debtor));
                }
                debtorsCount = setCount.size;
            }
            else {
                debtorsCount = await this.debtorRepository.getCount();
            }
        }
        const paginatedDetails = clientDetails.slice((page - 1) * limit, page * limit);
        return [
            true,
            { clientDetails: paginatedDetails, debtorsCount: debtorsCount },
        ];
    }
    async updateDebtor(req) {
        let debtor = null;
        if (req.body.basicInformation) {
            const email = req.body.basicInformation.email.toLowerCase();
            const getDebtor = await this.debtorRepository.getOne({
                $or: [
                    {
                        'basicInformation.email': email,
                    },
                    {
                        'basicInformation.SSID': req.body.basicInformation.SSID,
                    },
                    {
                        'basicInformation.phone': req.body.basicInformation.phone,
                    },
                ],
            });
            if (getDebtor) {
                if (getDebtor.basicInformation.email === email &&
                    String(getDebtor._id) !== req.params.id) {
                    return [
                        false,
                        constants_util_1.default.alreadyExistsMessage('Debtor with basicInformation.email'),
                    ];
                }
                if (getDebtor.basicInformation.SSID === req.body.basicInformation.SSID &&
                    String(getDebtor._id) !== req.params.id) {
                    return [
                        false,
                        constants_util_1.default.alreadyExistsMessage('Debtor with basicInformation.SSN'),
                    ];
                }
                if (getDebtor.basicInformation.phone ===
                    req.body.basicInformation.phone &&
                    String(getDebtor._id) !== req.params.id) {
                    return [
                        false,
                        constants_util_1.default.alreadyExistsMessage('Debtor with basicInformation.phone'),
                    ];
                }
            }
            if (getDebtor &&
                req.body.basicInformation &&
                req.body.basicInformation.weeklyBudget !==
                    getDebtor.basicInformation.weeklyBudget) {
                const response = await case_util_1.default.checkWeeklyBudget({ debtor: req.body }, true, getDebtor);
                if (!response.status) {
                    return [
                        false,
                        'Weekly budget is not fulfiling the payment plan of debtor',
                    ];
                }
                req.body.weeklyCommission = response.commission;
            }
            debtor = await this.debtorRepository.updateById(req.params.id, req.body);
        }
        if (req.body.contact) {
            debtor = await this.debtorRepository.updateById(req.params.id, {
                $push: { contacts: req.body.contact },
            });
        }
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async retryAuth(paymentId) {
        let result = false;
        const payment = await this.paymentRepository.getById(paymentId, undefined, undefined, { path: 'caseId', populate: [{ path: 'debtor' }, { path: 'creditor' }] });
        let response;
        if (payment.caseId.debtor.paymentType === 'cc') {
            response = await this.paymentService.authorizeCreditCard(payment.amount, payment.caseId.debtor.customerVaultId);
        }
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            console.log(transactionId, 'transactionId');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            updateObjPayment['status'] = 'Pending';
            // paymentLogging.successReason = responseText;
            result = true;
        }
        else {
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // paymentLogging.failReason = responseText;
            console.log('send email through template');
        }
        if (Object.keys(updateObjPayment).length) {
            const newPayment = new paymentLogging_repomodel_1.PaymentLogging();
            const populatedPayment = dataCopier_util_1.DataCopier.copy(newPayment, payment);
            const verifiedPayment = dataCopier_util_1.DataCopier.copy(populatedPayment, updateObjPayment);
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
            await this.paymentLoggingRepository.create(verifiedPayment);
        }
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.paymentType = 'Credit Auth';
        // paymentLogging.debtor = String(payment.caseId.debtor._id);
        // paymentLogging.creditor = String(payment.caseId.creditor._id);
        if (result)
            return [true, 'Payment authorized successfully!'];
        return [false, 'Unable to authorize payment!'];
    }
    async retryCapture(paymentId) {
        let result = false;
        const payment = await this.paymentRepository.getById(paymentId, undefined, undefined, { path: 'caseId', populate: [{ path: 'debtor' }, { path: 'creditor' }] });
        let response;
        if (payment.caseId.debtor.paymentType === 'cc') {
            response = await this.paymentService.captureCreditCard(payment.caseId.debtor.customerVaultId, payment.debtorTransId, payment.caseId.creditor.creditorSecurityKey);
        }
        if (payment.caseId.debtor.paymentType === 'ck') {
            response = await this.paymentService.achCredit(payment.caseId.debtor.customerVaultId, payment.amount, payment.caseId.creditor.creditorSecurityKey);
        }
        const responseNum = new url_1.URLSearchParams(response).get('response');
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const paymentLogging = new paymentLogging_repomodel_1.PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['captured'] = 'Success';
            updateObjPayment['status'] = 'Success';
            if (payment.caseId.debtor.paymentType === 'ck') {
                updateObjPayment['debtorTransId'] = transactionId;
            }
            // paymentLogging.successReason = responseText;
            result = true;
        }
        else {
            updateObjPayment['failedReasonCaptured'] = responseText;
            // paymentLogging.failReason = responseText;
            console.log('send email'); // add code
        }
        if (Object.keys(updateObjPayment).length) {
            const newPayment = new paymentLogging_repomodel_1.PaymentLogging();
            const populatedPayment = dataCopier_util_1.DataCopier.copy(newPayment, payment);
            const verifiedPayment = dataCopier_util_1.DataCopier.copy(populatedPayment, updateObjPayment);
            await this.paymentRepository.updateById(payment._id, updateObjPayment);
            await this.paymentLoggingRepository.create(verifiedPayment);
        }
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.paymentType = 'Credit Capture';
        // paymentLogging.debtor = String(payment.caseId.debtor._id);
        // paymentLogging.creditor = String(payment.caseId.creditor._id);
        // await this.paymentLoggingRepository.create(paymentLogging as any);
        if (result)
            return [true, 'Payment captured successfully!'];
        return [false, 'Unable to capture payment!'];
    }
    async createDebtor(req) {
        req.body.basicInformation.email =
            req.body.basicInformation.email.toLowerCase();
        const getDebtor = await this.debtorRepository.getOne({
            $or: [
                {
                    'basicInformation.email': req.body.basicInformation.email,
                },
                {
                    'basicInformation.SSID': req.body.basicInformation.SSID,
                },
                {
                    'basicInformation.phone': req.body.basicInformation.phone,
                },
                {
                    'businessInformation.companyName': req.body.businessInformation.companyName,
                },
            ],
        });
        let debtor = null;
        if (req.body.paymentToken && req.body.paymentType) {
            const customerVaultResponse = await case_util_1.default.createVault(req.body.paymentToken);
            if (!customerVaultResponse[0])
                return customerVaultResponse;
            req.body.customerVaultId = customerVaultResponse[1];
        }
        if (!getDebtor) {
            debtor = await case_util_1.default.createDebtor(req.body);
        }
        if (getDebtor) {
            debtor = await this.debtorRepository.updateById(getDebtor._id, req.body);
        }
        if (!debtor) {
            return [false, constants_util_2.default.failureAddMessage('debtor')];
        }
        const creditorNames = await case_util_1.default.getCreditorNames(debtor, req.body.extractedFields);
        return [true, { debtor, creditorNames }];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map