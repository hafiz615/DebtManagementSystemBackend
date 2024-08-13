"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const settings_service_1 = __importDefault(require("../../services/settings.service"));
const common_util_1 = __importDefault(require("../../../utils/common.util"));
const case_repomodel_1 = require("../../../database/repomodels/case.repomodel");
const debtor_repomodel_1 = require("../../../database/repomodels/debtor.repomodel");
const creditor_repomodel_1 = require("../../../database/repomodels/creditor.repomodel");
const notificationConfiguration_repomodel_1 = require("../../../database/repomodels/notificationConfiguration.repomodel");
const payment_repomodel_1 = require("../../../database/repomodels/payment.repomodel");
const user_repomodel_1 = require("../../../database/repomodels/user.repomodel");
class SettingsController {
    constructor() {
        this.addSettings = async (req, res) => {
            try {
                let keyword = '';
                if (String(req.query.type) === 'template') {
                    keyword = 'addNotificationTemplate';
                    const checkPermission = await common_util_1.default.checkPermission(keyword, req);
                    if (!checkPermission)
                        return res
                            .status(constants_util_1.default.CODE.BAD_REQUEST)
                            .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                }
                if (String(req.query.type) === 'payments') {
                    keyword = 'editPaymentsNotificationSettings';
                }
                const response = await this.settingsService.addSettings(req, keyword);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Settings'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getSettings = async (req, res) => {
            try {
                const templatePermission = await common_util_1.default.checkPermission('viewNotificationTemplates', req);
                const paymentsPermission = await common_util_1.default.checkPermission('viewPaymentsAndAuthorizations', req);
                const customFieldsPermission = await common_util_1.default.checkPermission('viewCustomFields', req);
                const response = await this.settingsService.getSettings(templatePermission, paymentsPermission, customFieldsPermission);
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: 'Settings!',
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.addCustomField = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('addCustomFields', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.settingsService.addCustomField(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successAddMessage('Custom field'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.editCustomField = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('editCustomFields', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.settingsService.editCustomField(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Custom field'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getCustomFieldsByTarget = async (req, res) => {
            try {
                const response = await this.settingsService.getCustomFieldsByTarget(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Custom fields'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.addCustomFieldByTarget = async (req, res) => {
            try {
                const response = await this.settingsService.addCustomFieldByTarget(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successAddMessage('Custom field'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateCustomFieldByTarget = async (req, res) => {
            try {
                const response = await this.settingsService.updateCustomFieldByTarget(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Custom field'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.removeCustomFieldByTarget = async (req, res) => {
            try {
                const response = await this.settingsService.removeCustomFieldByTarget(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successDeleteMessage('Custom field'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.deleteCustomField = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('deleteCustomFields', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.settingsService.deleteCustomField(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successDeleteMessage('Custom field'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.editNotificationTemplate = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('editNotificationTemplate', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.settingsService.editNotificationTemplate(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Notification template'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.deleteNotificationTemplate = async (req, res) => {
            try {
                const checkPermission = await common_util_1.default.checkPermission('deleteNotificationTemplate', req);
                if (!checkPermission)
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse('You do not have permission to perform this operation'));
                const response = await this.settingsService.deleteNotificationTemplate(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successDeleteMessage('Notification template'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.notificationConfiguration = async (req, res) => {
            try {
                const response = await this.settingsService.addNotificationConfiguration(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Notification Configuration'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getNotificationConfiguration = async (req, res) => {
            try {
                const response = await this.settingsService.getNotificationConfiguration(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Notification Configuration'),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getSystemTemplate = async (req, res) => {
            try {
                const response = [
                    true,
                    {
                        case: new case_repomodel_1.Case(),
                        debtor: new debtor_repomodel_1.Debtor(),
                        creditor: new creditor_repomodel_1.Creditor(),
                        event: new notificationConfiguration_repomodel_1.NotificationConfiguration(),
                        payment: new payment_repomodel_1.Payment(),
                        user: new user_repomodel_1.User(),
                    },
                ];
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Template '),
                }));
            }
            catch (error) {
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.settingsService = new settings_service_1.default();
    }
}
exports.default = new SettingsController();
//# sourceMappingURL=settings.controller.js.map