import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import CaseService from '../../services/case.service';

class CaseController {
  protected caseService: CaseService;

  constructor() {
    this.caseService = new CaseService();
  }
  createCase = async (req: Request, res: Response) => {
    try {
      const response = await this.caseService.createCase(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successRegisterMessage('Case'),
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

export default new CaseController();
