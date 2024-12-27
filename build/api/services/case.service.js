"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callUpload_util_1 = __importDefault(require("../../utils/callUpload.util"));
const twilio_1 = require("twilio");
const user_repository_1 = require("../repository/user/user.repository");
const case_repository_1 = require("../repository/case/case.repository");
const case_util_1 = __importDefault(require("../../utils/case.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const upload_util_1 = __importDefault(require("../../utils/upload.util"));
const targetCF_repository_1 = require("../repository/targetCustomFields/targetCF.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
const chatSummary_repomodel_1 = require("../../database/repomodels/chatSummary.repomodel");
const chatSummary_repository_1 = require("../repository/chatSummary/chatSummary.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
const strategy_repository_1 = require("../repository/strategy/strategy.repository");
const creditor_util_1 = __importDefault(require("../../utils/creditor.util"));
const email_util_1 = __importDefault(require("../../utils/email.util"));
const caseHistory_repository_1 = require("../repository/caseHistory/caseHistory.repository");
const justification_repository_1 = require("../repository/justification/justification.repository");
const bulkUpload_repository_1 = require("../repository/bulkUpload/bulkUpload.repository");
const debtor_util_1 = __importDefault(require("../../utils/debtor.util"));
const moneyThumb_util_1 = __importDefault(require("../../utils/moneyThumb.util"));
const inbox_repository_1 = require("../repository/inbox/inbox.repository");
const uuid_1 = require("uuid");
const settings_repository_1 = require("../repository/setting/settings.repository");
const settings_util_1 = __importDefault(require("../../utils/settings.util"));
const { jwt: { AccessToken }, } = require('twilio');
const VoiceGrant = AccessToken.VoiceGrant;
class CaseService {
    constructor() {
        this.createCase = async (req) => {
            const reqTemp = req;
            if (req.query.bulk === 'true') {
                const casesArray = [];
                for (const tempCase of req.body.cases) {
                    const checkCasePayment = await case_util_1.default.checkCasePayment(tempCase);
                    if (!checkCasePayment[0])
                        return checkCasePayment;
                    const result = await case_util_1.default.createCase(tempCase, reqTemp.role, reqTemp.email);
                    if (result[0]) {
                        casesArray.push(result[1]);
                    }
                }
                if (!casesArray.length)
                    return [false, constants_util_1.default.failureAddMessage('cases')];
                return [true, casesArray];
            }
            const checkCasePayment = await case_util_1.default.checkCasePayment(req.body);
            if (!checkCasePayment[0])
                return checkCasePayment;
            const result = await case_util_1.default.createCase(req.body, reqTemp.name, reqTemp.id);
            if (!result[0])
                return [false, result[1]];
            return [true, result[1]];
        };
        this.getAllCases = async (req) => {
            let cases = await this.caseRepository.getAll({ isDeleted: false }, undefined, undefined, { _id: -1 }, undefined, undefined, Number(req.query.page), Number(req.query.limit));
            if (!cases.length) {
                return [false, constants_util_1.default.notFoundMessage('Cases')];
            }
            // for (let temp of cases) {
            //   for (let doc of temp.documents) {
            //     const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
            //     doc.url = url;
            //   }
            // }
            return [true, cases];
        };
        this.getCaseById = async (req) => {
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'creditor' }, { path: 'debtor' }]);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            if (!findCase?.getCaseIdPercentage &&
                !findCase?.debtor?.strategy1MaxProfit &&
                !findCase?.debtor?.strategy3MaxProfit) {
                await moneyThumb_util_1.default.run(findCase.debtor, await debtor_util_1.default.normalizeCompanyName(findCase.debtor.businessInformation.companyName));
                this.caseRepository.updateById(req.params.id, {
                    getCaseIdPercentage: true,
                });
            }
            const amountNotDelivered = await this.getAmountNotDeliveredToCreditor(req.params.id);
            const amountDelivered = await this.getAmountNotDeliveredToCreditor(req.params.id);
            for (let doc of findCase.debtor.documents) {
                const url = await this.uploadUtil.getS3FileSignedUrl(doc.key
                //'application/pdf'
                );
                doc.url = url;
            }
            const cases = await case_util_1.default.getAllCreditorsOfDebtorForCase(findCase.debtor._id, findCase.creditor._id);
            // const creditors: any = cases.map(caseTemp => {
            //   return caseTemp.creditor;
            // });
            const uniqueResult = Array.from(new Map(cases.map(caseTemp => [String(caseTemp.creditor._id), caseTemp])).values());
            const temp = await this.targetCFRepository.getOne({
                target: 'case',
                caseId: req.params.id,
            });
            // await debtorUtil.updateDebtorTotalCommission(findCase.debtor);
            const updateNotesForm = findCase.notes.length !== 0
                ? await Promise.all(findCase.notes.map(async (note) => {
                    const userName = await this.userRepository.getById(note.userId);
                    return {
                        ...note,
                        userName: userName?.name ?? 'Unknown User', // Add a default name if user is not found
                    };
                }))
                : [];
            const templates = await settings_util_1.default.getEmailSmsTemplates();
            findCase['emailTemplates'] = templates.emailTemplates;
            findCase['smsTemplates'] = templates.smsTemplates;
            findCase['allEmails'] = await case_util_1.default.getAllEmailsOfCase(findCase, uniqueResult);
            findCase['creditors'] = uniqueResult;
            findCase['customFields'] = temp ? temp.customFields : [];
            findCase['notes'] = updateNotesForm ?? [];
            findCase['amountDeliveredToCreditor'] = amountDelivered;
            findCase['amountNotDeliveredToCreditor'] = amountNotDelivered;
            return [true, findCase];
        };
        this.updateCase = async (req) => {
            let reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            if (!findCase)
                return [false, constants_util_1.default.notFoundMessage('case')];
            const getDebtor = findCase.debtor;
            if (req.body.creditor) {
                const getCreditor = await this.creditorRepository.getById(req.body.creditor._id);
                if (!getCreditor) {
                    return [false, constants_util_1.default.notFoundMessage('creditor')];
                }
                if (req.body.creditor.businessInformation) {
                    const alreadyPresent = await this.creditorRepository.getOne({
                        _id: { $ne: req.body.creditor._id },
                        'businessInformation.companyName': req.body.creditor.businessInformation.companyName,
                    });
                    if (alreadyPresent) {
                        return [
                            false,
                            constants_util_1.default.alreadyExistsMessage(`Creditor with companyName ${req.body.creditor.businessInformation.companyName}`),
                        ];
                    }
                    req.body.creditor.updatedAt = common_util_1.default.getCurrentDate();
                    await this.creditorRepository.updateById(req.body.creditor._id, req.body.creditor);
                }
                await case_util_1.default.updateCreditor(req.body.creditor);
                delete req.body.creditor;
            }
            // if (
            //   req.body?.intervals &&
            //   req.body?.intervals.length &&
            //   findCase.intervals.length
            // ) {
            //   return [false, 'Payment plan already exist!'];
            // }
            // if (req.body?.intervals?.length && req.body?.commission) {
            //   if (!getDebtor?.intervals && !getDebtor.intervals?.length) {
            //     await this.debtorRepository.updateById<IDebtor>(findCase.debtor._id, {
            //       weeklyCommission: req.body.commission,
            //       updatedAt: commonUtil.getCurrentDate(),
            //     });
            //   }
            //   findCase.intervals = req.body?.intervals;
            //   findCase.isExempt = req.body.isExempt;
            //   const checkCasePayment = await caseUtil.checkCasePayment(findCase);
            //   if (!checkCasePayment[0]) return checkCasePayment;
            // }
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            if (req.body.paidAmount && req.body.paidAmount > 0) {
                req.body.remaining = req.body.totalDebt - req.body.paidAmount;
                if (req.body.remaining < 0)
                    req.body.remaining = 0;
                req.body.remainingAmountPaid = req.body.paidAmount;
            }
            if (req.body?.paidAmount && req.body.paidAmount === 0)
                req.body.remainingAmountPaid = 0;
            let caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (!caseUpdated) {
                return [false, constants_util_1.default.failureUpdateMessage('case')];
            }
            await case_util_1.default.addInHistory({
                Time: new Date(common_util_1.default.getCurrentDate()),
                Action: 'Case Updated',
                'Updated By': reqTemp.name,
            }, caseUpdated._id);
            // if (req.body.intervals && req.body.intervals.length) {
            //   caseUtil.createPayment(caseUpdated);
            // }
            // await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, false, true);
            caseUpdated = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            const allStrategyFalse = await this.caseRepository.updateById(caseUpdated._id, {
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
                if (!getDebtor?.extractedFields && !getDebtor?.extractedFields?.length) {
                    const extractedFields = await case_util_1.default.getExtractionMCA(getDebtor);
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
                    : extractedFieldsTemp, String(findCase._id));
                case_util_1.default.getScoresForAllCreditors(caseUpdated, creditors, getDebtor.commissionPercentage);
                case_util_1.default.getSettlementRange(findCase);
                case_util_1.default.getLumpSumAmount(caseUpdated);
                // caseUtil.getFullProfitSettlement(caseUpdated);
            }
            return [true, caseUpdated];
        };
        this.updateCaseAbout = async (req) => {
            let reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id);
            if (!findCase)
                return [false, constants_util_1.default.notFoundMessage('case')];
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            const caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (!caseUpdated) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            // await this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, true, false);
            await case_util_1.default.addInHistory({
                Time: new Date(common_util_1.default.getCurrentDate()),
                Action: 'Case Updated',
                'Updated By': reqTemp.name,
            }, caseUpdated._id);
            return [true, caseUpdated];
        };
        // getAIIntegrationData = async (
        //   req: Request
        // ): Promise<[boolean, {} | string]> => {
        //   const caseTemp = await this.caseRepository.getById<ICase>(
        //     req.params.id,
        //     undefined,
        //     undefined,
        //     ['debtor']
        //   );
        //   const response = await caseUtil.getAIWrapperData(req, caseTemp);
        //   return [true, response];
        // };
        this.getSummary = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            const response = await case_util_1.default.getSummary(req, caseTemp);
            if (response[0]) {
                const newSummary = new chatSummary_repomodel_1.ChatSummary();
                newSummary.chatId = caseTemp.chatId;
                newSummary.prompt = req.body.humanInput;
                newSummary.chat = response[1];
                await this.chatSummaryRepository.create(newSummary);
            }
            return response;
        };
        this.getAIToken = async (req) => {
            const response = await case_util_1.default.getAIToken('test', 'test');
            return [true, response];
        };
        this.getCaseSummaries = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, 'chatId', undefined, ['debtor']);
            const response = await this.chatSummaryRepository.getAllWithoutPagination({
                chatId: caseTemp.chatId,
            }, undefined, undefined);
            if (!response.length) {
                return [false, constants_util_1.default.notFoundMessage('Summaries')];
            }
            return [true, response];
        };
        this.getCreditorNames = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            const response = await case_util_1.default.getAllCreditorsOfDebtor(caseTemp.debtor);
            const uniqueResult = Array.from(new Map(response.map(creditor => [creditor.creditorId, creditor])).values());
            return [true, uniqueResult];
        };
        this.getScores = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            let getScores = null;
            if (req.body.creditorNames.length) {
                const cases = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: req.body.creditorNames } }, undefined, undefined, { _id: -1 }, ['creditor']);
                const creditors = cases.map(obj => ({
                    totalDebt: obj.totalDebt,
                    caseCode: obj.caseCode,
                    remaining: obj.remaining,
                    status: obj.status,
                    name: obj.creditor.basicInformation.fullName,
                    caseId: String(obj._id),
                    creditorId: String(obj.creditor._id),
                    creditorAccountTitle: obj.creditor.accountTitle
                        ? obj.creditor.accountTitle
                        : '',
                }));
                getScores = await case_util_1.default.getScores(caseTemp, creditors, caseTemp.debtor.commissionPercentage);
            }
            return getScores;
        };
        this.getSettlementRange = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            const response = await case_util_1.default.getSettlementRange(caseTemp);
            return [true, response];
        };
        this.getCreditorHistory = async (req) => {
            if (!String(req.query.creditorId)) {
                return [false, 'Creditor id is missing'];
            }
            const response = await case_util_1.default.getCreditorHistory(req);
            return [true, response];
        };
        this.createCreditorsCases = async (req) => {
            const reqTemp = req;
            let dataArray = req.body.data;
            for (const body of dataArray) {
                const checkCasePayment = await case_util_1.default.checkCasePayment(body);
                if (!checkCasePayment[0])
                    return checkCasePayment;
            }
            const result = await case_util_1.default.createCreditorsCases(req.body, reqTemp.name, reqTemp.id, req.params.id);
            // if (!result[0]) return result;
            return result;
        };
        this.getScoresSettlementRange = async (all, hardReload, body, caseId) => {
            console.log(caseId, 'llklklk');
            const caseTemp = await this.caseRepository.getById(caseId, undefined, undefined, [{ path: 'debtor' }]);
            if (!caseTemp)
                return [false, constants_util_1.default.notFoundMessage('case')];
            let getScores = null, creditorNames = null;
            let creditors = null;
            let settlementRange = null;
            // let hardReload = 'false';
            let data = {};
            // if (req.query.hardReload && req.query.hardReload === 'true')
            //   hardReload = 'true';
            const moneyThumb = await debtor_util_1.default.getScoreCard(caseTemp.debtor);
            if (hardReload === 'true') {
                await this.caseRepository.updateById(caseTemp._id, {
                    strategyTwo: false,
                    strategyThree: false,
                    justifications: false,
                    lumpSumJustifications: false,
                    fullProfitJustifications: false,
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                await moneyThumb_util_1.default.saveData(moneyThumb.appid, moneyThumb.scoreCard, caseTemp.debtor);
                caseTemp.debtor = await debtor_util_1.default.saveWeeklyBudget(caseTemp, body);
            }
            const debtor = caseTemp.debtor;
            creditors = await case_util_1.default.getAllCreditorsOfDebtor(debtor);
            creditors = await creditor_util_1.default.checkCreditorsMapping(creditors);
            creditors = Array.from(new Map(creditors.map(creditor => [creditor.creditorAccountTitle, creditor])).values());
            const commisionPercentage = await creditor_util_1.default.addCreditorPercentagesAndGetPercentageCommission(creditors, debtor, moneyThumb.scoreCard);
            await creditor_util_1.default.addBreakEven(creditors);
            data['percentageReceivableCommission'] = commisionPercentage[0];
            data['maxProfitCommission'] = commisionPercentage[1];
            data['percentageReceivableCommissionAmount'] = commisionPercentage[2];
            data['totalCommission'] = debtor.totalCommission;
            data['creditorsContractDetailsSum'] =
                await this.calculateContractDetailsSum(creditors);
            const result = await this.strategyRepository.getOne({
                caseId: String(caseTemp._id),
                name: 'strategy_one',
            });
            data['creditors'] = creditors;
            data['debtor'] = debtor;
            // return [true, data];
            const values = await moneyThumb_util_1.default.getMonthlyProfitValues(moneyThumb.scoreCard, debtor);
            data['averageMonthlyProfitExcludingPayments'] =
                values.averageMonthlyProfitExcludingPayments;
            data['averageMonthlyProfitIncludingPayments'] =
                values.averageMonthlyProfitIncludingPayments;
            data['currentMonthlyProfitExcludingPayments'] =
                values.currentMonthlyProfitExcludingPayments;
            data['currentMonthlyProfitIncludingPayments'] =
                values.currentMonthlyProfitIncludingPayments;
            if (hardReload !== 'true' &&
                caseTemp.strategyOne_1 &&
                result?.data?.creditorNames) {
                creditorNames = result.data.creditorNames;
                data['creditorNames'] = creditorNames;
            }
            if (hardReload === 'true') {
                let extractedFieldsTemp = [];
                if (!debtor?.extractedFields?.length) {
                    const extractedFields = await case_util_1.default.getExtractionMCA(debtor);
                    if (extractedFields) {
                        this.debtorRepository.updateById(debtor._id, {
                            extractedFields: extractedFields.extracted_fields,
                            updatedAt: common_util_1.default.getCurrentDate(),
                        });
                        extractedFieldsTemp = extractedFields.extracted_fields;
                    }
                }
                creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields ? debtor.extractedFields : extractedFieldsTemp, String(caseTemp._id));
                data['creditorNames'] = creditorNames;
                if (typeof creditorNames === 'string') {
                    data['getScores'] = null;
                    data['settlementRange'] = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                    return [true, data];
                }
            }
            if (all === 'true') {
                if (hardReload !== 'true' &&
                    caseTemp.strategyOne_2 &&
                    result?.data?.getScoresAIForAllCreditors) {
                    getScores = result.data.getScoresAIForAllCreditors;
                    data['getScores'] = getScores;
                }
                else {
                    getScores = await case_util_1.default.getScoresForAllCreditors(caseTemp, creditors, debtor.commissionPercentage);
                    data['getScores'] = getScores;
                    if (typeof getScores === 'string') {
                        data['settlementRange'] = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                        return [true, data];
                    }
                    data['debtor'] = await this.debtorRepository.getById(debtor._id);
                }
            }
            else {
                if (body.creditorNames.length) {
                    const casesCreditors = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: body.creditorNames }, debtor: debtor }, undefined, undefined, { _id: -1 }, ['creditor']);
                    getScores = await case_util_1.default.getScores(caseTemp, casesCreditors, debtor.commissionPercentage);
                    data['getScores'] = getScores;
                    if (typeof getScores === 'string') {
                        data['settlementRange'] = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                        return [true, data];
                    }
                    data['debtor'] = await this.debtorRepository.getById(debtor._id);
                }
            }
            if (hardReload !== 'true' &&
                caseTemp.strategyOne_3 &&
                result?.data?.settlementRange) {
                settlementRange = result.data.settlementRange;
            }
            else {
                settlementRange = await case_util_1.default.getSettlementRange(caseTemp);
                if (typeof settlementRange === 'string') {
                    settlementRange = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                }
            }
            await creditor_util_1.default.addWeeklyTrueAmount(creditors, settlementRange);
            await creditor_util_1.default.replaceSettlementRangeAndWeeksTillPaid(creditors, settlementRange, caseId, true);
            data['settlementRange'] = settlementRange;
            return [true, data];
        };
        this.addNotes = async (req) => {
            let result;
            const reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            let Action = 'Add Notes';
            const notes = req.body.notes;
            if (typeof findCase.notes === 'string') {
                result = await this.caseRepository.updateById(req.params.id, {
                    $set: {
                        notes: [
                            {
                                userId: reqTemp.id,
                                value: notes,
                                createdAt: common_util_1.default.getCurrentDate(),
                            },
                        ],
                    },
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                Action = 'Update Notes';
            }
            else
                result = await case_util_1.default.addNotes(req, reqTemp.id);
            if (!result)
                return [false, result];
            // await emailUtil.sendEmailOrSmsByEvent(
            //   'case_details_update',
            //   result._id,
            //   '',
            //   reqTemp.id
            // );
            await case_util_1.default.addInHistory({
                Action,
                Username: reqTemp.name,
                Content: notes,
                Time: new Date(common_util_1.default.getCurrentDate()),
            }, findCase._id);
            return [true, result];
        };
        // createCall = async (req: Request): Promise<[boolean, ICase | string]> => {
        //   const reqTemp: any = req;
        //   const findCase: any = await this.caseRepository.getById<ICase>(
        //     req.params.id,
        //     undefined,
        //     undefined,
        //     ['debtor']
        //   );
        //   if (!findCase) {
        //     return [false, constantsUtil.notFoundMessage('Case')];
        //   }
        //   const callData = {
        //     from: '+17756307412',
        //     to: reqTemp.body.toNumber, // For testing Purposes Added My Number
        //     url: `${process.env.webHookURl}/api/v1/case/twilio/voice`,
        //     record: true,
        //     statusCallback:
        //       `${process.env.webHookURl}/api/v1/case/twilio/recording-status`,
        //     statusCallbackEvent: ['completed'],
        //   };
        //   try {
        //     const call = await this.twilioClient.calls.create(callData);
        //     console.log('Call', call);
        //     const result = await this.caseRepository.updateById<ICase>(
        //       req.params.id,
        //       {
        //         $push: {
        //           calls: {
        //             callSid: call.sid,
        //             callerName: reqTemp.name,
        //             accountSid: call.accountSid,
        //             callTo: call.to,
        //             callFrom: call.from,
        //             callStartDate: call.startTime,
        //             callDuration: null, // Placeholder for later update
        //             callStatus: 'initiated', // Initial status
        //             callRecordingSid: '',
        //             callTranscription: '',
        //           },
        //         },
        //         updatedAt: commonUtil.getCurrentDate(),
        //       }
        //     );
        //     if (!result) return [false, 'Failed to update case with call SID'];
        //     return [true, call.sid];
        //   } catch (err) {
        //     console.log('Error Creating Call', err);
        //     return [false, 'Error creating call.'];
        //   }
        // };
        this.getCalls = async (req) => {
            const findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            if (!findCase) {
                return [false, constants_util_1.default.notFoundMessage('Case')];
            }
            if (!Array.isArray(findCase.calls) || findCase.calls.length === 0) {
                return [true, []];
            }
            for (let call of findCase.calls) {
                if (call.callRecordingSid) {
                    const getFile = await this.callUploadUtil.generateSignedUrl(call.callRecordingSid);
                    if (getFile) {
                        call.callRecordingSid = getFile;
                    }
                }
            }
            return [true, findCase.calls.reverse()];
        };
        this.callFallback = async (req) => {
            const VoiceResponse = require('twilio').twiml.VoiceResponse;
            const twiml = new VoiceResponse();
            twiml.say('We are experiencing technical difficulties. Please try again later.');
            return [true, twiml.toString()];
        };
        this.callTwiml = async (req) => {
            console.log('req.body: ', req.body);
            const callerId = process.env.TWILIO_CALLER_ID;
            console.log('process.env.TWILIO_CALLER_ID: ', process.env.TWILIO_CALLER_ID);
            let identity = 'user';
            const toNumberOrClientName = req.body.To;
            const VoiceResponse = require('twilio').twiml.VoiceResponse;
            let twiml = new VoiceResponse();
            //If CalledId and To is same, meaning it is a incoming voice call
            if (toNumberOrClientName == callerId) {
                const dial = twiml.dial({
                    record: 'record-from-answer',
                    recordingStatusCallback: `${process.env.webHookURl}/api/v1/case/twilio/recording-status`,
                });
                dial.client(identity);
            }
            else if (req.body.To) {
                const email = req.body?.email.toLowerCase();
                console.log('this is email we test:', email);
                let user = await this.userRepository.getOne({
                    email: email,
                    isDeleted: false,
                });
                console.log('this is user we test:', user);
                const { AccountSid, CallSid, To, CallStatus, CaseId } = req.body;
                const findCase = await this.caseRepository.getById(CaseId, undefined, undefined, ['debtor']);
                if (!findCase) {
                    return [false, constants_util_1.default.notFoundMessage('Case')];
                }
                // console.log(findCase, 'find case')
                const result = await this.caseRepository.updateById(CaseId, {
                    $push: {
                        calls: {
                            callSid: CallSid,
                            callerName: user.name,
                            accountSid: AccountSid,
                            callTo: To,
                            callFrom: user?.twilioNo || callerId,
                            callStartDate: '',
                            callDuration: null, // Placeholder for later update
                            callStatus: CallStatus, // Initial status
                            callRecordingSid: '',
                            transcriptUrl: ''
                        },
                    },
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                console.log(result, 'hello1');
                if (!result)
                    return [false, 'Failed to update case with call SID'];
                const isAValidPhoneNumber = number => {
                    return /^[\d\+\-\(\) ]+$/.test(number);
                };
                //OutGoing Call
                const dial = twiml.dial({
                    callerId: user?.twilioNo || callerId,
                    record: 'record-from-answer',
                    recordingStatusCallback: `${process.env.webHookURl}/api/v1/case/twilio/recording-status`,
                });
                const attr = isAValidPhoneNumber(toNumberOrClientName)
                    ? 'number'
                    : 'client';
                dial[attr]({}, toNumberOrClientName);
            }
            else {
                twiml.say('Thanks for calling!');
            }
            return [true, twiml.toString()];
        };
        this.callStatus = async (req) => {
            const { CallSid, CallStatus } = req.body;
            console.log(`Call SID: ${CallSid}, Status: ${CallStatus}`);
            // res.status(200).send("Call status received");
            return [true, '"Call status received"'];
        };
        // callTranscriptionStatus = async (req: Request) => {
        //   try {
        //     const callSid = req.body.CallSid;
        //     const transcriptionText = req.body.TranscriptionText;
        //     const result = await this.caseRepository.updateByOne(
        //       {'calls.callSid': callSid},
        //       {
        //         $set: {
        //           'calls.$.callTranscription': transcriptionText,
        //         },
        //         updatedAt: commonUtil.getCurrentDate(),
        //       }
        //     );
        //     if (!result) {
        //       return [false, 'Failed to update case with recording details.'];
        //     }
        //     return [true, 'Recording status received and updated successfully.'];
        //   } catch (err) {
        //     return [false, 'Error handling recording status.'];
        //   }
        // };
        // callHangUp = async (req: Request) => {
        //   try {
        //     const callSid = req.params.callSid;
        //     if (!callSid) {
        //       return [false, 'Call SID is required.'];
        //     }
        //     await this.twilioClient.calls(callSid).update({status: 'completed'});
        //     return [true, 'Call hung up successfully.'];
        //   } catch (err) {
        //     console.error('Error hanging up the call:', err);
        //     return [false, 'Error hanging up the call.'];
        //   }
        // };
        this.getToken = async (req) => {
            let identity = 'user';
            const AccessToken = require('twilio').jwt.AccessToken;
            const VoiceGrant = AccessToken.VoiceGrant;
            const accessToken = new AccessToken(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { identity });
            console.log(accessToken, 'accessToken1');
            accessToken.identity = 'user';
            console.log(accessToken, 'accessToken2');
            const grant = new VoiceGrant({
                outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
                incomingAllow: true,
            });
            accessToken.addGrant(grant);
            return [
                true,
                {
                    identity: 'user',
                    token: accessToken.toJwt(),
                },
            ];
        };
        this.callRecordingStatus = async (req) => {
            try {
                const { CallSid, RecordingSid, RecordingDuration, RecordingStatus, RecordingStartTime } = req.body;
                console.log('In CallRecordingsStatus Function');
                const resultOfRecording = await case_util_1.default.fetchRecording(RecordingSid);
                console.log(resultOfRecording, 'resutl.......');
                const transcriptUrl = await case_util_1.default.createTranscript(RecordingSid);
                console.log('transcript url....................', transcriptUrl);
                const result = await this.caseRepository.updateByOne({ 'calls.callSid': CallSid }, {
                    $set: {
                        'calls.$.callRecordingSid': RecordingSid,
                        'calls.$.callDuration': RecordingDuration,
                        'calls.$.callStatus': RecordingStatus,
                        'calls.$.callStartDate': RecordingStartTime,
                        'calls.$.transcriptUrl': transcriptUrl,
                    },
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
                console.log(result);
                if (!result) {
                    return [false, 'Failed to update call with recording details.'];
                }
                return [true, 'Recording status received and updated successfully.'];
            }
            catch (err) {
                return [false, 'Error handling recording status.'];
            }
        };
        this.getScoresSettlementByCommPercentage = async (req) => {
            if (!req.body.commissionPercentage ||
                isNaN(req.body.commissionPercentage)) {
                return [false, 'Invalid commission percentage'];
            }
            const comm = Number(req.body.commissionPercentage);
            const caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            const caseId = req.params.id;
            if (!caseTemp)
                return [false, constants_util_1.default.notFoundMessage('case')];
            let getScores = null, creditorNames = null;
            let creditors = null;
            let settlementRange = null;
            let data = {};
            // caseTemp.debtor = await debtorUtil.saveWeeklyBudget(caseTemp, req.body);
            let debtor = caseTemp.debtor;
            const moneyThumb = await debtor_util_1.default.getScoreCard(debtor);
            await moneyThumb_util_1.default.saveData(moneyThumb.appid, moneyThumb.scoreCard, debtor);
            await this.caseRepository.updateById(caseTemp._id, {
                strategyTwo: false,
                strategyThree: false,
                justifications: false,
                lumpSumJustifications: false,
                fullProfitJustifications: false,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            creditors = await case_util_1.default.getAllCreditorsOfDebtor(caseTemp.debtor);
            creditors = await creditor_util_1.default.checkCreditorsMapping(creditors);
            creditors = Array.from(new Map(creditors.map(creditor => [creditor.creditorAccountTitle, creditor])).values());
            const commisionPercentage = await creditor_util_1.default.addCreditorPercentagesAndGetPercentageCommission(creditors, debtor, moneyThumb.scoreCard);
            await creditor_util_1.default.addBreakEven(creditors);
            data['percentageReceivableCommission'] = commisionPercentage[0];
            data['percentageReceivableCommissionAmount'] = commisionPercentage[1];
            data['creditorsContractDetailsSum'] =
                await this.calculateContractDetailsSum(creditors);
            data['creditors'] = creditors;
            debtor = await this.debtorRepository.updateById(debtor._id, {
                commissionPercentage: comm,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
            await debtor_util_1.default.updateDebtorTotalCommission(debtor);
            data['debtor'] = debtor;
            const values = await moneyThumb_util_1.default.getMonthlyProfitValues(moneyThumb.scoreCard, debtor);
            data['averageMonthlyProfitExcludingPayments'] =
                values.averageMonthlyProfitExcludingPayments;
            data['averageMonthlyProfitIncludingPayments'] =
                values.averageMonthlyProfitIncludingPayments;
            data['currentMonthlyProfitExcludingPayments'] =
                values.currentMonthlyProfitExcludingPayments;
            data['currentMonthlyProfitIncludingPayments'] =
                values.currentMonthlyProfitIncludingPayments;
            let extractedFieldsTemp = null;
            if (!debtor?.extractedFields && !debtor?.extractedFields?.length) {
                const extractedFields = await case_util_1.default.getExtractionMCA(debtor);
                if (extractedFields) {
                    this.debtorRepository.updateById(debtor._id, {
                        extractedFields: extractedFields.extracted_fields,
                        updatedAt: common_util_1.default.getCurrentDate(),
                    });
                    extractedFieldsTemp = extractedFields.extracted_fields;
                }
            }
            creditorNames = await case_util_1.default.getCreditorNames(debtor, debtor.extractedFields ? debtor.extractedFields : extractedFieldsTemp, String(caseTemp._id));
            data['creditorNames'] = creditorNames;
            if (typeof creditorNames === 'string') {
                data['getScores'] = null;
                data['settlementRange'] = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                return [true, data];
            }
            if (req.query.all === 'true') {
                getScores = await case_util_1.default.getScoresForAllCreditors(caseTemp, creditors, comm);
                data['getScores'] = getScores;
                if (typeof getScores === 'string') {
                    data['settlementRange'] = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                    return [true, data];
                }
                data['debtor'] = await this.debtorRepository.getById(debtor._id);
            }
            else {
                if (req.body.creditorNames.length) {
                    const casesCreditors = await this.caseRepository.getAllWithoutPagination({ creditor: { $in: req.body.creditorNames }, debtor: debtor }, undefined, undefined, { _id: -1 }, ['creditor']);
                    getScores = await case_util_1.default.getScores(caseTemp, casesCreditors, comm);
                    data['getScores'] = getScores;
                    if (typeof getScores === 'string') {
                        data['settlementRange'] = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
                        return [true, data];
                    }
                    data['debtor'] = await this.debtorRepository.getById(debtor._id);
                }
            }
            settlementRange = await case_util_1.default.getSettlementRange(caseTemp);
            if (typeof settlementRange === 'string') {
                settlementRange = await moneyThumb_util_1.default.getSettlementValues(debtor, creditors, moneyThumb.scoreCard, caseId);
            }
            await creditor_util_1.default.addWeeklyTrueAmount(creditors, settlementRange);
            await creditor_util_1.default.replaceSettlementRangeAndWeeksTillPaid(creditors, settlementRange, caseId, true);
            data['settlementRange'] = settlementRange;
            return [true, data];
        };
        this.getSettlementJustifications = async (req) => {
            const caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_1.default.notFoundMessage('case')];
            }
            if (caseTemp.justifications) {
                const result = await this.strategyRepository.getOne({
                    caseId: String(caseTemp._id),
                    name: 'justifications',
                });
                if (result?.data?.justifications)
                    return [true, result.data.justifications];
            }
            const models = await case_util_1.default.getJustificationModels();
            const justifications = await case_util_1.default.getSettlementJustifications(caseTemp, models);
            return justifications;
        };
        this.deleteFile = async (req) => {
            // Fetch the case and populate debtor field
            let caseTemp = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
            if (!caseTemp) {
                return [false, constants_util_1.default.notFoundMessage('case')];
            }
            // Extract the key from the request body
            const { key } = req.body;
            if (!key) {
                return [false, 'Key is required in the request body.'];
            }
            // Update the debtor's documents by removing the document with the matching key
            const response = await this.debtorRepository.updateById(caseTemp.debtor._id, {
                $pull: { documents: { key } },
            });
            if (response.documents.length === caseTemp.debtor.documents.length) {
                return [false, `No document found with key: ${key}`];
            }
            return [true, `${key} is deleted successfully`];
        };
        this.deleteCreditor = async (req) => {
            let caseTemp = await this.caseRepository.getById(req.params.id);
            if (!caseTemp) {
                return [false, constants_util_1.default.notFoundMessage('case')];
            }
            const updateCase = await this.caseRepository.updateById(req.params.id, { isDeleted: true });
            if (!updateCase.isDeleted) {
                return [false, constants_util_1.default.failureDeleteMessage('Creditor')];
            }
            return [true, constants_util_1.default.successDeleteMessage('Creditor')];
        };
        this.updateCasePlan = async (req) => {
            let reqTemp = req;
            let findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, ['debtor']);
            if (!findCase)
                return [false, constants_util_1.default.notFoundMessage('case')];
            const getDebtor = findCase.debtor;
            if (req.body?.intervals &&
                req.body?.intervals.length &&
                findCase.intervals.length) {
                return [false, 'Payment plan already exist!'];
            }
            if (req.body?.commission) {
                if (!getDebtor?.intervals && !getDebtor.intervals?.length) {
                    await this.debtorRepository.updateById(findCase.debtor._id, {
                        weeklyCommission: req.body.commission,
                        updatedAt: common_util_1.default.getCurrentDate(),
                    });
                }
            }
            if (req.body.intervals && req.body?.intervals?.length) {
                findCase.intervals = req.body?.intervals;
                findCase.isExempt = req.body.isExempt;
                const checkCasePayment = await case_util_1.default.checkCasePayment(findCase);
                if (!checkCasePayment[0])
                    return checkCasePayment;
            }
            req.body.updatedAt = common_util_1.default.getCurrentDate();
            let caseUpdated = await this.caseRepository.updateById(req.params.id, req.body);
            if (!caseUpdated) {
                return [false, constants_util_1.default.failureUpdateMessage('case plan')];
            }
            if (req.body.intervals && req.body.intervals.length) {
                case_util_1.default.createPayment(caseUpdated);
            }
            await case_util_1.default.addInHistory({
                Time: new Date(common_util_1.default.getCurrentDate()),
                Action: 'Case Updated',
                'Updated By': reqTemp.name,
            }, caseUpdated._id);
            //this.sendCaseEmails(reqTemp.id, findCase, caseUpdated, false, true);
            return [true, caseUpdated];
        };
        this.twilioClient = new twilio_1.Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        this.caseRepository = new case_repository_1.CaseRepository();
        this.callUploadUtil = new callUpload_util_1.default();
        this.uploadUtil = new upload_util_1.default();
        this.targetCFRepository = new targetCF_repository_1.TargetCFRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.chatSummaryRepository = new chatSummary_repository_1.ChatSummaryRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.strategyRepository = new strategy_repository_1.StrategyRepository();
        this.caseHistoryRepository = new caseHistory_repository_1.CaseHistoryRepository();
        this.justificationRepository = new justification_repository_1.JustificationRepository();
        this.bulkUploadRepository = new bulkUpload_repository_1.BulkUploadRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
    }
    async getAmountDeliveredToCreditor(caseId) {
        const getPayments = await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Success',
            sendViaPaynote: 'Success',
            caseId: caseId,
            isDeleted: false,
        });
        return getPayments.reduce((sum, obj) => sum + obj.amount, 0);
    }
    async getAmountNotDeliveredToCreditor(caseId) {
        const getPayments = await this.paymentRepository.getAllWithoutPagination({
            authorized: 'Success',
            captured: 'Success',
            sendViaPaynote: 'Pending',
            caseId: caseId,
            isDeleted: false,
        });
        return getPayments.reduce((sum, obj) => sum + obj.amount, 0);
    }
    async deleteCase(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('case')];
        if (caseTemp?.intervals?.length) {
            return [false, constants_util_1.default.failureDeleteMessage('case with payments')];
        }
        const result = await this.caseRepository.updateById(req.params.id, {
            isDeleted: true,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('case')];
        }
        return [true, true];
    }
    async calculateContractDetailsSum(creditors) {
        let payableAmount = 0;
        let loanAmount = 0;
        for (const creditor of creditors) {
            payableAmount += case_util_1.default.getCleanAmount(creditor?.contractDetails?.payable_amount);
            loanAmount += case_util_1.default.getCleanAmount(creditor?.contractDetails?.loan_amount);
        }
        return { payableAmount, loanAmount };
    }
    async sendCaseEmails(userId, previousCase, updatedCase, caseAbout, caseUpdate) {
        if (caseAbout) {
            if (previousCase.caseOwnerId !== updatedCase.caseOwnerId) {
                await email_util_1.default.sendEmailOrSmsByEvent('case_owner_changed', previousCase._id, '', userId);
            }
            if (previousCase.negotiatorId !== updatedCase.negotiatorId) {
                await email_util_1.default.sendEmailOrSmsByEvent('case_negotiator_changed', previousCase._id, '', userId);
            }
            if (previousCase.managerId !== updatedCase.managerId) {
                await email_util_1.default.sendEmailOrSmsByEvent('case_manager_changed', previousCase._id, '', userId);
            }
        }
        if (caseUpdate) {
            await email_util_1.default.sendEmailOrSmsByEvent('case_details_update', previousCase._id, '', userId);
        }
    }
    async getWeeklyAndTotalCommission(req) {
        const findCase = await this.caseRepository.getById(req.params.id, undefined, undefined, [{ path: 'debtor' }]);
        if (!findCase) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        if (findCase.intervals.length) {
            return [false, 'Payment plan already exist!'];
        }
        findCase.intervals = req.body.intervals;
        let weeklyBudgetObj;
        const debtor = findCase.debtor;
        weeklyBudgetObj = await case_util_1.default.checkWeeklyBudget(findCase, true, debtor);
        if (!weeklyBudgetObj.status) {
            return [
                false,
                'Weekly budget is not fulfiling the payment plan of debtor.Please updated weekly budget',
            ];
        }
        return [
            true,
            {
                commission: weeklyBudgetObj.commission,
                totalCommission: weeklyBudgetObj.totalCommission,
                commissionPercentage: debtor.commissionPercentage,
            },
        ];
    }
    async sendSettlementEmail(req) {
        const { from, sendTo, subject, content, cc } = req.body;
        const threadId = (0, uuid_1.v4)();
        const buffer = await email_util_1.default.generatePdfFromHtml(content);
        const caseId = req.params.id;
        const caseTemp = await this.caseRepository.getById(caseId, undefined, undefined, [
            { path: 'debtor', select: ['businessInformation.companyName'] },
            { path: 'creditor', select: ['businessInformation.companyName'] },
        ]);
        if (!caseTemp)
            return [false, constants_util_1.default.notFoundMessage('case')];
        const time = new Date(common_util_1.default.getCurrentDate());
        await case_util_1.default.addInHistory({
            From: from,
            To: sendTo,
            Content: content,
            Time: time,
            Action: 'EMAIL',
            Subject: subject,
        }, caseId);
        const emailData = {
            from,
            to: sendTo,
            subject,
            text: content,
            textAsHtml: content,
            cc: cc,
        };
        email_util_1.default.createInbox(caseTemp, 'sent', emailData, threadId);
        return await email_util_1.default.sendEmail(sendTo, from, subject, content, cc, buffer, caseId, threadId);
    }
    async caseHistory(req) {
        const findCase = await this.caseRepository.getById(req.params.id);
        if (!findCase) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const result = await this.caseHistoryRepository.getOne({
            caseId: req.params.id,
        });
        return [true, result?.caseHistory ?? []];
    }
    async saveJustification(req) {
        req.body.updatedAt = common_util_1.default.getCurrentDate();
        const justification = await this.justificationRepository.upsert({}, req.body);
        if (!justification) {
            return [false, constants_util_1.default.notFoundMessage('justification')];
        }
        this.caseRepository.updateMany({}, { justifications: false, updatedAt: common_util_1.default.getCurrentDate() });
        return [true, justification];
    }
    async calculateIntervalsAmount(req) {
        const findCase = await this.caseRepository.getById(req.params.id);
        if (!findCase) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        let amount = 0;
        for (const interval of findCase.intervals) {
            if (!interval.frequency) {
                amount += interval.amount;
            }
            if (interval.frequency) {
                // for (let i = 0; i < interval.frequency; i++) {
                //   amount += interval.amount;
                // }
                let multipliedAmount = interval.frequency * interval.amount;
                amount += multipliedAmount;
            }
        }
        return [true, amount];
    }
    async updateContractDetails(req) {
        const caseTemp = await this.caseRepository.getById(req.params.id);
        if (!caseTemp) {
            return [false, constants_util_1.default.notFoundMessage('case')];
        }
        const updateCase = await this.caseRepository.updateById(req.params.id, { $set: { [`contractDetails.${req.body.label}`]: req.body.value } });
        if (!updateCase) {
            return [false, constants_util_1.default.failureUpdateMessage('contract details')];
        }
        return [true, updateCase];
    }
}
exports.default = CaseService;
//# sourceMappingURL=case.service.js.map