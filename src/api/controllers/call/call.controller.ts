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
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  // callHangUp = async (req: Request, res: Response) => {
  //   try {
  //     const response = await this.caseService.callHangUp(req);
  //     if (!response[0]) {
  //       return res
  //       .status(constants.CODE.BAD_REQUEST)
  //       .send(responseHelper.get4xxResponse(response[1]));
  //     }
  //     return res.status(constants.CODE.OK).send(
  //       responseHelper.get2xxResponse({
  //         statusCode: constants.CODE.OK,
  //         data: response[1],
  //         message: constants.successFoundMessage(
  //           'Twilio'
  //         ),
  //       })
  //     );
  //   }
  //   catch (error) {
  //   return res
  //   .status(constants.CODE.BAD_REQUEST)
  //   .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
  //  }
  // }

  // callTranscriptionStatus = async (req: Request, res: Response) => {
  //   try {
  //     const response = await this.caseService.callTranscriptionStatus(req);
  //     if (!response[0]) {
  //       return res
  //         .status(constants.CODE.BAD_REQUEST)
  //         .send(responseHelper.get4xxResponse(response));
  //     }
  //     return res.status(constants.CODE.CREATED).send(
  //       responseHelper.get2xxResponse({
  //         statusCode: constants.CODE.CREATED,
  //         data: response[1],
  //         message: constants.successUpdateMessage('Cases'),
  //       })
  //     );
  //   } catch (error) {
  //     return res
  //       .status(constants.CODE.BAD_REQUEST)
  //       .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
  //   }
  // };

  callRecordingStatus = async (req: Request, res: Response) => {
    try {
      const response = await this.callService.callRecordingStatus(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response));
      }
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
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
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
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  // createCall = async (req: Request, res: Response) => {
  //   try {
  //     const response = await this.caseService.createCall(req);
  //     if (!response[0]) {
  //       return res
  //         .status(constants.CODE.BAD_REQUEST)
  //         .send(responseHelper.get4xxResponse(response));
  //     }
  //     return res.status(constants.CODE.CREATED).send(
  //       responseHelper.get2xxResponse({
  //         statusCode: constants.CODE.CREATED,
  //         data: response[1],
  //         message: constants.callMadesuccessMessage('Call'),
  //       })
  //     );
  //   } catch (error) {
  //     return res
  //       .status(constants.CODE.BAD_REQUEST)
  //       .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
  //   }
  // };
  
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
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

}

export default new CallController();