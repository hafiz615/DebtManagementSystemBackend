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
const common_util_1 = __importDefault(require("../../utils/common.util"));
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const strategy_repository_1 = require("../repository/strategy/strategy.repository");
const email_util_1 = __importDefault(require("../../utils/email.util"));
const bulkUpload_repository_1 = require("../repository/bulkUpload/bulkUpload.repository");
const bulkUpload_repomodel_1 = require("../../database/repomodels/bulkUpload.repomodel");
const payment_util_1 = __importDefault(require("../../utils/payment.util"));
const moneyThumb_util_1 = __importDefault(require("../../utils/moneyThumb.util"));
const debtor_util_1 = __importDefault(require("../../utils/debtor.util"));
const user_repository_1 = require("../repository/user/user.repository");
const lodash_1 = __importDefault(require("lodash"));
const googleDrive_util_1 = __importDefault(require("../../utils/googleDrive.util"));
const lodash_2 = require("lodash");
const case_service_1 = __importDefault(require("./case.service"));
const mongoose_1 = __importDefault(require("mongoose"));
const syncPaymentMethod_repository_1 = require("../repository/ISyncPaymentMethod/syncPaymentMethod.repository");
const easypay_util_1 = __importDefault(require("../../utils/easypay.util"));
const index_1 = require("../../enums/index");
const lawsuit_util_1 = __importDefault(require("../../utils/lawsuit.util"));
const lawfirm_util_1 = __importDefault(require("../../utils/lawfirm.util"));
const token_service_1 = __importDefault(require("./token.service"));
const dotenv_1 = __importDefault(require("dotenv"));
const creditor_service_1 = __importDefault(require("./creditor.service"));
const paynote_util_1 = __importDefault(require("../../utils/paynote.util"));
dotenv_1.default.config();
class DebtorService {
    constructor() {
        this.getStatementsSummary = async (req) => {
            return debtor_util_1.default.getStatementsSummary(req.params.id);
        };
        this.getStatementsSummaryWithPf = async (req) => {
            return debtor_util_1.default.getStatmentsSummaryWithPF(req.params.id);
        };
        this.getDailyCashFlows = async (req) => {
            const debtor = await this.debtorRepository.getById(req.params.id);
            if (!debtor)
                return [false, constants_util_1.default.notFoundMessage('debtor')];
            const token = await moneyThumb_util_1.default.authenticateUser();
            const card = await moneyThumb_util_1.default.getScoreCard(token, debtor.appid);
            const getDailyCashFlowsLastDate = debtor_util_1.default.getDailyCashFlowsLastDate(card['dailycashflow'].data);
            const secondLastMonth = new Date(getDailyCashFlowsLastDate.getFullYear(), getDailyCashFlowsLastDate.getMonth() - 1, 1);
            const trueCashFlows = debtor_util_1.default.getTrueCashFlows(card['dailycashflow'].data, secondLastMonth);
            const flowsDaysWeightage = debtor_util_1.default.getFlowsDaysWeightage(trueCashFlows);
            const flowsDaysPercentage = debtor_util_1.default.getFlowsDaysPercentage(flowsDaysWeightage, trueCashFlows.length);
            flowsDaysPercentage.sort((a, b) => b.percentage - a.percentage);
            const highestPercentage = flowsDaysPercentage[0].percentage;
            const highest = flowsDaysPercentage
                .filter(item => item.percentage === highestPercentage)
                .map(item => ({ [item.day]: item.percentage }));
            const others = flowsDaysPercentage
                .filter(item => item.percentage !== highestPercentage)
                .map(item => ({ [item.day]: item.percentage }));
            return { highest: highest, others: others };
        };
        this.getAllDebtors = async (req) => {
            let debtors = await this.debtorRepository.getAllWithoutPagination({}, undefined, undefined, { _id: -1 });
            if (!debtors.length) {
                return [false, constants_util_2.default.notFoundMessage('debtors')];
            }
            return [true, debtors];
        };
        this.getLumpSumAmount = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_2.default.notFoundMessage('case')];
            }
            if (caseTemp.strategyTwo) {
                const result = await this.strategyRepository.getOne({
                    caseId: String(caseTemp._id),
                    name: 'strategy_two',
                });
                if (result?.data?.lumpSumAmount)
                    return [true, result.data.lumpSumAmount];
            }
            const lumpSumResult = await case_util_1.default.getLumpSumAmount(caseTemp);
            return lumpSumResult;
        };
        this.getFullProfitSettlement = async (req) => {
            // const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
            // await caseUtil.getExtractionMCA(debtor);
            // if (!debtor) {
            //   return [false, constantsUtil.notFoundMessage('debtor')];
            const caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_2.default.notFoundMessage('case')];
            }
            if (caseTemp.strategyThree) {
                const result = await this.strategyRepository.getOne({
                    caseId: String(caseTemp._id),
                    name: 'strategy_three',
                });
                if (result?.data?.fullProfitSettlement)
                    return [true, result.data.fullProfitSettlement];
            }
            const fullProfitResult = await case_util_1.default.getFullProfitSettlement(caseTemp);
            return fullProfitResult;
        };
        this.lumpSumJustifications = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            if (!caseTemp) {
                return [false, constants_util_2.default.notFoundMessage('case')];
            }
            let lumpSum = {};
            if (caseTemp.strategyTwo) {
                const result = await this.strategyRepository.getOne({
                    caseId: String(caseTemp._id),
                    name: 'strategy_two',
                });
                lumpSum = result.data.lumpSumAmount.lumpsum_settlement;
            }
            if (caseTemp.lumpSumJustifications) {
                const result = await this.strategyRepository.getOne({
                    caseId: String(caseTemp._id),
                    name: 'lumpSumJustifications',
                });
                if (result?.data?.justifications)
                    return [true, result.data.justifications];
            }
            const models = await case_util_1.default.getJustificationModels();
            const justifications = await case_util_1.default.lumpSumJustifications(caseTemp, models, lumpSum);
            return justifications;
        };
        this.fullProfitJustifications = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_2.default.notFoundMessage('case')];
            }
            if (caseTemp.fullProfitJustifications) {
                const result = await this.strategyRepository.getOne({
                    caseId: String(caseTemp._id),
                    name: 'fullProfitJustifications',
                });
                if (result?.data?.justifications)
                    return [true, result.data.justifications];
            }
            const models = await case_util_1.default.getJustificationModels();
            const justifications = await case_util_1.default.fullProfitJustifications(caseTemp, models);
            return justifications;
        };
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.paymentService = new payment_service_1.default();
        this.strategyRepository = new strategy_repository_1.StrategyRepository();
        this.bulkUploadRepository = new bulkUpload_repository_1.BulkUploadRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.caseService = new case_service_1.default();
        this.uploadUtil = new upload_util_1.default();
        this.syncPaymentMethodRepository = new syncPaymentMethod_repository_1.SyncPaymentMethodRepository();
        this.tokenService = new token_service_1.default();
        this.creditorService = new creditor_service_1.default();
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
                {
                    'businessInformation.EIN': {
                        $regex: new RegExp(text), // Case-insensitive match for phone
                    },
                },
                {
                    'businessInformation.companyName': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for phone
                    },
                },
            ],
        }, undefined, undefined, { _id: -1 });
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async listingDetails(req) {
        let casesCount = 0;
        const findCase = await this.caseRepository.getOne({
            debtor: req.params.id,
        }, undefined, undefined, ['debtor']);
        if (!findCase) {
            const debtor = await this.debtorRepository.getById(req.params.id);
            const paymentCounts = {
                failedPayments: 0,
                failedAuthorizations: 0,
                successfulPayments: 0,
                successfulAuthorizations: 0,
            };
            const caseHistory = [];
            const debtorObj = {
                SSN: debtor?.basicInformation?.SSID ? debtor.basicInformation.SSID : '',
                fullName: debtor?.basicInformation?.fullName
                    ? debtor.basicInformation.fullName
                    : '',
                companyName: debtor?.businessInformation?.companyName
                    ? debtor.businessInformation.companyName
                    : '',
                email: debtor?.basicInformation?.email
                    ? debtor.basicInformation.email
                    : '',
                status: debtor?.basicInformation?.status
                    ? debtor.basicInformation.status
                    : '',
                address: debtor?.basicInformation?.address
                    ? debtor.basicInformation.address
                    : '',
                outstandingDebt: 0,
                totalDebt: 0,
            };
            return [
                true,
                {
                    paymentCounts,
                    caseHistory,
                    debtor: debtorObj,
                    _id: debtor._id ? String(debtor._id) : '',
                    debtorTotalCases: casesCount,
                },
            ];
        }
        const debtor = findCase.debtor;
        const token = await moneyThumb_util_1.default.authenticateUser();
        const moneyThumbApp = await moneyThumb_util_1.default.createNewApp(token, await debtor_util_1.default.normalizeCompanyName(debtor.businessInformation.companyName));
        const filterDebtor = {};
        if (!debtor?.totalStatements && moneyThumbApp['totalstatements']) {
            filterDebtor['totalStatements'] = moneyThumbApp['totalstatements'];
        }
        const curr = new Date(common_util_1.default.getCurrentDate());
        curr.setUTCHours(0, 0, 0, 0);
        if (curr.setDate(1) > new Date(debtor.percentageChangeDate).getSeconds()) {
            filterDebtor['percentageChange'] = false;
        }
        if (Object.keys(filterDebtor).length) {
            filterDebtor['updatedAt'] = common_util_1.default.getCurrentDate();
            await this.debtorRepository.updateById(debtor._id, filterDebtor);
        }
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
        if (clientDetails)
            clientDetails = await case_util_1.default.addWeekRemainingToCases(clientDetails); // Add weekRemaining to each case
        casesCount = clientDetails.caseHistory.length;
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
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        const clientDetails = await case_util_1.default.getClientListingPipeline(req, keyword);
        debtorsCount = clientDetails.length;
        const paginatedDetails = clientDetails.slice((page - 1) * limit, page * limit);
        return [
            true,
            { clientDetails: paginatedDetails, debtorsCount: debtorsCount },
        ];
    }
    async updateDebtor(req) {
        let debtor = null;
        const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const getDebtor = caseTemp.debtor;
        if (req.body.businessInformation) {
            const alreadyPresent = await this.debtorRepository.getOne({
                _id: { $ne: getDebtor._id },
                $or: [
                    {
                        'businessInformation.companyName': req.body.businessInformation.companyName,
                    },
                    {
                        'businessInformation.EIN': req.body.businessInformation.EIN,
                    },
                ],
            });
            if (alreadyPresent) {
                if (alreadyPresent.businessInformation.companyName ===
                    req.body.businessInformation.companyName) {
                    return [
                        false,
                        constants_util_1.default.alreadyExistsMessage(`Debtor with companyName ${req.body.businessInformation.companyName}`),
                    ];
                }
                if (alreadyPresent.businessInformation.EIN ===
                    req.body.businessInformation.EIN) {
                    return [
                        false,
                        constants_util_1.default.alreadyExistsMessage(`Debtor with EIN ${req.body.businessInformation.EIN}`),
                    ];
                }
            }
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            debtor = await this.debtorRepository.updateById(getDebtor._id, req.body);
            if (getDebtor.basicInformation.weeklyBudget !==
                debtor.basicInformation.weeklyBudget ||
                getDebtor.profitMargin !== debtor.profitMargin) {
                await this.caseRepository.updateById(req.params.id, {
                    settlementRange: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
        }
        if (req.body.contact && req.query.contact === 'add') {
            debtor = await this.debtorRepository.updateById(getDebtor._id, {
                $push: { contacts: req.body.contact },
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        if (req.body.contact && req.query.contact === 'edit') {
            debtor = await this.debtorRepository.updateByOne({
                _id: getDebtor._id,
                contacts: { $elemMatch: { _id: req.body.contact._id } },
            }, {
                $set: { 'contacts.$': req.body.contact },
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async updateDebtorBulk(req) {
        let debtor = null;
        const getDebtor = await this.debtorRepository.getById(req.params.id);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        const alreadyPresent = await this.debtorRepository.getOne({
            _id: { $ne: getDebtor._id },
            $or: [
                {
                    'businessInformation.companyName': req.body.businessInformation.companyName,
                },
                {
                    'businessInformation.EIN': req.body.businessInformation.EIN,
                },
            ],
        });
        if (alreadyPresent) {
            if (alreadyPresent.businessInformation.companyName ===
                req.body.businessInformation.companyName) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage(`Debtor with companyName ${req.body.businessInformation.companyName}`),
                ];
            }
            if (alreadyPresent.businessInformation.EIN ===
                req.body.businessInformation.EIN) {
                return [
                    false,
                    constants_util_1.default.alreadyExistsMessage(`Debtor with EIN ${req.body.businessInformation.EIN}`),
                ];
            }
        }
        req.body.updatedAt = common_util_1.default.getCurrentDate();
        debtor = await this.debtorRepository.updateById(getDebtor._id, req.body);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async retryAuth(paymentId) {
        let result = false;
        let payment = await this.paymentRepository.getById(paymentId, undefined, undefined, { path: 'caseId', populate: 'debtor' });
        if (!payment) {
            return [false, constants_util_2.default.notFoundMessage('payment')];
        }
        const legalFeeAmount = await lawsuit_util_1.default.getLegalFee(payment.caseId);
        const serviceFeeAmount = await lawsuit_util_1.default.getServiceFee(payment.caseId);
        if (payment.authorized === 'Success') {
            return [false, 'Payment already authorized'];
        }
        let payments = [];
        let debtor = null;
        let amount = 0;
        if (payment.caseId)
            debtor = payment.caseId?.debtor;
        if (!payment.caseId) {
            debtor = await this.debtorRepository.getById(payment.debtorId);
        }
        if (payment.paymentReference) {
            payments = await payment_util_1.default.getAllPaymentReferenceDocuments(payment.paymentReference);
            console.log(payments, 'getAllPaymentReferenceDocuments');
            payment = payments.find(payment => {
                return payment.caseId === null;
            });
            amount = payment.amount;
        }
        if (!payment.paymentReference) {
            amount = payment.amount + legalFeeAmount + serviceFeeAmount;
            // amount = payment.amount;
            payments.push(payment);
        }
        let response;
        const accounts = debtor.accounts;
        let responseNum = '';
        for (const account of accounts) {
            if (account.paymentType === 'cc') {
                response = await this.paymentService.authorizeCreditCard(amount, account.customerVaultId, account.platform);
                responseNum = new url_1.URLSearchParams(response).get('response');
                if (responseNum === '1')
                    break;
            }
        }
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            updateObjPayment['serviceFee'] = serviceFeeAmount;
            updateObjPayment['legalFee'] = legalFeeAmount;
            // updateObjPayment['status'] = 'Pending';
            result = true;
            await email_util_1.default.sendEmailOrSmsByEvent('successful_authorization', '', paymentId, '');
        }
        else {
            updateObjPayment['failedReasonAuthorization'] = responseText;
            await email_util_1.default.sendEmailOrSmsByEvent('failed_authorization', '', paymentId, '');
        }
        if (Object.keys(updateObjPayment).length) {
            for (const payment of payments) {
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
        if (result)
            return [true, 'Payment authorized successfully!'];
        return [false, 'Unable to authorize payment!'];
    }
    async retryCapture(paymentId) {
        let result = false;
        let payment = await this.paymentRepository.getById(paymentId, undefined, undefined, { path: 'caseId', populate: [{ path: 'debtor' }, { path: 'creditor' }] });
        if (!payment) {
            return [false, constants_util_2.default.notFoundMessage('payment')];
        }
        if (payment.captured === 'Success') {
            return [false, 'Payment already captured'];
        }
        let payments = [];
        let debtor = null;
        if (payment.caseId)
            debtor = payment.caseId.debtor;
        if (!payment.caseId) {
            debtor = await this.debtorRepository.getById(payment.debtorId);
        }
        let amount = 0;
        if (payment.paymentReference) {
            payments = await payment_util_1.default.getAllPaymentReferenceDocuments(payment.paymentReference);
            payment = payments.find(payment => {
                return payment.caseId === null;
            });
            if (payments.length > 1) {
                const total = payments.reduce((sum, obj) => sum + obj.amount, 0);
                amount = total - payment.amount;
            }
        }
        if (!payment.paymentReference) {
            payments.push(payment);
        }
        let response;
        let responseNum = '';
        const accounts = debtor.accounts;
        for (const account of accounts) {
            if (account.paymentType === 'cc') {
                response = await this.paymentService.captureCreditCard(account.customerVaultId, payment.debtorTransId, account.platform);
            }
            if (account.paymentType === 'ck') {
                response = await this.paymentService.achCredit(account.customerVaultId, payment.amount, account.platform);
            }
            responseNum = new url_1.URLSearchParams(response).get('response');
            if (responseNum === '1')
                break;
        }
        const responseText = new url_1.URLSearchParams(response).get('responsetext');
        // const paymentLogging = new PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
            const transactionId = new url_1.URLSearchParams(response).get('transactionid');
            updateObjPayment['captured'] = 'Success';
            updateObjPayment['status'] = 'Pending';
            lawsuit_util_1.default.updatePaymentLawsuit(payments);
            if (!payment.debtorTransId) {
                updateObjPayment['debtorTransId'] = transactionId;
            }
            result = true;
            await email_util_1.default.sendEmailOrSmsByEvent('successful_capture', '', paymentId, '');
            console.log(amount, 'amounttttt');
            if (amount) {
                const commissionAmount = parseFloat((payment.amount - amount).toFixed(2));
                // await this.paymentRepository.updateById<IPayment>(payment._id, {
                //   amount: commissionAmount,
                // });
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: commissionAmount },
                });
            }
            if (!amount && payment.caseId === null) {
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: payment.amount },
                });
            }
            // if (!amount && payment.caseId !== null && payment.commision) {
            //   await this.debtorRepository.updateById(payment.debtorId, {
            //     $inc: {commissionPaid: payment.commision},
            //   });
            // }
        }
        else {
            updateObjPayment['failedReasonCaptured'] = responseText;
            await email_util_1.default.sendEmailOrSmsByEvent('failed_capture', '', paymentId, '');
        }
        if (Object.keys(updateObjPayment).length) {
            for (const payment of payments) {
                await this.paymentRepository.updateById(payment._id, updateObjPayment);
            }
        }
        if (result)
            return [true, 'Payment captured successfully!'];
        return [false, 'Unable to capture payment!'];
    }
    async createDebtor(body, id) {
        // const reqTemp: any = req;
        const getDebtor = await this.debtorRepository.getOne({
            $or: [
                {
                    'businessInformation.companyName': body.businessInformation.companyName,
                },
                {
                    'businessInformation.EIN': body.businessInformation.EIN,
                },
            ],
        });
        let debtor = null;
        let lawsuitExtractedFields = {};
        if (!getDebtor) {
            if (body.basicInformation.weeklyBudget) {
                body.weeklyBudgetStrategy1 = body.basicInformation.weeklyBudget;
            }
            if (body?.lawsuitDocuments?.length) {
                lawsuitExtractedFields = await case_util_1.default.getExtractionLawsuit(body?.lawsuitDocuments);
                body.lawsuitFields = [lawsuitExtractedFields.result];
            }
            debtor = await case_util_1.default.createDebtor(body, id);
        }
        else {
            const newFiles = await this.updateDebtorIdExist(getDebtor, body);
            if (newFiles?.lawsuitDocuments.length) {
                lawsuitExtractedFields = await case_util_1.default.getExtractionLawsuit(newFiles?.lawsuitDocuments);
                if (lawsuitExtractedFields?.result) {
                    body.lawsuitFields = getDebtor?.lawsuitFields
                        ? [...getDebtor.lawsuitFields, lawsuitExtractedFields.result]
                        : [lawsuitExtractedFields.result];
                }
            }
            body.lawsuitDocuments = getDebtor?.lawsuitDocuments.length
                ? [...getDebtor.lawsuitDocuments, ...newFiles.lawsuitDocuments]
                : newFiles.lawsuitDocuments;
            body.bankStatementDocuments = getDebtor?.bankStatementDocuments.length
                ? [
                    ...getDebtor.bankStatementDocuments,
                    ...newFiles.bankStatementDocuments,
                ]
                : newFiles.bankStatementDocuments;
            body.mcaDocuments = getDebtor?.mcaDocuments.length
                ? [...getDebtor.mcaDocuments, ...newFiles.mcaDocuments]
                : newFiles.mcaDocuments;
            body.otherDocuments = getDebtor?.otherDocuments.length
                ? [...getDebtor.otherDocuments, ...newFiles.otherDocuments]
                : newFiles.otherDocuments;
            body.updatedAt = common_util_1.default.getCurrentDate();
            debtor = await this.debtorRepository.updateById(getDebtor._id, body);
        }
        if (!debtor) {
            return [false, constants_util_2.default.failureAddMessage('debtor')];
        }
        if (lawsuitExtractedFields?.result) {
            const lawfirmTemp = await lawfirm_util_1.default.lawfirmDetails(lawsuitExtractedFields, id);
            await lawfirm_util_1.default.upsertLawfirm(lawfirmTemp);
        }
        moneyThumb_util_1.default.run(debtor, await debtor_util_1.default.normalizeCompanyName(debtor.businessInformation.companyName));
        const creditorNames = await case_util_1.default.getCreditorNames(debtor, body.extractedFields);
        return [true, { debtor, creditorNames }];
    }
    async addDocumentsToDebtor(req) {
        let reqTemp = req;
        const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor', 'creditor']);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        let lawsuitExtractedFields = [];
        const newFiles = await this.updateDebtorIdExist(caseTemp.debtor, req.body);
        if (newFiles?.lawsuitDocuments.length) {
            lawsuitExtractedFields = await case_util_1.default.getExtractionLawsuit(newFiles?.lawsuitDocuments);
        }
        const updateData = {
            $push: {
                mcaDocuments: { $each: newFiles.mcaDocuments },
                bankStatementDocuments: { $each: newFiles.bankStatementDocuments },
                otherDocuments: { $each: newFiles.otherDocuments },
                lawsuitDocuments: { $each: newFiles.lawsuitDocuments },
            },
            updatedAt: common_util_1.default.getCurrentDate(),
        };
        if (lawsuitExtractedFields?.result) {
            updateData.$push.lawsuitFields = { $each: [lawsuitExtractedFields.result] };
        }
        const updatedDebtor = await this.debtorRepository.updateById(caseTemp.debtor._id, updateData);
        if (!updatedDebtor) {
            return [false, constants_util_1.default.failureUpdateMessage('debtor')];
        }
        if (req.query.lawfirmCancelPlan === 'true') {
            await lawsuit_util_1.default.cancelPlan(caseTemp.debtor._id, caseTemp.creditor._id);
        }
        // if (!caseTemp.lawsuitExist && lawfirmCancelPlan === 'true') {
        //   const lawsuitFields =
        //     updatedDebtor.lawsuitFields?.find(
        //       lawsuit =>
        //         lawsuit.plaintiff_company ===
        //           caseTemp.creditor.businessInformation.companyName &&
        //         lawsuit.defendant_company ===
        //           caseTemp.debtor.businessInformation.companyName
        //     ) || null;
        //   if (lawsuitFields) {
        //     if (caseTemp.dummyLawsuitExist) {
        //       await lawsuitUtil.deleteLawsuit(
        //         caseTemp.debtor._id,
        //         caseTemp.creditor._id
        //       );
        //     }
        //     const lawsuitDetails = await lawsuitUtil.lawsuitDetails(
        //       lawsuitFields,
        //       reqTemp.id
        //     );
        //     const lawfirmTemp = await lawsuitUtil.lawsuitFormation(
        //       lawsuitDetails,
        //       caseTemp
        //     );
        //     if (lawfirmTemp) {
        //       await this.caseRepository.updateById(req.params.id, {
        //         lawsuitExist: true,
        //         dummyLawsuitExist: false,
        //       });
        //     }
        //   }
        // }
        if (newFiles.bankStatementDocuments.length) {
            this.caseRepository.updateById(req.params.id, {
                settlementRange: false,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            await moneyThumb_util_1.default.run(updatedDebtor, await debtor_util_1.default.normalizeCompanyName(updatedDebtor.businessInformation.companyName));
        }
        const statements = caseTemp.debtor?.totalStatements;
        if (caseTemp.intervals.length && !updatedDebtor.percentageChange) {
            debtor_util_1.default.percentageChangeEmail(updatedDebtor.businessInformation.companyName, String(updatedDebtor._id), statements ? statements : 0, caseTemp.debtor?.basicInformation?.fullName, req.params.id);
        }
        return [true, []];
    }
    async getExtractedFields(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp) {
            return [false, constants_util_2.default.notFoundMessage('case')];
        }
        const extractedFields = await case_util_1.default.getExtractionMCA(req.body);
        if (!extractedFields) {
            return [false, constants_util_2.default.notFoundMessage('extrcated data')];
        }
        return [true, extractedFields];
    }
    async createMultipleDebtors(req) {
        const debtors = req.body.debtors;
        const reqTemp = req;
        let bulkCount = 0;
        for (const body of debtors) {
            let getDebtor = null;
            if (body?.businessInformation?.companyName ||
                body?.businessInformation?.EIN) {
                getDebtor = await this.debtorRepository.getOne({
                    $or: [
                        {
                            'businessInformation.companyName': body.businessInformation.companyName,
                        },
                        {
                            'businessInformation.EIN': body.businessInformation.EIN,
                        },
                    ],
                });
            }
            let debtor = null;
            // let account = [];
            // if (body.paymentToken && body.paymentType) {
            //   const customerVaultResponse = await caseUtil.createVault(
            //     body.paymentToken
            //   );
            //   if (!customerVaultResponse[0]) return customerVaultResponse;
            //   // req.body.customerVaultId = customerVaultResponse[1];
            //   account.push({
            //     paymentType: body.paymentType,
            //     customerVaultId: customerVaultResponse[1],
            //   });
            // }
            if (!getDebtor) {
                // if (account.length) body.accounts = account;
                body.bulkUpload = true;
                debtor = await case_util_1.default.createDebtor(body, reqTemp.id);
            }
            if (getDebtor) {
                // if (account.length) body.accounts = getDebtor.accounts.concat(account);
                // if (!body.basicInformation?.weeklyBudget)
                //   body.basicInformation.weeklyBudget = 1;
                // body.updatedAt = commonUtil.getCurrentDate();
                // debtor = await this.debtorRepository.updateById<IDebtor>(
                //   getDebtor._id,
                //   body
                // );
                debtor = getDebtor;
            }
            if (body.driveUrl) {
                const getDebtorBulk = await this.bulkUploadRepository.getOne({
                    driveUrl: body.driveUrl,
                });
                const newBulkUpload = new bulkUpload_repomodel_1.BulkUpload();
                newBulkUpload.driveUrl = body.driveUrl;
                newBulkUpload.debtor = debtor._id;
                newBulkUpload.createdByName = reqTemp.name;
                newBulkUpload.createdById = reqTemp.id;
                if (getDebtorBulk) {
                    newBulkUpload.status = 'Duplicate';
                }
                if (!getDebtorBulk) {
                    const caseTemp = await this.caseRepository.getOne({
                        debtor: debtor._id,
                    });
                    // const newBulkUpload = new BulkUpload();
                    // newBulkUpload.driveUrl = body.driveUrl;
                    // newBulkUpload.debtor = debtor._id;
                    if (caseTemp)
                        newBulkUpload.status = 'Duplicate';
                    // newBulkUpload.createdByName = reqTemp.name;
                    // newBulkUpload.createdById = reqTemp.id;
                    // await this.bulkUploadRepository.create<IBulkUpload>(
                    //   newBulkUpload as any
                    // );
                }
                await this.bulkUploadRepository.create(newBulkUpload);
                bulkCount += 1;
            }
        }
        if (!bulkCount) {
            return [
                false,
                constants_util_2.default.alreadyExistsMessage('Bulk upload with same drive urls'),
            ];
        }
        return [true, constants_util_1.default.successAddMessage('Debtors')];
    }
    async addDebtorAccount(req) {
        const getDebtor = await this.debtorRepository.getById(req.params.id);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        const debtorName = getDebtor?.basicInformation?.fullName;
        const customerVaultResponse = await case_util_1.default.createVault(req.body.paymentToken, req.body.platform, debtorName);
        if (!customerVaultResponse[0])
            return customerVaultResponse;
        await this.debtorRepository.updateById(getDebtor._id, {
            $push: {
                accounts: {
                    $each: [
                        {
                            paymentType: req.body.paymentType,
                            customerVaultId: customerVaultResponse[1],
                            platform: req.body.platform,
                        },
                    ],
                },
            },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return [true, { customerVaultId: customerVaultResponse[1] }];
    }
    async updateDebtorAccount(req) {
        const syncId = req.params.id;
        const { customerVaultId, paymentToken, paymentType, platform } = req.body;
        const getDebtor = await this.debtorRepository.getById(syncId);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        const debtorName = getDebtor.basicInformation?.fullName;
        const customerVaultResponse = await case_util_1.default.updateVault(customerVaultId, paymentToken, platform, debtorName);
        if (!customerVaultResponse[0])
            return customerVaultResponse;
        await this.debtorRepository.updateByOne({ 'accounts.customerVaultId': customerVaultId }, {
            $set: {
                'accounts.$.paymentType': paymentType,
                updatedAt: common_util_1.default.getCurrentDate(),
            },
        });
        return [true, constants_util_1.default.successUpdateMessage('Debtor account')];
    }
    async deleteDebtorAccount(req) {
        const { id } = req.params;
        const { customerVaultId } = req.body;
        const updatedDebtor = await this.debtorRepository.updateById(id, {
            $pull: { accounts: { customerVaultId: customerVaultId } },
        });
        if (!updatedDebtor) {
            return [false, 'Debtor not found'];
        }
        return [true, constants_util_1.default.successDeleteMessage('Debtor account')];
    }
    async getDebtorSummery(req) {
        const reqTemp = req;
        const getDebtor = await this.debtorRepository.getOne({
            userId: reqTemp.id,
        });
        console.log(getDebtor);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        let getAllCreditor = await case_util_1.default.getCreditorsForDebtor(String(getDebtor._id));
        let payments = await payment_util_1.default.getPaymentsByStatusAndDebtor('Upcoming', String(getDebtor._id));
        let pendingPayments = await payment_util_1.default.getPaymentsByStatusAndDebtor('Pending', String(getDebtor._id));
        return [
            true,
            {
                creditorList: getAllCreditor,
                totalCreditor: getAllCreditor?.length ?? 0,
                totalDebt: getAllCreditor.reduce((sum, creditor) => sum + creditor.totalDebt, 0),
                weeklyRemainingPayments: pendingPayments?.length ?? 0,
                companyName: getDebtor?.businessInformation?.companyName,
                upComingPayments: payments,
            },
        ];
    }
    async saveWeeklyBudgetValues(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        const debtor = await debtor_util_1.default.saveWeeklyBudget(caseTemp, req.body);
        if (!debtor) {
            return [true, constants_util_1.default.failureUpdateMessage('weekly budget info')];
        }
        return [true, constants_util_1.default.successUpdateMessage('Weekly budget info')];
    }
    async generateVideoWithGenAi(req) {
        // let reqTemp: any;
        // const user = await this.userRepository.getById<IUser>(reqTemp.id);
        // if (!user) return [false, constants.notFoundMessage('User'), {}];
        const getDebtor = await this.debtorRepository.getById(req.params.id);
        if (!getDebtor)
            return [false, constants_util_1.default.notFoundMessage('Debtor'), {}];
        let getVideo = await debtor_util_1.default.generateVideoWithGenAi(getDebtor);
        // await emailUtil.sendEmailToDebtorForInitialOverView(
        //   getDebtor,
        //   getVideo[0]?.permalink
        // );
        return !lodash_1.default.isEmpty(getVideo[0]?.permalink)
            ? [true, []]
            : [false, constants_util_1.default.notFoundMessage('Video')];
    }
    async getMcaAndFinancials(req) {
        const reqTemp = req;
        const { mca, bankStatements } = req.body;
        const documents = mca.concat(bankStatements);
        const extractedFields = await case_util_1.default.getExtractionMCA({
            documents: documents,
        });
        if (!extractedFields)
            return [false, 'Could not extract data from documents'];
        const debtorBody = await debtor_util_1.default.mapDebtor(extractedFields.extracted_fields);
        debtorBody['extractedFields'] = extractedFields.extracted_fields;
        const createDebtor = await this.createDebtor(debtorBody, reqTemp.id);
        let finalObj = {};
        const finalArray = [];
        if (!createDebtor[0])
            return [false, constants_util_1.default.failureAddMessage('debtor')];
        await this.debtorRepository.updateById(String(createDebtor[1]['debtor']._id), { userId: reqTemp.id });
        console.log(createDebtor[1]['creditorNames'], 'createDebtor[1][creditorNames]');
        const caseTemp = await googleDrive_util_1.default.mapCreditorsCases(extractedFields.extracted_fields, createDebtor[1]['creditorNames']);
        for (const bin of caseTemp) {
            bin['platform'] = true;
            bin.creditor.platform = true;
        }
        const copyCaseTemp = (0, lodash_2.cloneDeep)(caseTemp);
        const result = await case_util_1.default.createCreditorsCases({ data: caseTemp }, reqTemp.name, reqTemp.id, String(createDebtor[1]['debtor']._id));
        if (result[0]) {
            for (let i = 0; i < copyCaseTemp.length; i++) {
                finalObj['creditorName'] =
                    copyCaseTemp[i].creditor?.businessInformation?.companyName;
                finalObj['paybackAmount'] = result[1][i].totalDebt;
                finalObj['balance'] = result[1][i].remaining;
                finalObj['apr'] = await common_util_1.default.getValuePercenatge(result[1][i].contractDetails.purchased_percentage);
                finalObj['currentPayment'] =
                    await common_util_1.default.removeDashesAndRoundBrackets(result[1][i].contractDetails.repayment_amount);
                finalObj['caseId'] = String(result[1][i]._id);
                finalArray.push(finalObj);
                finalObj = {};
            }
        }
        if (!finalArray.length)
            return [false, 'Could not create cases'];
        return [
            true,
            { creditors: finalArray, debtorId: createDebtor[1]['debtor']._id },
        ];
    }
    async analyzeAndGetSettlementRanges(req) {
        const getDebtor = await this.debtorRepository.getById(req.params.id);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        const combineResult = {};
        if (getDebtor.videoUrl)
            combineResult['videoUrl'] = getDebtor.videoUrl;
        if (!getDebtor.videoUrl) {
            const response = await debtor_util_1.default.generateVideoWithGenAi(getDebtor);
            if (Array.isArray(response)) {
                await this.debtorRepository.updateById(req.params.id, {
                    videoUrl: response[0].permalink,
                });
            }
            combineResult['videoUrl'] = response[0].permalink;
        }
        const debtorCreditors = await case_util_1.default.getAllCreditorsByCaseIds(req.body.caseIds);
        const moneyThumb = await debtor_util_1.default.getScoreCard(getDebtor);
        const scoreCard = moneyThumb.scoreCard;
        const plans = {};
        const commissionPlan = {};
        const allCreditorsResult = [];
        const creditors = [];
        const metricData = scoreCard['metrics']['metricdata'];
        if (metricData?.length) {
            const revenueArray = metricData.find(row => row[0] === 'Revenue');
            combineResult['avgMonthlySales'] = parseFloat(revenueArray[1]);
        }
        const mcaCompanies = scoreCard['mcacompanies'];
        const getTotalBudget = await moneyThumb_util_1.default.getTotalBudget(mcaCompanies);
        const getProfitAndTrueRevenue = await moneyThumb_util_1.default.getAnuallyProfitAndTrueRevenue(metricData);
        const netProfitMargin = (Math.abs(getTotalBudget) + getProfitAndTrueRevenue.profit) /
            getProfitAndTrueRevenue.trueRevenue;
        const netProfitMargin100 = netProfitMargin * 100;
        combineResult['netProfitMargin'] =
            Math.round(netProfitMargin100 * 100) / 100;
        if (debtorCreditors.length) {
            const totalRemaining = debtorCreditors.reduce((sum, obj) => sum + obj.remaining, 0);
            plans['weeklyPayment'] = parseFloat(((totalRemaining / 12 / 22) * 5).toFixed(2));
            commissionPlan['4Week'] = parseFloat((totalRemaining * 0.12).toFixed(2));
            combineResult['plans'] = plans;
            combineResult['commissionPlan'] = commissionPlan;
            for (const creditor of debtorCreditors) {
                const capture = {};
                const creditorObj = {};
                capture['name'] = creditor.creditorAccountTitle;
                capture['payableAmount'] = creditor.totalDebt;
                const balance = creditor.totalDebt - creditor.remainingAmountPaid;
                capture['balance'] = balance < 0 ? 0 : balance;
                const weeklyPayment = parseFloat(((creditor.remaining / 12 / 22) * 5).toFixed(2));
                capture['weeklyPayment'] = weeklyPayment;
                creditorObj['weeklyPayment'] = weeklyPayment;
                capture['interestRate'] = '12';
                creditorObj['name'] = creditor.creditorAccountTitle;
                // creditorObj['maximum'] = creditor.breakEven;
                // creditorObj['percentageShare'] = creditor.percentageReceivable;
                creditors.push(creditorObj);
                allCreditorsResult.push(capture);
            }
            combineResult['allCreditorsResult'] = allCreditorsResult;
            combineResult['creditors'] = creditors;
        }
        const accounts = scoreCard['accountslist']['data'];
        const yearlyResults = await debtor_util_1.default.getYearlySales(accounts);
        combineResult['yearlySales'] = yearlyResults;
        const yearlyProfitMargin = await debtor_util_1.default.getYearlyProfitMargin(scoreCard);
        combineResult['yearlyProfitMargin'] = yearlyProfitMargin;
        return [true, combineResult];
    }
    async addPaymentPlan(req) {
        let debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        if (debtor.intervals && debtor.intervals.length)
            return [false, constants_util_1.default.alreadyExistsMessage('Debtor payment plan')];
        // if (debtor.weeklyCommission)
        //   return [false, 'Weekly commission already settled'];
        // req.body.isExempt = false;
        const checkCasePayment = await case_util_1.default.checkCasePayment(req.body, debtor.totalCommission);
        if (!checkCasePayment[0])
            return checkCasePayment;
        req.body._id = null;
        req.body.debtor = req.params.id;
        debtor = await this.debtorRepository.updateById(req.params.id, {
            intervals: req.body.intervals,
            isExempt: req.body.isExempt,
        });
        req.body.intervals = debtor.intervals;
        req.body.debtorName = debtor.basicInformation.fullName;
        req.body.creditorName = '';
        case_util_1.default.createPayment(req.body);
        return [true, constants_util_1.default.successAddMessage('Payment plan')];
    }
    async addManualPayment(req) {
        let debtor = await this.debtorRepository.getById(req.body.debtorId);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        const foundPayment = await this.paymentRepository.getOne({
            debtorTransId: req.body.referenceId,
        });
        if (foundPayment)
            return [false, constants_util_1.default.alreadyExistsMessage('Reference id')];
        let updatedPayment = await this.paymentRepository.updateMany({ _id: req.body.transactionIds }, {
            authorized: 'Success',
            captured: 'Success',
            status: 'Pending',
            dueDate: req.body.transactionDate,
            debtorTransId: req.body.referenceId,
            paymentMode: req.body.transactionType,
            paymentGateway: 'Manual',
            manualCommission: req.body.commission,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!updatedPayment) {
            return [false, constants_util_1.default.failureAddMessage('Manual Payment')];
        }
        if (updatedPayment) {
            let updatedDebtor = await this.debtorRepository.updateById(req.body.debtorId, {
                $inc: { commissionPaid: req.body.commission },
            });
            if (!updatedDebtor) {
                return [false, constants_util_1.default.failureAddMessage('Manual Payment')];
            }
        }
        return [true, constants_util_1.default.successAddMessage('Manual Payment')];
    }
    async updateWeeklyBudget(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const updateDebtor = await this.debtorRepository.updateById(req.params.id, {
            'basicInformation.weeklyBudget': req.body.weeklyBudget,
        });
        if (!updateDebtor) {
            return [false, constants_util_1.default.failureUpdateMessage('debtor')];
        }
        return [true, updateDebtor];
    }
    async getManualPayments(req) {
        let debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        let manualPayments = await this.paymentRepository.getAllWithoutPagination({
            paymentMode: 'Wire',
            debtorId: req.params.id,
        }, undefined, undefined, { _id: -1 });
        if (!manualPayments.length) {
            return [false, constants_util_1.default.notFoundMessage('manual payments')];
        }
        const groupedByTransId = manualPayments.reduce((acc, item) => {
            if (!acc[item.debtorTransId]) {
                acc[item.debtorTransId] = [];
            }
            acc[item.debtorTransId].push(item);
            return acc;
        }, {});
        return [true, groupedByTransId];
    }
    async revertPayments(req) {
        let debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        let manualPayment = await this.paymentRepository.getOne({
            debtorId: req.params.id,
            debtorTransId: req.body.referenceId,
        });
        let result = await this.paymentRepository.updateMany({
            debtorId: req.params.id,
            debtorTransId: req.body.referenceId,
        }, {
            authorized: 'Pending',
            captured: 'Pending',
            status: 'Upcoming',
            debtorTransId: '',
            paymentMode: '',
            manualCommission: 0,
            paymentGateway: '',
            retriesAuth: 0,
            retriesCapture: 0,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!result) {
            return [false, 'Could not revert payments'];
        }
        if (result.modifiedCount &&
            (manualPayment.paymentMode === 'Wire' ||
                manualPayment.paymentMode === 'Check')) {
            await this.debtorRepository.updateById(req.params.id, {
                $inc: { commissionPaid: -req.body.commission },
            });
        }
        return [true, 'Payments reverted successfully'];
    }
    async getExtractFieldsAndDebtor(req) {
        const reqTemp = req;
        const files = { ...reqTemp.files };
        const debtorId = reqTemp?.body?.debtorId;
        if (!files.mcaDocuments && !debtorId) {
            return [false, constants_util_2.default.Messages.ATTATCH_FILE_ERROR];
        }
        let previousMca = [];
        let newMca = [];
        let debtorBody = [];
        if (!debtorId) {
            const extractedFields = await case_util_1.default.getExtractionMCABuffer(files.mcaDocuments);
            const lawsuitFields = await case_util_1.default.getExtractionLawsuitBuffer(files.lawsuitDocuments);
            if (typeof extractedFields === 'string')
                return [false, extractedFields];
            debtorBody = await debtor_util_1.default.mapDebtor(extractedFields.extracted_fields);
            const checkDebtorAlreadyExist = await this.checkDebtorAlreadyExist(debtorBody);
            if (checkDebtorAlreadyExist[0]) {
                previousMca = checkDebtorAlreadyExist[1].mcaDocuments.map(obj => {
                    return obj.originalFileName;
                });
                return [
                    true,
                    {
                        debtorId: String(checkDebtorAlreadyExist[1]._id),
                        extractedFields: checkDebtorAlreadyExist[1].extractedFields,
                        newMca,
                        previousMca,
                    },
                ];
            }
            const lawfirmTemp = await lawfirm_util_1.default.lawfirmDetails(lawsuitFields, reqTemp.id);
            await lawfirm_util_1.default.upsertLawfirm(lawfirmTemp);
            debtorBody['lawsuitFields'] = [lawsuitFields.result];
            debtorBody['extractedFields'] = extractedFields.extracted_fields;
            debtorBody = await this.uploadAndAssignFiles(files, debtorBody);
        }
        else {
            if (!mongoose_1.default.Types.ObjectId.isValid(debtorId)) {
                return [false, 'Invalid Debtor Id!'];
            }
            const debtorExist = await this.checkDebtor(debtorId);
            if (!debtorExist)
                return [false, constants_util_2.default.notFoundMessage('Debtor')];
            const newFiles = await this.updateDebtorIdExist(debtorExist[1], files);
            previousMca = debtorExist[1].mcaDocuments.map(obj => {
                return obj.originalFileName;
            });
            if (!newFiles.mcaDocuments.length &&
                !newFiles.bankStatementDocuments.length &&
                !newFiles.otherDocuments.length &&
                !newFiles.lawsuitDocuments.length) {
                return [
                    true,
                    {
                        debtorId: String(debtorExist[1]._id),
                        extractedFields: debtorExist[1].extractedFields,
                        newMca,
                        previousMca,
                    },
                ];
            }
            if (newFiles.lawsuitDocuments && newFiles.lawsuitDocuments.length) {
                const lawsuitFieldsNewFiles = await case_util_1.default.getExtractionLawsuitBuffer(files.lawsuitDocuments);
                debtorExist[1].lawsuitFields.push(...[lawsuitFieldsNewFiles.result]);
            }
            // Process MCA documents if any new ones exist
            if (newFiles.mcaDocuments && newFiles.mcaDocuments.length) {
                const extractedFieldsForNewFiles = await case_util_1.default.getExtractionMCABuffer(newFiles.mcaDocuments);
                if (typeof extractedFieldsForNewFiles !== 'string') {
                    debtorExist[1].extractedFields.push(...extractedFieldsForNewFiles.extracted_fields);
                    newMca = newFiles.mcaDocuments.map(obj => {
                        return obj.originalname;
                    });
                }
            }
            // Upload and assign new files to debtorBody
            const updatedDebtorBody = await this.uploadAndAssignFiles(newFiles, debtorExist[1]);
            // If debtorBody was successfully updated, save the changes
            if (updatedDebtorBody) {
                const updateResult = await this.debtorRepository.updateById(debtorExist[1]._id, updatedDebtorBody);
                // Return the updated debtor ID and extracted fields
                return [
                    true,
                    {
                        debtorId: String(updateResult._id),
                        extractedFields: updateResult.extractedFields,
                        newMca,
                        previousMca,
                    },
                ];
            }
        }
        // const lawfirmData = (await LawfirmUtil.lawfirmData(reqTemp)) as ILawfirm;
        // const createLawfirm = await LawfirmUtil.createLawfirm(lawfirmData);
        // const attorneyData = (await AttorneyUtil.attorneyData(
        //   reqTemp
        // )) as IAttorney;
        // attorneyData['lawfirmId'] = createLawfirm._id;
        // const createAttorney = await AttorneyUtil.createAttorney(attorneyData);
        return await this.createDebtorForPortal(debtorBody, 'Debtor Portal');
    }
    async updateDebtorIdExist(debtor, files) {
        return {
            mcaDocuments: await this.getNewFiles(files.mcaDocuments, debtor.mcaDocuments),
            bankStatementDocuments: await this.getNewFiles(files.bankStatementDocuments, debtor.bankStatementDocuments),
            otherDocuments: await this.getNewFiles(files.otherDocuments, debtor.otherDocuments),
            lawsuitDocuments: await this.getNewFiles(files.lawsuitDocuments, debtor.lawsuitDocuments),
        };
    }
    async getNewFiles(newFiles, existingFiles) {
        if (!newFiles || !newFiles.length)
            return [];
        const existingKeys = existingFiles?.length
            ? existingFiles?.map((doc) => doc?.originalFileName || doc?.originalname)
            : [];
        return newFiles.filter((file) => !existingKeys.includes(file?.originalname || file?.originalFileName));
    }
    async uploadAndAssignFiles(files, debtorBody) {
        const uploadAndAppend = async (fileKey, debtorKey) => {
            if (files[fileKey]?.length) {
                const uploadedFiles = await this.uploadUtil.awsS3FileUpload(files[fileKey], true);
                debtorBody[debtorKey] = debtorBody[debtorKey]?.length
                    ? [...debtorBody[debtorKey], ...uploadedFiles]
                    : uploadedFiles;
            }
        };
        await uploadAndAppend('mcaDocuments', 'mcaDocuments');
        await uploadAndAppend('bankStatementDocuments', 'bankStatementDocuments');
        await uploadAndAppend('otherDocuments', 'otherDocuments');
        await uploadAndAppend('lawsuitDocuments', 'lawsuitDocuments');
        return debtorBody;
    }
    async checkDebtor(id) {
        const debtor = await this.debtorRepository.getById(id);
        return debtor ? [true, debtor] : false;
    }
    async checkDebtorAlreadyExist(body) {
        const debtor = await this.debtorRepository.getOne({
            $or: [
                { 'businessInformation.EIN': body.businessInformation.EIN },
                {
                    'businessInformation.companyName': body.businessInformation.companyName,
                },
            ],
        });
        return debtor ? [true, debtor] : [false];
    }
    async createDebtorForPortal(body, source) {
        let previousMca = [];
        let newMca = [];
        body.status = 'Pending';
        const debtor = await case_util_1.default.createDebtor(body, source);
        newMca = debtor.mcaDocuments.map(obj => {
            return obj.originalFileName;
        });
        return debtor
            ? [
                true,
                {
                    debtorId: String(debtor._id),
                    extractedFields: debtor.extractedFields,
                    newMca,
                    previousMca,
                },
            ]
            : [false, constants_util_2.default.failureAddMessage('debtor')];
    }
    async getDebtorExtractedFields(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        const mcaDocuments = debtor.mcaDocuments.map(obj => {
            return obj.originalFileName;
        });
        const bankStatementDocuments = debtor.bankStatementDocuments.map(obj => {
            return obj.originalFileName;
        });
        const otherDocuments = debtor.otherDocuments.map(obj => {
            return obj.originalFileName;
        });
        return [
            true,
            {
                extractedFields: debtor.extractedFields,
                mcaDocuments: mcaDocuments,
                bankStatementDocuments: bankStatementDocuments,
                otherDocuments: otherDocuments,
            },
        ];
    }
    async getClientSyncEmail(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('client')];
        const result = await this.syncPaymentMethodRepository.getOne({
            syncId: req.params.id,
            platform: req.query.platform,
        });
        return result
            ? [true, result.email]
            : [true, debtor.basicInformation.email];
    }
    async clientSync(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor)
            return [false, constants_util_1.default.notFoundMessage('client')];
        const email = req.body.email.toLowerCase();
        console.log(req.body);
        if (req.body?.platform == 'Easypay direct' ||
            req.body?.platform == 'Seamlesschex merchant') {
            const platformExists = Object.values(index_1.paymentPlatform).includes(req.body?.platform);
            console.log('platform', platformExists);
            if (!platformExists)
                return [false, constants_util_1.default.Messages.INVALID_PLATFORM];
            const customers = await easypay_util_1.default.getEasyPayCustomers(req.body.platform);
            const checkClientExist = await easypay_util_1.default.checkClientExist(customers, email, req.body.platform, req.params.id, debtor);
            console.log(checkClientExist[1]['userId']);
            if (checkClientExist[0]) {
                await easypay_util_1.default.upsertDebtorEasyPayEmail(req.params.id, email, req.body.platform, checkClientExist[1]['userIds']);
            }
            return checkClientExist;
        }
        if (req.body?.platform == 'Paynote') {
            req.query.type = 'debtor';
            const result = await this.creditorService.syncPaynote(req);
            console.log('result', result);
            if (!result[0])
                return result;
            if (result[0] && !result[1].paynoteSourceIds?.length)
                return [false, 'Could not found user account'];
            const res = await paynote_util_1.default.selectPreferredPaynoteSource(result[1].paynoteSourceIds);
            const sourceIdExist = debtor.paynoteSourceIds?.includes(res.source_id);
            if (sourceIdExist)
                return [true, []];
            const updatedDebtor = await paynote_util_1.default.addPaynoteAccount(debtor._id, res.user_id, res.source_id);
            if (!updatedDebtor)
                return [false, constants_util_2.default.failureUpdateMessage('Debtor')];
            return [true, 'Account added successfully'];
        }
        return 0;
    }
    async clientFinancialSummary(req) {
        const getDebtor = await this.debtorRepository.getById(req.params.id);
        if (!getDebtor)
            return [false, constants_util_1.default.notFoundMessage('Client')];
        const cases = await this.caseRepository.getAllWithoutPagination({ debtor: req.params.id, isDeleted: false }, 'remaining');
        const totalRemaining = cases.reduce((sum, caseItem) => sum + (caseItem.remaining || 0), 0);
        const getPayments = await this.paymentRepository.getAllWithoutPagination({
            debtorId: req.params.id,
            isDeleted: false,
        }, 'authorized captured amount dueDate transactionType paymentGateway debtorName timePeriod retriesAuth retriesCapture');
        return [true, { debtBalance: totalRemaining, paymentHistory: getPayments }];
    }
    async addDebtorInvoice(req) {
        const getDebtor = await this.debtorRepository.getById(req.body.id);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        const debtorName = getDebtor?.basicInformation?.fullName;
        const response = await debtor_util_1.default.createPaymentInvoice(req.body.platform, req.body.id, req.body.amount, req.body.email, debtorName);
        if (!response[0])
            return response;
        return response;
    }
    async pauseDebtorPayments(req) {
        const reqTemp = req;
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        const pausePaymentCheck = await payment_util_1.default.pausePaymentChecks(debtor, req.body.amount);
        if (!pausePaymentCheck[0])
            return pausePaymentCheck;
        if (!debtor.additionalCharge && process.env.environment === 'prod') {
            let additionalCharge = await payment_util_1.default.getAdditionalCharge(debtor);
            if (!additionalCharge[0]) {
                await email_util_1.default.sendEmailOrSmsByEvent('failed_capture', null, null, reqTemp.id, null, debtor);
                return [false, additionalCharge[1].failedReasonAuthorization];
            }
            await email_util_1.default.sendEmailOrSmsByEvent('successful_capture', null, null, reqTemp.id, null, debtor);
            this.debtorRepository.updateById(debtor._id, {
                additionalCharge: true,
            });
        }
        let updateDebtor = null;
        let eventValue = null;
        let creditorsPayment = null;
        const filter = {
            debtorId: req.params.id,
            caseId: null,
            isDeleted: { $ne: true },
            attorneyId: null,
            authorized: { $ne: 'Success' },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash', 'Additional Charge'] },
        };
        if (req.body?.paymentId) {
            filter._id = req.body.paymentId;
        }
        const payments = await this.paymentRepository.getAllWithoutPagination(filter);
        if (!payments.length)
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        let successMessage = null;
        if (req.body.endDate) {
            const updateDatesPayment = await payment_util_1.default.pausePaymentByDay(payments, req.body.endDate);
            if (req.body.paymentId) {
                eventValue = 'pause_single_payment';
            }
            if (!eventValue)
                eventValue = 'pause_all_payments';
            successMessage = updateDatesPayment[1];
            creditorsPayment = updateDatesPayment[2];
        }
        else if (req.body.paymentId && req.body.amount) {
            const newPayment = await payment_util_1.default.changePaymentAmmount(payments[0], req.body.amount, debtor);
            if (!newPayment[0])
                return [false, newPayment[1]];
            updateDebtor = debtor_util_1.default.updateDebtorPausePayment(req.params.id, true);
            eventValue = 'change_payment_amount';
            successMessage = 'Change the payment amount';
            creditorsPayment = newPayment[2];
        }
        else if (req.body.paymentId) {
            const updatePayment = await payment_util_1.default.moveToLastPayment(payments[0], debtor, false);
            if (!updatePayment[0])
                return [false, updatePayment[1]];
            eventValue = 'move_payment_to_last';
            successMessage = 'Payments move to the last';
            creditorsPayment = updatePayment[2];
        }
        if (!updateDebtor) {
            debtor_util_1.default.updateDebtorPausePayment(req.params.id, false);
        }
        await email_util_1.default.sendEmailPausePayment(reqTemp.id, eventValue, creditorsPayment);
        return [true, constants_util_1.default.successfullyMessage(successMessage)];
    }
    async getDebtorPayments(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        const pageLimit = await common_util_1.default.getPageAndLimit(1, 10, req);
        const filter = {
            debtorId: req.params.id,
            caseId: null,
            isDeleted: { $ne: true },
            attorneyId: null,
            authorized: { $ne: 'Success' },
            paymentMode: { $nin: ['Wire', 'Check', 'Cash', 'Additional Charge'] },
        };
        const payments = await this.paymentRepository.getAllWithoutPagination(filter, undefined, undefined, { dueDate: 1 }, undefined, undefined, pageLimit.page, pageLimit.limit);
        if (!payments)
            return [true, constants_util_1.default.notFoundMessage('Payments')];
        const totalCount = await payment_util_1.default.paymentTotalCount(req.params.id);
        const getPayment = [];
        for (const payment of payments) {
            const { totalLegalFeeAmount = 0, totalServiceFeeAmount = 0, creditorsAmount = 0, } = await payment_util_1.default.getOtherPaymentsTotal(payment);
            const creditorPayments = await payment_util_1.default.getCreditorPayments(payment);
            if (!creditorPayments.length)
                continue;
            const legalFee = totalLegalFeeAmount;
            const serviceFee = totalServiceFeeAmount;
            const commissionFee = !payment.calculateComission
                ? payment.amount - legalFee - serviceFee - creditorsAmount
                : 0;
            const total = legalFee + serviceFee + commissionFee;
            getPayment.push({
                ...payment.toObject(),
                legalFee,
                serviceFee,
                commissionFee: commissionFee > 0 ? commissionFee : 0,
                creditorsAmount,
                total,
                creditorPayments,
            });
        }
        return [true, { totalCount, payments: getPayment }];
    }
    async getToken(req) {
        const getDebtor = await this.debtorRepository.getById(req.params.id);
        if (!getDebtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        const token = await this.tokenService.createVerifyToken(req.params.id, process.env.verifyKey, '1m');
        return [
            true,
            {
                token: token,
            },
        ];
    }
    async getTopPayees(req) {
        let debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        if (!debtor.appid) {
            await moneyThumb_util_1.default.run(debtor, await debtor_util_1.default.normalizeCompanyName(debtor.businessInformation.companyName));
            debtor = await this.debtorRepository.getById(req.params.id);
        }
        const result = await case_util_1.default.getTopPayees(debtor.appid, req.body.months);
        return result;
    }
    async updateCommisionPercentage(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        debtor.commissionPercentage = req.body.commission;
        const updatedDebtor = await debtor_util_1.default.updateDebtorTotalCommission(debtor);
        if (!updatedDebtor)
            return [false, constants_util_2.default.failureUpdateMessage('commision.')];
        return [true, constants_util_2.default.successUpdateMessage('Commision')];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map