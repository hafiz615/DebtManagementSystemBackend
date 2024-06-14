"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const debtor_service_1 = __importDefault(require("../../services/debtor.service"));
class DebtorController {
    constructor() {
        this.getDebtor = async (req, res) => {
            try {
                const response = await this.debtorService.getDebtor(req.body.text ? req.body.text : '');
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Debtor'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.listingDetails = async (req, res) => {
            try {
                const response = await this.debtorService.listingDetails(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Client details'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.searchListing = async (req, res) => {
            try {
                const response = await this.debtorService.searchListing(req);
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Clients list'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateDebtor = async (req, res) => {
            const response = await this.debtorService.updateDebtor(req);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successUpdateMessage('Debtor'),
            }));
        };
        this.createVault = async (req, res) => {
            if (!req.body || !req.body.paymentToken) {
                return [false, 'Payment token is missing'];
            }
            if (!req.body || !req.body.paymentType) {
                return [false, 'Payment token is missing'];
            }
            const response = await this.debtorService.createVault(req.body.paymentToken, req.params.id, req.body.paymentType);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successAddMessage('Customer vault id'),
            }));
        };
        this.retryAuth = async (req, res) => {
            const response = await this.debtorService.createVault(req.body.paymentToken, req.params.id, req.body.paymentType);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successAddMessage('Customer vault id'),
            }));
        };
        this.debtorService = new debtor_service_1.default();
    }
}
exports.default = new DebtorController();
//# sourceMappingURL=debtor.controller.js.map