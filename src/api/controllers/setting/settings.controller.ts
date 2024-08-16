import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import CreditorService from '../../services/creditor.service';
import SettingsService from '../../services/settings.service';
import commonUtil from '../../../utils/common.util';
import {Case} from '../../../database/repomodels/case.repomodel';
import {Debtor} from '../../../database/repomodels/debtor.repomodel';
import {Creditor} from '../../../database/repomodels/creditor.repomodel';
import {NotificationConfiguration} from '../../../database/repomodels/notificationConfiguration.repomodel';
import {Payment} from '../../../database/repomodels/payment.repomodel';
import {User} from '../../../database/repomodels/user.repomodel';
class SettingsController {
  protected settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }
  addSettings = async (req: Request, res: Response) => {
    try {
      let keyword = '';
      if (String(req.query.type) === 'template') {
        keyword = 'addNotificationTemplate';
        const checkPermission = await commonUtil.checkPermission(keyword, req);
        if (!checkPermission)
          return res
            .status(constants.CODE.BAD_REQUEST)
            .send(
              responseHelper.get4xxResponse(
                'You do not have permission to perform this operation'
              )
            );
      }
      if (String(req.query.type) === 'payments') {
        keyword = 'editPaymentsNotificationSettings';
      }
      const response = await this.settingsService.addSettings(req, keyword);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Settings'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getSettings = async (req: Request, res: Response) => {
    try {
      const templatePermission = await commonUtil.checkPermission(
        'viewNotificationTemplates',
        req
      );
      const paymentsPermission = await commonUtil.checkPermission(
        'viewPaymentsAndAuthorizations',
        req
      );
      const customFieldsPermission = await commonUtil.checkPermission(
        'viewCustomFields',
        req
      );
      const response = await this.settingsService.getSettings(
        templatePermission,
        paymentsPermission,
        customFieldsPermission
      );
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: 'Settings!',
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  addCustomField = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'addCustomFields',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response = await this.settingsService.addCustomField(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successAddMessage('Custom field'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  editCustomField = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'editCustomFields',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response = await this.settingsService.editCustomField(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Custom field'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  getCustomFieldsByTarget = async (req: Request, res: Response) => {
    try {
      const response = await this.settingsService.getCustomFieldsByTarget(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Custom fields'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  addCustomFieldByTarget = async (req: Request, res: Response) => {
    try {
      const response = await this.settingsService.addCustomFieldByTarget(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successAddMessage('Custom field'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  updateCustomFieldByTarget = async (req: Request, res: Response) => {
    try {
      const response =
        await this.settingsService.updateCustomFieldByTarget(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Custom field'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  removeCustomFieldByTarget = async (req: Request, res: Response) => {
    try {
      const response =
        await this.settingsService.removeCustomFieldByTarget(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successDeleteMessage('Custom field'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  deleteCustomField = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'deleteCustomFields',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response = await this.settingsService.deleteCustomField(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successDeleteMessage('Custom field'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  editNotificationTemplate = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'editNotificationTemplate',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response = await this.settingsService.editNotificationTemplate(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Notification template'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  deleteNotificationTemplate = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'deleteNotificationTemplate',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response =
        await this.settingsService.deleteNotificationTemplate(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successDeleteMessage('Notification template'),
        })
      );
    } catch (error) {
      console.log(error.message);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  notificationConfiguration = async (req: Request, res: Response) => {
    try {
      const response =
        await this.settingsService.addNotificationConfiguration(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Notification Configuration'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getNotificationConfiguration = async (req: Request, res: Response) => {
    try {
      const response =
        await this.settingsService.getNotificationConfiguration(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Notification Configuration'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getSystemTemplate = async (req: Request, res: Response) => {
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
            'contractDetails.purchased_percentage':
              'Case contract purchased percentage',
            'contractDetails.repayment_amount':
              'Case contract repayment amount',
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
            'businessInformation.country': 'Debtor business country',
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
            'businessInformation.businessCategory':
              'Creditor Business Category',
            'businessInformation.companyName': 'Creditor Company Name',
          },

          event: {value: 'Event Value', createdAt: 'Event date and time'},
          payment: {
            authorized: 'Payment Authorized',
            captured: 'Payment Captured',
            status: 'Payment Status',
            sendViaPaynote: 'Payment Send Via Pay note',
            amount: 'Payment Amount',
            dueDate: 'Payment Due Date',
            failedReasonAuthorization: 'Payment Failed Reason Authorization',
            failedReasonCaptured: 'Payment Failed Reason Captured',
            rescheduled: 'Payment Rescheduled',
            retriesAuth: 'Payment RetriesAuth',
            retriesCapture: 'Payment RetriesCapture',
            timePeriod: 'Payment TimePeriod',
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
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Template '),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new SettingsController();
