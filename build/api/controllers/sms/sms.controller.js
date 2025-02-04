"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const sms_service_1 = __importDefault(require("../../services/sms.service"));
class SmsController {
    constructor() {
        this.receiveMessage = async (req, res) => {
            try {
                const response = await this.smsService.receivedMessage(req);
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
        this.smsFallBack = async (req, res) => {
            try {
                const response = await this.smsService.receivedSmsFallback(req);
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
        this.smsService = new sms_service_1.default();
    }
}
exports.default = new SmsController();
//# sourceMappingURL=sms.controller.js.map