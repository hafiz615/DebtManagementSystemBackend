"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../../utils/constants.util"));
const responseHelper_util_1 = __importDefault(require("../../../utils/responseHelper.util"));
const settings_service_1 = __importDefault(require("../../services/settings.service"));
const common_util_1 = __importDefault(require("../../../utils/common.util"));
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
                        case: {
                            caseOwner: 'Case Owner',
                            negotiator: 'Negotiator',
                            manager: 'Manager',
                            caseCode: 'Case Code',
                            status: 'Status',
                            totalDebt: 'Total Debt',
                            lastPaymentDate: 'Last Payment Date',
                            paidAmount: 'Paid Amount',
                            remaining: 'Remaining',
                            contractDetails: 'Contract Details',
                        },
                        debtor: {
                            basicInformation: {
                                FullName: 'Full Name',
                                email: 'Email',
                                phone: 'Phone',
                            },
                            businessInformation: 'Business Information',
                            lastFundedDate: 'Last Funded Date',
                            historicalRange: 'Historical Range',
                            accountTitle: 'Account Title',
                            aggression: 'Aggression',
                        },
                        creditor: {
                            basicInformation: {
                                FullName: 'Full Name',
                                email: 'Email',
                                phone: 'Phone',
                            },
                            businessInformation: 'Business Information',
                        },
                        event: { value: 'Value' },
                        payment: {
                            authorized: 'Authorized',
                            captured: 'Captured',
                            status: 'Status',
                            sendViaPaynote: 'Send Via Pay note',
                            amount: 'Amount',
                            dueDate: 'Due Date',
                            failedReasonAuthorization: 'Failed Reason Authorization',
                            failedReasonCaptured: 'Failed Reason Captured',
                            rescheduled: 'Rescheduled',
                            retriesAuth: 'RetriesAuth',
                            retriesCapture: 'RetriesCapture',
                            timePeriod: 'TimePeriod',
                        },
                        user: {
                            name: 'Name',
                            email: 'Email',
                            role: 'Role',
                            SSN: 'SSN',
                            dateOfBirth: 'Date Of Birth',
                            phone: 'Phone',
                            gender: 'Gender',
                            address: 'Address',
                        },
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