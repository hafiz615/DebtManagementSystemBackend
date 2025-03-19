import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import VoiceMailService from '../../services/voiceMail.service';

class VoiceMailController {
  protected voiceMailService: VoiceMailService;

  constructor() {
    this.voiceMailService = new VoiceMailService();
  }

  voiceMail = async (req: Request, res: Response) => {
    try {
      const response = await this.voiceMailService.voiceMail(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      res.type('text/xml');
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getVoiceMails = async (req: Request, res: Response) => {
    try {
      const response = await this.voiceMailService.getVoiceMails(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('All Voice Mails'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  voiceMailRecording = async (req: Request, res: Response) => {
    try {
      const response = await this.voiceMailService.voiceMailRecording(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
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
}

export default new VoiceMailController();
