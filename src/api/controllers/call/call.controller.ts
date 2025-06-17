import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
// import CaseService from '../../services/case.service';
import CallService from '../../services/call.service';

class CallController {
  protected callService: CallService;

  constructor() {
    this.callService = new CallService();
  }

  callTwiml = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callTwiml(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      res.type('text/xml');
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  updateCall = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.updateCall(req);
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
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  updateConferenceParticipant = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.updateConferenceParticipant(req);
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
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  callSummary = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callSummary(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Summary for this call'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  callFallBack = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callFallback(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      res.type('text/xml');
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  callRecordingStatus = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callRecordingStatus(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.NO_CONTENT)
          .send(responseHelper.get4xxResponse(response));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successUpdateMessage('Call Recording'),
        })
      );
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  conferenceStartEvent = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.conferenceStartEvent(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successUpdateMessage('Call Sid'),
        })
      );
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  conferenceRecordingStatus = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.conferenceRecordingStatus(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.NO_CONTENT)
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
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  addParticipant = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.addParticipant(req);
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
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };
  getCalls = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getCalls(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('All Calls for this Case'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getAllTheParticipants = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getAllTheParticipants(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Particpants'),
        })
      );
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  callStatus = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callStatus(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.callMadesuccessMessage('Call'),
        })
      );
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  getToken = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getToken(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Token'),
        })
      );
    } catch (error) {
      console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  getIncomingCallSid = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getIncomingCallSid(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Parent Call Sid'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  callerName = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callerName(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Caller name'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  getMissedCalls = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getMissedCalls(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Missed Calls'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  voiceMail = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.voiceMail(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      res.type('text/xml');
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      console.log('error voice mail', error.message);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  getVoiceMails = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getVoiceMails(req);
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
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  voiceMailRecording = async (req: Request, res: Response) => {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    let twiml = new VoiceResponse();
    try {
      const response = await this.callService.voiceMailRecording(req);

      if (!response[0]) {
        twiml.say(
          'We encountered an issue saving your voicemail. Please try again later.'
        );

        res.type('text/xml');
        return res.status(200).send(twiml.toString());
      }

      res.type('text/xml');
      return res.status(200).send(response[1]);
    } catch (error) {
      console.log('Error in voiceMailRecording:', error.message);

      twiml.say('We encountered an error. Please try again later.');

      res.type('text/xml');
      return res.status(200).send(twiml.toString());
    }
  };

  voiceMailRecordingStatus = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.voiceMailRecordingStatus(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response));
      }
      res.type('text/xml');
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successUpdateMessage('Cases'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  deleteCall = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.deleteCall(req);
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
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  removeParticipant = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.removeParticipant(req);
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
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  completeConference = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.completeConference(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
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
        .status(constants.CODE.OK)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  getAllUserNumbers = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.getAllUserNumbers();
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('All User Twilio Numbers'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  telnyxCallStatus = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.telnyxCallStatus(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.callMadesuccessMessage('Call'),
        })
      );
    } catch (error) {
      // console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  telnyxCallFallBack = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.telnyxCallFallback(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      console.log('error', error.response.data.errors);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  telnyxToken = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.telnyxToken(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successCreatedMessage('Token'),
        })
      );
    } catch (error) {
      // console.log('error', error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };

  telnyxEvents = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.telnyxEvents(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(response[1]);
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.message));
    }
  };
}

export default new CallController();
