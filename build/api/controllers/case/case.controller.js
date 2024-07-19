"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const case_service_1 = __importDefault(require("../../services/case.service"));
const common_util_1 = __importDefault(require("../../../utils/common.util"));
class CaseController {
    constructor() {
        this.createCase = async (req, res) => {
            try {
                // const keyword =
                //   req.query.bulk === 'true' ? 'importBulkCases' : 'createNewCase';
                // const checkPermission = await commonUtil.checkPermission(keyword, req);
                // if (!checkPermission)
                //   return res
                //     .status(constants.CODE.BAD_REQUEST)
                //     .send(
                //       responseHelper.get4xxResponse(
                //         'You do not have permission to perform this operation'
                //       )
                //     );
                const response = await this.caseService.createCase(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successRegisterMessage('Case'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.getAllCases = async (req, res) => {
            try {
                const response = await this.caseService.getAllCases(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Cases'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCaseById = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('viewCaseDetails', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.caseService.getCaseById(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Case'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateCase = async (req, res) => {
            try {
                const response = await this.caseService.updateCase(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Case'),
                }));
            }
            catch (error) {
                console.log(error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateCaseAbout = async (req, res) => {
            try {
                const response = await this.caseService.updateCaseAbout(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Case about'),
                }));
            }
            catch (error) {
                console.log(error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.deleteCase = async (req, res) => {
            try {
                const response = await this.caseService.deleteCase(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successDeleteMessage('Case'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        // getAIIntegrationData = async (req: Request, res: Response) => {
        //   try {
        //     const response = await this.caseService.getAIIntegrationData(req);
        //     if (!response[0]) {
        //       return res
        //         .status(constants.CODE.BAD_REQUEST)
        //         .send(responseHelper.get4xxResponse(response[1]));
        //     }
        //     return res.status(constants.CODE.OK).send(
        //       responseHelper.get2xxResponse({
        //         statusCode: constants.CODE.OK,
        //         data: response[1],
        //         message: constants.successFoundMessage('Settlement range'),
        //       })
        //     );
        //   } catch (error) {
        //     console.log(error);
        //     return res
        //       .status(constants.CODE.BAD_REQUEST)
        //       .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
        //   }
        // };
        this.getSummary = async (req, res) => {
            try {
                const response = await this.caseService.getSummary(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Summary'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getAIToken = async (req, res) => {
            try {
                const response = await this.caseService.getAIToken(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('AI token'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCaseSummaries = async (req, res) => {
            try {
                const response = await this.caseService.getCaseSummaries(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Summaries'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getScores = async (req, res) => {
            try {
                const response = await this.caseService.getScores(req);
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[0],
                    message: response[1],
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCreditorNames = async (req, res) => {
            try {
                const response = await this.caseService.getCreditorNames(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Creditor names'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getSettlementRange = async (req, res) => {
            try {
                const response = await this.caseService.getSettlementRange(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Settlement range'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCreditorHistory = async (req, res) => {
            try {
                const response = await this.caseService.getCreditorHistory(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Creditor history'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.createCreditorsCases = async (req, res) => {
            try {
                const response = await this.caseService.createCreditorsCases(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successRegisterMessage('Cases'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(error.message));
            }
        };
        this.caseService = new case_service_1.default();
    }
}
exports.default = new CaseController();
//# sourceMappingURL=case.controller.js.map