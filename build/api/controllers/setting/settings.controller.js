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
                console.log(error.message);
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
                    message: constants_util_1.default.successRegisterMessage('Notification Configuration'),
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
                    message: constants_util_1.default.successFoundMessage('Notification Configuration'),
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
                            negotiator: ' Case Negotiator',
                            manager: 'Case Manager',
                            caseCode: 'Case Code',
                            status: 'Case Status',
                            totalDebt: 'Case Total Debt',
                            lastPaymentDate: 'Case Last Payment Date',
                            paidAmount: 'Case Paid Amount',
                            remaining: 'Case Remaining',
                            'contractDetails.signing_date': 'Case contract signing Date',
                            'contractDetails.loan_amount': 'Case contract loan amount ',
                            'contractDetails.payable_amount': 'Case contract payable amount',
                            'contractDetails.purchased_percentage': 'Case contract purchased percentage',
                            'contractDetails.repayment_amount': 'Case contract repayment amount',
                            'contractDetails.purchasePrice': 'Case contract purchase Price',
                        },
                        debtor: {
                            'basicInformation.fullName': 'Debtor Personal Full Name',
                            'basicInformation.email': 'Debtor Personal Email',
                            'basicInformation.phone': 'Debtor Personal Phone',
                            'basicInformation.status': 'Debtor Personal Status',
                            'basicInformation.address': 'Debtor Personal Address',
                            'basicInformation.SSID': 'Debtor Personal SSID',
                            'basicInformation.weeklyBudget': '',
                            'businessInformation.fullName': 'Debtor Business Full Name',
                            'businessInformation.companyName': 'Debtor Company Name',
                            'businessInformation.EIN': 'Debtor business EIN',
                            'businessInformation.businessCategory': 'Debtor business Category',
                            'businessInformation.description': 'Debtor business description',
                            'businessInformation.state': 'Debtor business state',
                            'businessInformation.city': 'Debtor business city',
                            'businessInformation.zipCode': 'Debtor business zipCode',
                            'businessInformation.phone': 'Debtor business phone',
                            'businessInformation.address': 'Debtor business address',
                        },
                        creditor: {
                            'basicInformation.fullName': 'Creditor Personal Full Name',
                            'basicInformation.email': 'Creditor Personal Email',
                            'basicInformation.phone': 'Creditor Personal Phone',
                            'businessInformation.businessCategory': 'Creditor Business Category',
                            'businessInformation.companyName': 'Creditor Company Name',
                        },
                        event: { value: 'Event Value', createdAt: 'Event date and time' },
                        payment: {
                            amount: 'Payment Amount',
                            dueDate: 'Payment Due Date',
                            timePeriod: 'Payment Time Period',
                        },
                        user: {
                            name: 'User Name',
                            email: 'User Email',
                            role: 'User Role',
                            SSN: 'User SSID',
                            dateOfBirth: 'User Date Of Birth',
                            phone: 'User Phone',
                            gender: 'User Gender',
                            address: 'User Address',
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
        this.getCustomFields = async (req, res) => {
            try {
                const response = await this.settingsService.getCustomFields();
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
        this.getTemplates = async (req, res) => {
            try {
                const response = await this.settingsService.getTemplates();
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.OK)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Templates'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.updateFee = async (req, res) => {
            try {
                const response = await this.settingsService.updateFee(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successUpdateMessage('Fee'),
                }));
            }
            catch (error) {
                console.log(error);
                return res
                    .status(constants_util_1.default.CODE.BAD_REQUEST)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.EXCEPTION));
            }
        };
        this.getFee = async (req, res) => {
            try {
                const response = await this.settingsService.getFee(req);
                if (!response[0]) {
                    return res
                        .status(constants_util_1.default.CODE.BAD_REQUEST)
                        .send(responseHelper_util_1.default.get4xxResponse(response[1]));
                }
                return res.status(constants_util_1.default.CODE.OK).send(responseHelper_util_1.default.get2xxResponse({
                    statusCode: constants_util_1.default.CODE.OK,
                    data: response[1],
                    message: constants_util_1.default.successFoundMessage('Fee'),
                }));
            }
            catch (error) {
                console.log(error);
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