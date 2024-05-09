"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const case_service_1 = __importDefault(require("../../services/case.service"));
class CaseController {
    constructor() {
        this.createCase = async (req, res) => {
            try {
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
                console.log(error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getAllCases = async (req, res) => {
            try {
                const response = await this.caseService.getAllCases(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Cases'),
                }));
            }
            catch (error) {
                console.log(error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCaseById = async (req, res) => {
            try {
                const response = await this.caseService.getCaseById(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Case'),
                }));
            }
            catch (error) {
                console.log(error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.caseService = new case_service_1.default();
    }
}
exports.default = new CaseController();
//# sourceMappingURL=case.controller.js.map