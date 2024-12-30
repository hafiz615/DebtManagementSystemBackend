"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
// import CaseService from '../../services/case.service';
const call_service_1 = __importDefault(require("../../services/call.service"));
class CallController {
    constructor() {
        this.callTwiml = async (req, res) => {
            try {
                const response = await this.callService.callTwiml(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                res.type('text/xml');
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.callFallBack = async (req, res) => {
            try {
                const response = await this.callService.callFallback(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                res.type('text/xml');
                return res.status(constants_util_1.default.CODE.OK).send(response[1]);
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        // callHangUp = async (req: Request, res: Response) => {
        //   try {
        //     const response = await this.caseService.callHangUp(req);
        //     if (!response[0]) {
        //       return res
        //       .status(constants.CODE.BAD_REQUEST)
        //       .send(responseHelper.get4xxResponse(response[1]));
        //     }
        //     return res.status(constants.CODE.OK).send(
        //       responseHelper.get2xxResponse({
        //         statusCode: constants.CODE.OK,
        //         data: response[1],
        //         message: constants.successFoundMessage(
        //           'Twilio'
        //         ),
        //       })
        //     );
        //   }
        //   catch (error) {
        //   return res
        //   .status(constants.CODE.BAD_REQUEST)
        //   .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
        //  }
        // }
        // callTranscriptionStatus = async (req: Request, res: Response) => {
        //   try {
        //     const response = await this.caseService.callTranscriptionStatus(req);
        //     if (!response[0]) {
        //       return res
        //         .status(constants.CODE.BAD_REQUEST)
        //         .send(responseHelper.get4xxResponse(response));
        //     }
        //     return res.status(constants.CODE.CREATED).send(
        //       responseHelper.get2xxResponse({
        //         statusCode: constants.CODE.CREATED,
        //         data: response[1],
        //         message: constants.successUpdateMessage('Cases'),
        //       })
        //     );
        //   } catch (error) {
        //     return res
        //       .status(constants.CODE.BAD_REQUEST)
        //       .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
        //   }
        // };
        this.callRecordingStatus = async (req, res) => {
            try {
                const response = await this.callService.callRecordingStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Cases'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCalls = async (req, res) => {
            try {
                const response = await this.callService.getCalls(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('All Calls for this Case'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.callStatus = async (req, res) => {
            try {
                const response = await this.callService.callStatus(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.callMadesuccessMessage('Call'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        // createCall = async (req: Request, res: Response) => {
        //   try {
        //     const response = await this.caseService.createCall(req);
        //     if (!response[0]) {
        //       return res
        //         .status(constants.CODE.BAD_REQUEST)
        //         .send(responseHelper.get4xxResponse(response));
        //     }
        //     return res.status(constants.CODE.CREATED).send(
        //       responseHelper.get2xxResponse({
        //         statusCode: constants.CODE.CREATED,
        //         data: response[1],
        //         message: constants.callMadesuccessMessage('Call'),
        //       })
        //     );
        //   } catch (error) {
        //     return res
        //       .status(constants.CODE.BAD_REQUEST)
        //       .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
        //   }
        // };
        this.getToken = async (req, res) => {
            try {
                const response = await this.callService.getToken(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Token'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.callService = new call_service_1.default();
    }
}
exports.default = new CallController();
//# sourceMappingURL=call.controller.js.map