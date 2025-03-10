import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import AttorneyService from '../../services/attorney.service';

class AttorneyController {
  protected attorneyService: AttorneyService;

  constructor() {
    this.attorneyService = new AttorneyService();
  }

  getLawSuitBalanceSummary = async (req: Request, res: Response) => {
    try {
      const response = await this.attorneyService.getLawSuitBalanceSummary(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Lawsuit Balance Summary'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new AttorneyController();
