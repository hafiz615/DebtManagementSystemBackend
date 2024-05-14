import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import CreditorService from '../../services/creditor.service';

class CreditorController {
  protected creditorService: CreditorService;

  constructor() {
    this.creditorService = new CreditorService();
  }
  getCreditor = async (req: Request, res: Response) => {
    try {
      const response = await this.creditorService.getCreditor(
        req.body.text ? req.body.text : ''
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
          message: constants.successFoundMessage('Creditor'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new CreditorController();
