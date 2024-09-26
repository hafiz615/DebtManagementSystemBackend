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
const common_util_1 = __importDefault(require("../../utils/common.util"));
const paymentLogging_repository_1 = require("../repository/paymentLogging/paymentLogging.repository");
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const constants_util_2 = __importDefault(require("../../utils/constants.util"));
const strategy_repository_1 = require("../repository/strategy/strategy.repository");
const email_util_1 = __importDefault(require("../../utils/email.util"));
const bulkUpload_repository_1 = require("../repository/bulkUpload/bulkUpload.repository");
const bulkUpload_repomodel_1 = require("../../database/repomodels/bulkUpload.repomodel");
class DebtorService {
    constructor() {
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
                console.log('i am here');
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
            const caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_2.default.notFoundMessage('case')];
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
            const justifications = await case_util_1.default.lumpSumJustifications(caseTemp, models);
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
        });
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
                SSN: debtor.basicInformation.SSID ? debtor.basicInformation.SSID : '',
                fullName: debtor.basicInformation.fullName
                    ? debtor.basicInformation.fullName
                    : '',
                companyName: debtor.businessInformation.companyName
                    ? debtor.businessInformation.companyName
                    : '',
                email: debtor.basicInformation.email
                    ? debtor.basicInformation.email
                    : '',
                status: debtor.basicInformation.status
                    ? debtor.basicInformation.status
                    : '',
                address: debtor.basicInformation.address
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
        // const getDebtor = await this.debtorRepository.getById<IDebtor>(
        //   req.params.id
        // );
        // if (!getDebtor) {
        //   return [false, constants.notFoundMessage('Debtor')];
        // }
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
            // if (
            //   getDebtor &&
            //   req.body.basicInformation &&
            //   req.body.basicInformation.weeklyBudget !==
            //     getDebtor.basicInformation.weeklyBudget
            // ) {
            //   const response = await caseUtil.checkWeeklyBudget(
            //     {debtor: req.body},
            //     true,
            //     getDebtor
            //   );
            //   if (!response.status) {
            //     return [
            //       false,
            //       'Weekly budget is not fulfiling the payment plan of debtor',
            //     ];
            //   }
            //   req.body.weeklyCommission = response.commission;
            // }
            // if (!req.body.basicInformation.weeklyBudget)
            //   req.body.basicInformation.weeklyBudget = 1;
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            debtor = await this.debtorRepository.updateById(getDebtor._id, req.body);
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
        if (req.body.paymentToken && req.body.paymentType) {
            const customerVaultResponse = await case_util_1.default.createVault(req.body.paymentToken);
            if (!customerVaultResponse[0])
                return customerVaultResponse;
            debtor = await this.debtorRepository.updateById(getDebtor._id, {
                $push: {
                    accounts: {
                        $each: [
                            {
                                paymentType: req.body.paymentType,
                                customerVaultId: customerVaultResponse[1],
                            },
                        ],
                    },
                },
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
        const allStrategyFalse = await this.caseRepository.updateById(req.params.id, {
            strategyOne_1: false,
            strategyOne_2: false,
            strategyOne_3: false,
            strategyTwo: false,
            strategyThree: false,
            justifications: false,
            lumpSumJustifications: false,
            fullProfitJustifications: false,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (allStrategyFalse) {
            const response = await case_util_1.default.getAllCreditorsOfDebtor(getDebtor);
            const creditors = Array.from(new Map(response.map(creditor => [creditor.creditorId, creditor])).values());
            let extractedFieldsTemp = null;
            if (!debtor?.extractedFields && !debtor?.extractedFields?.length) {
                const extractedFields = await case_util_1.default.getExtractionMCA(debtor);
                if (extractedFields) {
                    this.debtorRepository.updateById(getDebtor._id, {
                        extractedFields: extractedFields.extracted_fields,
                        updatedAt: common_util_1.default.getCurrentDate(),
                    });
                    extractedFieldsTemp = extractedFields.extracted_fields;
                }
            }
            case_util_1.default.getCreditorNames(getDebtor, getDebtor.extractedFields
                ? getDebtor.extractedFields
                : extractedFieldsTemp, String(caseTemp._id));
            case_util_1.default.getScoresForAllCreditors(caseTemp, creditors, getDebtor.commissionPercentage);
            case_util_1.default.getSettlementRange(caseTemp);
            case_util_1.default.getLumpSumAmount(caseTemp);
            case_util_1.default.getFullProfitSettlement(caseTemp);
        }
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
    async retryAuth(paymentId) {
        let result = false;
        const payment = await this.paymentRepository.getById(paymentId, undefined, undefined, { path: 'caseId', populate: [{ path: 'debtor' }, { path: 'creditor' }] });
        if (!payment) {
            return [false, constants_util_2.default.notFoundMessage('payment')];
        }
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
            updateObjPayment['debtorTransId'] = transactionId;
            updateObjPayment['authorized'] = 'Success';
            updateObjPayment['status'] = 'Pending';
            // paymentLogging.successReason = responseText;
            result = true;
            await email_util_1.default.sendEmailOrSmsByEvent('successful_authorization', '', paymentId, '');
        }
        else {
            updateObjPayment['failedReasonAuthorization'] = responseText;
            // paymentLogging.failReason = responseText;
            await email_util_1.default.sendEmailOrSmsByEvent('failed_authorization', '', paymentId, '');
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
        if (!payment) {
            return [false, constants_util_2.default.notFoundMessage('payment')];
        }
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
            await email_util_1.default.sendEmailOrSmsByEvent('successful_payment', '', paymentId, '');
        }
        else {
            updateObjPayment['failedReasonCaptured'] = responseText;
            // paymentLogging.failReason = responseText;
            await email_util_1.default.sendEmailOrSmsByEvent('failed_payment', '', paymentId, '');
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
        const reqTemp = req;
        const getDebtor = await this.debtorRepository.getOne({
            $or: [
                {
                    'businessInformation.companyName': req.body.businessInformation.companyName,
                },
                {
                    'businessInformation.EIN': req.body.businessInformation.EIN,
                },
            ],
        });
        let debtor = null;
        let account = [];
        if (req.body.paymentToken && req.body.paymentType) {
            const customerVaultResponse = await case_util_1.default.createVault(req.body.paymentToken);
            if (!customerVaultResponse[0])
                return customerVaultResponse;
            // req.body.customerVaultId = customerVaultResponse[1];
            account.push({
                paymentType: req.body.paymentType,
                customerVaultId: customerVaultResponse[1],
            });
        }
        if (!getDebtor) {
            if (account.length)
                req.body.accounts = account;
            debtor = await case_util_1.default.createDebtor(req.body, reqTemp.id);
        }
        if (getDebtor) {
            if (account.length)
                req.body.accounts = getDebtor.accounts.concat(account);
            // if (!req.body.basicInformation?.weeklyBudget)
            //   req.body.basicInformation.weeklyBudget = 1;
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            debtor = await this.debtorRepository.updateById(getDebtor._id, req.body);
        }
        if (!debtor) {
            return [false, constants_util_2.default.failureAddMessage('debtor')];
        }
        const creditorNames = await case_util_1.default.getCreditorNames(debtor, req.body.extractedFields);
        return [true, { debtor, creditorNames }];
    }
    async addDocumentsToDebtor(req) {
        if (!req.body.documents) {
            return [false, 'Documents are missing'];
        }
        // if (!req.body.extractedFields) {
        //   return [false, 'Extracted fields are missing'];
        // }
        const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const updatedDebtor = await this.debtorRepository.updateById(caseTemp.debtor._id, {
            $push: {
                documents: {
                    $each: req.body.documents,
                },
            },
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!updatedDebtor) {
            return [false, constants_util_1.default.failureUpdateMessage('debtor')];
        }
        // for (let doc of findCase.documents) {
        //   const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
        //   doc.url = url;
        // }
        const allStrategyFalse = await this.caseRepository.updateById(caseTemp._id, {
            strategyOne_1: false,
            strategyOne_2: false,
            strategyOne_3: false,
            strategyTwo: false,
            strategyThree: false,
            justifications: false,
            lumpSumJustifications: false,
            fullProfitJustifications: false,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (allStrategyFalse) {
            const response = await case_util_1.default.getAllCreditorsOfDebtor(updatedDebtor);
            const creditors = Array.from(new Map(response.map(creditor => [creditor.creditorId, creditor])).values());
            const extractedFields = await case_util_1.default.getExtractionMCA(updatedDebtor);
            if (extractedFields) {
                this.debtorRepository.updateById(caseTemp.debtor._id, {
                    extractedFields: extractedFields.extracted_fields,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
            if (extractedFields)
                case_util_1.default.getCreditorNames(updatedDebtor, extractedFields
                    ? extractedFields.extracted_fields
                    : updatedDebtor.extractedFields, String(caseTemp._id));
            case_util_1.default.getScoresForAllCreditors(caseTemp, creditors, updatedDebtor.commissionPercentage);
            case_util_1.default.getSettlementRange(caseTemp);
            case_util_1.default.getLumpSumAmount(caseTemp);
            case_util_1.default.getFullProfitSettlement(caseTemp);
        }
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
                if (!getDebtorBulk) {
                    const caseTemp = await this.caseRepository.getOne({
                        debtor: debtor._id,
                    });
                    const newBulkUpload = new bulkUpload_repomodel_1.BulkUpload();
                    newBulkUpload.driveUrl = body.driveUrl;
                    newBulkUpload.debtor = debtor._id;
                    if (getDebtor)
                        newBulkUpload.debtorAlreadyExisted = true;
                    if (caseTemp)
                        newBulkUpload.status = 'Duplicate';
                    newBulkUpload.createdByName = reqTemp.name;
                    newBulkUpload.createdById = reqTemp.id;
                    await this.bulkUploadRepository.create(newBulkUpload);
                    bulkCount += 1;
                }
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
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map