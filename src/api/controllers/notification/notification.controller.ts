import {Request, Response} from 'express';
import NotificationService from '../../services/notification.service';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';

class NotificationController {
  protected notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getAllNotifications = async (req: Request, res: Response) => {
    try {
      const response = await this.notificationService.getAllNotifications(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Notifications'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const response = await this.notificationService.markAsRead(req.params.id);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: 'notification marked as read',
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getCount = async (req: Request, res: Response) => {
    try {
      const response = await this.notificationService.getNotificationCount();
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: 'notification count',
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new NotificationController();
