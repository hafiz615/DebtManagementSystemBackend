import {Request, Response} from 'express';
import DraftService from '../../services/draft.service';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';

class DraftController {
  protected draftService: DraftService;

  constructor() {
    this.draftService = new DraftService();
  }

  getAllDraftMessages = async (req: Request, res: Response) => {
    try {
      const response = await this.draftService.getAllDraftMessages(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Drafts'),
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
        const response = await this.draftService.createEmailDraft(req);
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
}

export default new DraftController();
