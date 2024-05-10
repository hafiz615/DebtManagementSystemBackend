"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../../services/user.service"));
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
class UserController {
    constructor() {
        this.createUser = async (req, res) => {
            try {
                const response = await this.userService.createUser(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.CREATED).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.CREATED,
                    data: response[1],
                    message: constants_util_1.default.successRegisterMessage('User'),
                }));
            }
            catch (error) {
                console.log(error.message);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.signIn = async (req, res) => {
            try {
                const { email, password } = req.body;
                const response = await this.userService.signIn(email, password);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.Messages.SIGNIN_SUCCESSFULL,
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getUserById = async (req, res) => {
            try {
                const reqTemp = req;
                const response = await this.userService.getUserById(reqTemp.id);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('User'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getUser = async (req, res) => {
            try {
                const response = await this.userService.getUser(req.body.email ? req.body.email : '');
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('User'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateUser = async (req, res) => {
            const response = await this.userService.updateUser(req);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successUpdateMessage('User'),
            }));
        };
        this.deleteUserById = async (req, res) => {
            const reqTemp = req;
            const response = await this.userService.deleteUserById(reqTemp.id);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successDeleteMessage('User'),
            }));
        };
        this.verifyInvitationLink = async (req, res) => {
            const response = await this.userService.verifyInvitationLink(String(req.query.token) ? String(req.query.token) : '');
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.Messages.VALID_LINK,
            }));
        };
        this.resendInvitationLink = async (req, res) => {
            const response = await this.userService.resendInvitationLink(req.body.email ? req.body.email : '');
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.Messages.SEND_INVITATION_LINK_200,
            }));
        };
        this.updatePassword = async (req, res) => {
            const response = await this.userService.updatePassword(req);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successUpdateMessage('User'),
            }));
        };
        this.getAllUsers = async (req, res) => {
            const response = await this.userService.getAllUsers(req);
            if (!response[0]) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(response[1]));
            }
            return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                statusCode: constants_util_1.default.CODE.OK,
                data: response[1],
                message: constants_util_1.default.successFoundMessage('Users'),
            }));
        };
        this.userService = new user_service_1.default();
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map