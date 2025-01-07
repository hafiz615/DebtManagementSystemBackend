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
const paymentLogging_repository_1 = require("../repository/paymentLogging/paymentLogging.repository");
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const strategy_repository_1 = require("../repository/strategy/strategy.repository");
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
class DebtorService {
    constructor() {
        this.getStatementsSummary = async (req) => {
            const debtor = await this.debtorRepository.getById(req.params.id);
            const token = await moneyThumb_util_1.default.authenticateUser();
            const card = await moneyThumb_util_1.default.getScoreCard(token, debtor.appid);
            const accountDetails = debtor_util_1.default.getAccountDetails(card['accountslist'].data);
            const withDrawalTotalForMonth = debtor_util_1.default.getWithDrawalTotalForMonth(card['monthlymca'].data);
            const updatedAccountDetails = debtor_util_1.default.getUpdatedAccountDetails(accountDetails, withDrawalTotalForMonth);
            return updatedAccountDetails;
        };
        this.getDailyCashFlows = async (req) => {
            const debtor = await this.debtorRepository.getById(req.params.id);
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
        this.paymentLoggingRepository = new paymentLogging_repository_1.PaymentLoggingRepository();
        this.strategyRepository = new strategy_repository_1.StrategyRepository();
        this.bulkUploadRepository = new bulkUpload_repository_1.BulkUploadRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.caseService = new case_service_1.default();
        this.uploadUtil = new upload_util_1.default();
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
        console.log(!debtor?.totalStatements, '!debtor?.totalStatements');
        console.log(moneyThumbApp['totalstatements'], 'moneyThumbApp[totalStatements]');
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
        // console.log("Updated clientDetails: ", clientDetails);
        // if (req.query.filter === 'true' || req.query.search === 'true') {
        //   casesCount = clientDetails.caseHistory.length;
        // } else {
        //   casesCount = await this.caseRepository.getCount<ICase>({
        //     debtor: req.params.id,
        //     isDeleted: false,
        //   });
        // }
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
        // let reqTemp: any = req;
        // Check if pageNumber and pageSize are provided and valid
        if (req.query.page && !isNaN(Number(req.query.page))) {
            page = Number(req.query.page) ? Number(req.query.page) : page;
        }
        if (req.query.limit && !isNaN(Number(req.query.limit))) {
            limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
        }
        // let match = {isDeleted: {$ne: true}};
        // let countFilter = {};
        // if (keyword === 'viewClientsForSelf') {
        //   countFilter['$or'] = [
        //     {caseOwnerId: reqTemp.id},
        //     {negotiatorId: reqTemp.id},
        //     {managerId: reqTemp.id},
        //   ];
        // }
        const clientDetails = await case_util_1.default.getClientListingPipeline(req, keyword);
        // const clientDetails: any =
        //   await this.caseRepository.applyAggregate<ICase>(pipeline);
        // const clientIds = clientDetails.map(client => {
        //   return client.id;
        // });
        // console.log(clientIds, 'clientIds');
        // const remainingDebtors =
        //   await this.debtorRepository.getAllWithoutPagination<ICase>({
        //     _id: {$nin: clientIds},
        //   });
        // const remainingDebtorsFiltered = remainingDebtors.map(debtor => {
        //   return {
        //     companyName: debtor.businessInformation.companyName,
        //     totalCases: 0,
        //     totalDebt: 0,
        //     status: debtor.basicInformation.status,
        //     id: String(debtor._id),
        //     totalCreditors: 0,
        //   };
        // });
        // const allDebtors = [...clientDetails, ...remainingDebtorsFiltered];
        // console.log(allDebtors);
        // if (req.query.filter === 'true' || req.query.search === 'true') {
        //   debtorsCount = clientDetails.length;
        // } else {
        //   if (keyword === 'viewClientsForSelf') {
        //     const cases =
        //       await this.caseRepository.getAllWithoutPagination<ICase>(countFilter);
        //     const setCount = new Set<string>();
        //     for (const caseTemp of cases) {
        //       setCount.add(String(caseTemp.debtor));
        //     }
        //     debtorsCount = setCount.size;
        //   } else {
        //     debtorsCount = await this.debtorRepository.getCount<IDebtor>();
        //   }
        // }
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
        let payment = await this.paymentRepository.getById(paymentId, undefined, undefined, { path: 'caseId', populate: [{ path: 'debtor' }] });
        if (!payment) {
            return [false, constants_util_2.default.notFoundMessage('payment')];
        }
        if (payment.authorized === 'Success') {
            return [false, 'Payment already authorized'];
        }
        let payments = [];
        let debtor = null;
        let amount = 0;
        if (payment.caseId)
            debtor = payment.caseId.debtor;
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
            if (payment.commision)
                amount = payment.amount + payment.commision;
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
            // updateObjPayment['status'] = 'Pending';
            result = true;
            // await emailUtil.sendEmailOrSmsByEvent(
            //   'successful_authorization',
            //   '',
            //   paymentId,
            //   ''
            // );
        }
        else {
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // await emailUtil.sendEmailOrSmsByEvent(
            //   'failed_authorization',
            //   '',
            //   paymentId,
            //   ''
            // );
        }
        console.log(payments, 'paymentssssss');
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
            if (!payment.debtorTransId) {
                updateObjPayment['debtorTransId'] = transactionId;
            }
            result = true;
            // await emailUtil.sendEmailOrSmsByEvent(
            //   'successful_payment',
            //   '',
            //   paymentId,
            //   ''
            // );
            console.log(amount, 'amounttttt');
            if (amount) {
                const commissionAmount = payment.amount - amount;
                await this.paymentRepository.updateById(payment._id, {
                    amount: commissionAmount,
                });
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: commissionAmount },
                });
            }
            if (!amount && payment.caseId === null) {
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: payment.amount },
                });
            }
            if (!amount && payment.caseId !== null && payment.commision) {
                await this.debtorRepository.updateById(payment.debtorId, {
                    $inc: { commissionPaid: payment.commision },
                });
            }
        }
        else {
            updateObjPayment['failedReasonCaptured'] = responseText;
            // await emailUtil.sendEmailOrSmsByEvent(
            //   'failed_payment',
            //   '',
            //   paymentId,
            //   ''
            // );
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
        // let account = [];
        // if (body.paymentToken && body.paymentType) {
        //   const customerVaultResponse = await caseUtil.createVault(
        //     body.paymentToken,
        //     debtor?.basicInformation?.fullName
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
            if (body.basicInformation.weeklyBudget) {
                body.weeklyBudgetStrategy1 = body.basicInformation.weeklyBudget;
            }
            debtor = await case_util_1.default.createDebtor(body, id);
        }
        if (getDebtor) {
            // if (account.length) body.accounts = getDebtor.accounts.concat(account);
            // if (!req.body.basicInformation?.weeklyBudget)
            //   req.body.basicInformation.weeklyBudget = 1;
            body.updatedAt = common_util_1.default.getCurrentDate();
            // if (body?.documents && body?.documents?.length)
            //   body.documents = getDebtor.documents.concat(body.documents);
            debtor = await this.debtorRepository.updateById(getDebtor._id, body);
        }
        if (!debtor) {
            return [false, constants_util_2.default.failureAddMessage('debtor')];
        }
        moneyThumb_util_1.default.run(debtor, await debtor_util_1.default.normalizeCompanyName(debtor.businessInformation.companyName));
        const creditorNames = await case_util_1.default.getCreditorNames(debtor, body.extractedFields);
        return [true, { debtor, creditorNames }];
    }
    async addDocumentsToDebtor(req) {
        // if (!req.body.extractedFields) {
        //   return [false, 'Extracted fields are missing'];
        // }
        const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const updatedDebtor = await this.debtorRepository.updateById(caseTemp.debtor._id, {
            $push: {
                mcaDocuments: {
                    $each: req.body.mcaDocuments,
                },
                bankStatementDocuments: {
                    $each: req.body.bankStatementDocuments,
                },
                otherDocuments: {
                    $each: req.body.otherDocuments,
                },
            },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!updatedDebtor) {
            return [false, constants_util_1.default.failureUpdateMessage('debtor')];
        }
        this.caseRepository.updateById(req.params.id, {
            settlementRange: false,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        await moneyThumb_util_1.default.run(updatedDebtor, await debtor_util_1.default.normalizeCompanyName(updatedDebtor.businessInformation.companyName));
        return [true, updatedDebtor];
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
        if (!getDebtor?.basicInformation?.fullName) {
            return [false, 'Could not find debtor name'];
        }
        const debtorName = getDebtor?.basicInformation?.fullName;
        const customerVaultResponse = await case_util_1.default.createVault(req.body.paymentToken, debtorName, req.body.platform);
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
        return [true, constants_util_1.default.successAddMessage('Debtor account details')];
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
        for (const iterator of caseTemp) {
            console.log(iterator, 'okokokok');
        }
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
        // await creditorUtil.addCreditorPercentagesAndGetPercentageCommission(
        //   debtorCreditors,
        //   getDebtor,
        //   moneyThumb.scoreCard
        // );
        // await creditorUtil.addBreakEven(debtorCreditors);
        const plans = {};
        const commissionPlan = {};
        const allCreditorsResult = [];
        const creditors = [];
        const metricData = scoreCard['metrics']['metricdata'];
        if (metricData?.length) {
            const revenueArray = metricData.find(row => row[0] === 'Revenue');
            console.log(revenueArray, 'revenueArray');
            combineResult['avgMonthlySales'] = parseFloat(revenueArray[1]);
        }
        const mcaCompanies = scoreCard['mcacompanies'];
        const getTotalBudget = await moneyThumb_util_1.default.getTotalBudget(mcaCompanies);
        console.log(getTotalBudget, 'getTotalBudget');
        const getProfitAndTrueRevenue = await moneyThumb_util_1.default.getAnuallyProfitAndTrueRevenue(metricData);
        console.log(getProfitAndTrueRevenue, 'getProfitAndTrueRevenue');
        const netProfitMargin = (Math.abs(getTotalBudget) + getProfitAndTrueRevenue.profit) /
            getProfitAndTrueRevenue.trueRevenue;
        console.log(netProfitMargin, 'netProfitMargin');
        const netProfitMargin100 = netProfitMargin * 100;
        combineResult['netProfitMargin'] =
            Math.round(netProfitMargin100 * 100) / 100;
        if (debtorCreditors.length) {
            // const data = getScoresSettlementRange[1];
            // plans['maximum'] = debtorCreditors.reduce(
            //   (sum, obj) => sum + obj.breakEven,
            //   0
            // );
            // plans['percentageShare'] = debtorCreditors.reduce(
            //   (sum, obj) => sum + obj.percentageReceivable,
            //   0
            // );
            const totalRemaining = debtorCreditors.reduce((sum, obj) => sum + obj.remaining, 0);
            plans['weeklyPayment'] = parseFloat(((totalRemaining / 12 / 22) * 5).toFixed(2));
            // const benefits = await debtorUtil.getBenefits(
            //   plans,
            //   scoreCard,
            //   getDebtor,
            //   debtorCreditors,
            //   totalRemaining
            // );
            // combineResult['benefits'] = benefits;
            console.log(totalRemaining, 'totalRemaining');
            // commissionPlan['lumpSum'] = parseFloat((totalRemaining * 0.1).toFixed(2));
            commissionPlan['4Week'] = parseFloat((totalRemaining * 0.12).toFixed(2));
            // commissionPlan['4month'] = parseFloat((totalRemaining * 0.19).toFixed(2));
            console.log(commissionPlan, 'commissionPlan');
            console.log(plans, 'planssss');
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
            console.log(allCreditorsResult, 'allCreditorsResult');
            console.log(creditors, 'creditors');
            combineResult['allCreditorsResult'] = allCreditorsResult;
            combineResult['creditors'] = creditors;
        }
        const accounts = scoreCard['accountslist']['data'];
        const yearlyResults = await debtor_util_1.default.getYearlySales(accounts);
        console.log(yearlyResults, 'yearlyResults');
        combineResult['yearlySales'] = yearlyResults;
        const yearlyProfitMargin = await debtor_util_1.default.getYearlyProfitMargin(scoreCard);
        console.log(yearlyProfitMargin, 'yearlyProfitMargin');
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
        if (debtor.weeklyCommission)
            return [false, 'Weekly commission already settled'];
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
            transactionType: req.body.transactionType,
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
            transactionType: 'Wire',
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
            transactionType: '',
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
            (manualPayment.transactionType === 'Wire' ||
                manualPayment.transactionType === 'Check')) {
            await this.debtorRepository.updateById(req.params.id, {
                $inc: { commissionPaid: -req.body.commission },
            });
        }
        return [true, 'Payments reverted successfully'];
    }
    // async getExtractFieldsAndDebtor(req: Request) {
    //   const reqTemp: any = req;
    //   const files = {...reqTemp.files};
    //   // console.log("this is the file:", files)
    //   if (!files.mcaDocuments) {
    //     return [false, constantsUtil.Messages.ATTATCH_FILE_ERROR];
    //   }
    //   // return [true, 'Succesfully show files']
    //   // const s3FileKeys = await this.uploadUtil.awsS3FileUpload(files);
    //   // if (!s3FileKeys.length) {
    //   //   return [false, constantsUtil.Messages.UPLOAD_FILES_FAILURE];
    //   // }
    //   const extractedFields = await caseUtil.getExtractionMCABuffer(files.mcaDocuments[0]); // check the debtor exist?
    //   if (typeof extractedFields === 'string') return [false, extractedFields];
    //   const debtorBody = await debtorUtil.mapDebtor(
    //     extractedFields.extracted_fields
    //   );
    //   debtorBody['extractedFields'] = extractedFields.extracted_fields;
    //   const checkDebtor = this.checkDebtorExist(debtorBody);
    //   if(!checkDebtor)
    //   {
    //     if(files.mcaDocuments.length > 1){
    //       const extractedFieldsForMultipleFiles = await caseUtil.getExtractionMCABuffer(files.mcaDocuments);
    //       if (typeof extractedFieldsForMultipleFiles === 'string') return [false, extractedFieldsForMultipleFiles];
    //       const debtorBody = await debtorUtil.mapDebtor(
    //         extractedFieldsForMultipleFiles.extracted_fields
    //       );
    //       debtorBody['extractedFields'] = extractedFieldsForMultipleFiles.extracted_fields;
    //       if(files.mcaDocuments){
    //         const s3McaDocument = await this.uploadUtil.awsS3FileUpload(files.mcaDocuments);
    //         debtorBody['mcaDocuments'] = s3McaDocument;
    //       }
    //       else if(files.bankStatementDocuments){
    //         const s3BankStatementDocument = await this.uploadUtil.awsS3FileUpload(files.bankStatementDocuments);
    //         debtorBody['bankStatementDocuments'] = s3BankStatementDocument;
    //       }
    //       else if(files.otherDocuments)
    //       {
    //         const s3OtherDocument = await this.uploadUtil.awsS3FileUpload(files.otherDocuments);
    //         debtorBody['otherDocuments'] = s3OtherDocument;
    //       }
    //       // if (!s3FileKeys.length) {
    //       //   return [false, constantsUtil.Messages.UPLOAD_FILES_FAILURE];
    //       // }
    //       debtorBody['extractedFields'] = extractedFieldsForMultipleFiles.extracted_fields;
    //       const createDebtor = await this.createDebtorForPortal(
    //         debtorBody,
    //         'Debtor Portal'
    //       );
    //     }
    //     if(files.mcaDocuments){
    //       const s3McaDocument = await this.uploadUtil.awsS3FileUpload(files.mcaDocuments);
    //       debtorBody['mcaDocuments'] = s3McaDocument;
    //     }
    //     else if(files.bankStatementDocuments){
    //       const s3BankStatementDocument = await this.uploadUtil.awsS3FileUpload(files.bankStatementDocuments);
    //       debtorBody['bankStatementDocuments'] = s3BankStatementDocument;
    //     }
    //     else if(files.otherDocuments)
    //     {
    //       const s3OtherDocument = await this.uploadUtil.awsS3FileUpload(files.otherDocuments);
    //       debtorBody['otherDocuments'] = s3OtherDocument;
    //     }
    //     const createDebtor = await this.createDebtorForPortal(
    //       debtorBody,
    //       'Debtor Portal'
    //     );
    //   }
    //   // debtorBody['documents'] = s3FileKeys;
    //   const createDebtor = await this.createDebtorForPortal(
    //     debtorBody,
    //     'Debtor Portal'
    //   );
    //   if (!createDebtor[0]) return [false, createDebtor[1]];
    //   const debtor = createDebtor[1] as IDebtor;
    //   return [
    //     true,
    //     {debtorId: String(debtor._id), extractedFields: debtor.extractedFields},
    //   ];
    // }
    async getExtractFieldsAndDebtor(req) {
        const reqTemp = req;
        const files = { ...reqTemp.files };
        console.log("this is the file", files);
        // return [true, "success"];
        if (!files.mcaDocuments) {
            return [false, constants_util_2.default.Messages.ATTATCH_FILE_ERROR];
        }
        const extractedFields = await case_util_1.default.getExtractionMCABuffer(files.mcaDocuments);
        if (typeof extractedFields === 'string')
            return [false, extractedFields];
        let debtorBody = await debtor_util_1.default.mapDebtor(extractedFields.extracted_fields);
        const debtorExist = await this.checkDebtorExist(debtorBody);
        console.log(debtorExist);
        let previousMca = [];
        let newMca = [];
        if (!debtorExist[0]) {
            debtorBody['extractedFields'] = extractedFields.extracted_fields;
            debtorBody = await this.uploadAndAssignFiles(files, debtorBody);
        }
        else {
            const newFiles = await this.updateDebtorIdExist(debtorExist[1], files);
            if (!newFiles.mcaDocuments.length && !newFiles.bankStatementDocuments.length && !newFiles.otherDocuments.length) {
                return [true, { debtorId: String(debtorExist[1]._id), extractedFields: debtorExist[1].extractedFields }];
            }
            // Process MCA documents if any new ones exist
            if (newFiles.mcaDocuments && newFiles.mcaDocuments.length) {
                const extractedFieldsForNewFiles = await case_util_1.default.getExtractionMCABuffer(newFiles.mcaDocuments);
                if (typeof extractedFieldsForNewFiles === 'string') {
                    return [true, { debtorId: String(debtorExist[1]._id), extractedFields: debtorExist[1].extractedFields }]; // Return error if extraction fails
                }
                debtorExist[1].extractedFields.push(...extractedFieldsForNewFiles.extracted_fields);
                console.log(newFiles, 'newFiles');
                newMca = newFiles.mcaDocuments.map((obj) => { return obj.originalname; });
            }
            previousMca = debtorExist[1].mcaDocuments.map((obj) => { return obj.originalFileName; });
            // Upload and assign new files to debtorBody
            const updatedDebtorBody = await this.uploadAndAssignFiles(newFiles, debtorExist[1]);
            // If debtorBody was successfully updated, save the changes
            if (updatedDebtorBody) {
                const updateResult = await this.debtorRepository.updateById(debtorExist[1]._id, updatedDebtorBody);
                // Return the updated debtor ID and extracted fields
                return [true, { debtorId: String(updateResult._id), extractedFields: updateResult.extractedFields, newMca, previousMca }];
            }
        }
        return await this.createDebtorForPortal(debtorBody, 'Debtor Portal');
    }
    async updateDebtorIdExist(debtor, files) {
        // Compare MCA Documents
        const mcaDocuments = await this.getNewFiles(files.mcaDocuments, debtor.mcaDocuments);
        // Compare Bank Statement Documents
        const bankStatementDocuments = await this.getNewFiles(files.bankStatementDocuments, debtor.bankStatementDocuments);
        // Compare Other Documents
        const otherDocuments = await this.getNewFiles(files.otherDocuments, debtor.otherDocuments);
        // Return the newly uploaded files that don't already exist in the debtor
        return {
            mcaDocuments,
            bankStatementDocuments,
            otherDocuments,
        };
    }
    async getNewFiles(newFiles, existingFiles) {
        if (!newFiles || newFiles.length === 0)
            return [];
        const existingKeys = existingFiles?.map((doc) => doc.originalFileName);
        return newFiles.filter((file) => !existingKeys.includes(file.originalname));
    }
    async processMultipleFiles(files, debtorBody) {
        const extractedFieldsForMultipleFiles = await case_util_1.default.getExtractionMCABuffer(files.mcaDocuments);
        if (typeof extractedFieldsForMultipleFiles === 'string')
            return [false, extractedFieldsForMultipleFiles];
        debtorBody['extractedFields'] = extractedFieldsForMultipleFiles.extracted_fields;
        debtorBody = await this.uploadAndAssignFiles(files, debtorBody);
        return debtorBody;
    }
    async uploadAndAssignFiles(files, debtorBody) {
        if (files.mcaDocuments && files.mcaDocuments.length) {
            const s3McaDocument = await this.uploadUtil.awsS3FileUpload(files.mcaDocuments);
            if (debtorBody.mcaDocuments && debtorBody.mcaDocuments.length) {
                // Append new files to the existing ones
                debtorBody['mcaDocuments'] = [...debtorBody.mcaDocuments, ...s3McaDocument];
            }
            else {
                debtorBody['mcaDocuments'] = s3McaDocument;
            }
        }
        if (files.bankStatementDocuments && files.bankStatementDocuments) {
            const s3BankStatementDocument = await this.uploadUtil.awsS3FileUpload(files.bankStatementDocuments);
            if (debtorBody.bankStatementDocuments && debtorBody.bankStatementDocuments.length) {
                // Append new files to the existing ones
                debtorBody['bankStatementDocuments'] = [...debtorBody.bankStatementDocuments, ...s3BankStatementDocument];
            }
            else {
                debtorBody['bankStatementDocuments'] = s3BankStatementDocument;
            }
        }
        if (files.otherDocuments && files.otherDocuments.length) {
            const s3OtherDocument = await this.uploadUtil.awsS3FileUpload(files.otherDocuments);
            if (debtorBody.otherDocuments && debtorBody.otherDocuments.length) {
                // Append new files to the existing ones
                debtorBody['otherDocuments'] = [...debtorBody.otherDocuments, ...s3OtherDocument];
            }
            else {
                debtorBody['otherDocuments'] = s3OtherDocument;
            }
        }
        return debtorBody;
    }
    async checkDebtorExist(body) {
        const getDebtor = await this.debtorRepository.getOne({
            $or: [
                {
                    'businessInformation.EIN': body.businessInformation.EIN,
                },
                {
                    'businessInformation.companyName': body.businessInformation.companyName,
                }
            ],
        });
        if (getDebtor)
            return [true, getDebtor];
        return false;
    }
    async createDebtorForPortal(body, source) {
        body['status'] = 'Pending';
        let debtor = await case_util_1.default.createDebtor(body, source);
        if (!debtor) {
            return [false, constants_util_2.default.failureAddMessage('debtor')];
        }
        return [true, { debtorId: String(debtor._id), extractedFields: debtor.extractedFields }];
    }
    async getDebtorExtractedFields(req) {
        const debtor = await this.debtorRepository.getById(req.params.id);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('debtor')];
        }
        return [true, debtor.extractedFields];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map