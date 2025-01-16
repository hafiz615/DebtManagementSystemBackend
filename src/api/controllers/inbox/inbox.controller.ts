import {Request, Response} from 'express';
import InboxService from '../../services/inbox.service';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';

class InboxController {
  protected inboxService: InboxService;

  constructor() {
    this.inboxService = new InboxService();
  }

  getAllMessages = async (req: Request, res: Response) => {
    try {
      const response = await this.inboxService.getAllInboxes(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Inboxes'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  createEmailDraft = async (req: Request, res: Response) => {
    try {
      const response = await this.inboxService.createEmailDraft(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successCreatedMessage('Draft'),
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };  

  deleteDraftEmail = async (req: Request, res: Response) => {
    try {
      const response = await this.inboxService.deleteDraftEmail(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: response[1],
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  
  markAsRead = async (req: Request, res: Response) => {
    try {
      const response = await this.inboxService.markAsRead(req.params.id);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: 'Inbox marked as read',
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  //     try {
  //       const response = await this.inboxService.markAsUnread(req.params.id);
  //       if (!response[0]) {
  //         return res
  //           .status(constants.CODE.BAD_REQUEST)
  //           .send(responseHelper.get4xxResponse(response[1]));
  //       }
  //       return res.status(constants.CODE.OK).send(
  //         responseHelper.get2xxResponse({
  //           statusCode: constants.CODE.OK,
  //           data: response[1],
  //           message: 'Inbox marked as unread',
  //         })
  //       );
  //     } catch (error) {
  //       console.log(error);
  //       return res
  //         .status(constants.CODE.BAD_REQUEST)
  //         .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
  //     }
  //   };

  //   // Method to send message to inbox
  //   sendMessage = async (req: Request, res: Response) => {
  //     try {
  //       const response = await this.inboxService.sendMessage(req);
  //       if (!response[0]) {
  //         return res
  //           .status(constants.CODE.BAD_REQUEST)
  //           .send(responseHelper.get4xxResponse(response[1]));
  //       }
  //       return res.status(constants.CODE.CREATED).send(
  //         responseHelper.get2xxResponse({
  //           statusCode: constants.CODE.CREATED,
  //           data: response[1],
  //           message: 'Message sent to inbox',
  //         })
  //       );
  //     } catch (error) {
  //       console.log(error);
  //       return res
  //         .status(constants.CODE.BAD_REQUEST)
  //         .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
  //     }
  //   };
}

export default new InboxController();
