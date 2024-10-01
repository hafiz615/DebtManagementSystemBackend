"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const payment_service_1 = __importDefault(require("../../services/payment.service"));
const common_util_1 = __importDefault(require("../../../utils/common.util"));
const payment_cronjob_1 = __importDefault(require("../../../cron-job/payment.cronjob"));
class PaymentController {
    constructor() {
        this.getHomePayments = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('viewHomeScreen', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.paymentService.getHomePayments(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Payments'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCasePayments = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('viewCaseDetails', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.paymentService.getCasePayments(req.params.id);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Case payments'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.addACHDetailsCreditor = async (req, res) => {
            try {
                const response = await this.paymentService.addACHDetailsCreditor(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
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
        this.processAuthAndCapture = async (req, res) => {
            try {
                await payment_cronjob_1.default.processPayments();
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: [],
                    message: 'Payments auth and capture is done',
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.processPaynoteTransfer = async (req, res) => {
            try {
                await payment_cronjob_1.default.testPaynote();
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: [],
                    message: 'Payments transfer via paynote is done',
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.sendPaymentPaynote = async (req, res) => {
            try {
                // const response = await this.paymentService.sendPaymentPaynote(req);
                // if (!response[0]) {
                //   return res
                //     .status(constants.CODE.BAD_REQUEST)
                //     .send(responseHelper.get4xxResponse(response[1]));
                // }
                // return res.status(constants.CODE.OK).send(
                //   responseHelper.get2xxResponse({
                //     statusCode: constants.CODE.OK,
                //     data: [],
                //     message: response[1],
                //   })
                // );
                return 'ok';
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.paymentService = new payment_service_1.default();
    }
}
exports.default = new PaymentController();
//# sourceMappingURL=payment.controller.js.map