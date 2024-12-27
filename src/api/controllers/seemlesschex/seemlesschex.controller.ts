import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import PaymentService from '../../services/payment.service';
import SeemlesschexService from '../../services/seemlesschex.service';

class PaymentController {
  protected seemlesschexService: SeemlesschexService;

  constructor() {
    this.seemlesschexService = new SeemlesschexService();
  }
  createCheck = async (req: Request, res: Response) => {
    try {
      const response = await this.seemlesschexService.createCheck(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successCreatedMessage('Check'),
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  createPaymentLink = async (req: Request, res: Response) => {
    try {
      const response = await this.seemlesschexService.createPaymentLink(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successCreatedMessage('Payment link'),
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new PaymentController();
