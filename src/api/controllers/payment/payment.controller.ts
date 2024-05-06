import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import PaymentService from '../../services/payment.service';

class PaymentController {
  protected paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }
  getHomePayments = async (req: Request, res: Response) => {
    try {
      const response = await this.paymentService.getHomePayments(
        Number(req.query.days)
      );
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Payments'),
        })
      );
    } catch (error: any) {
      console.log(error.message);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getCaseUpcomingPayments = async (req: Request, res: Response) => {
    try {
      const response = await this.paymentService.getCaseUpcomingPayments(
        req.params.id
      );
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Upcoming payments'),
        })
      );
    } catch (error: any) {
      console.log(error.message);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new PaymentController();
