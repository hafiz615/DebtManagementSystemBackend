import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import CreditorService from '../../services/creditor.service';
import SettingsService from '../../services/settings.service';
import commonUtil from '../../../utils/common.util';

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
        'viewPaymentsNotificationSettings',
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
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new SettingsController();
