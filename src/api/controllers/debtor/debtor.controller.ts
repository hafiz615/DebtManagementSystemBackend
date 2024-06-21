import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import DebtorService from '../../services/debtor.service';

class DebtorController {
  protected debtorService: DebtorService;

  constructor() {
    this.debtorService = new DebtorService();
  }
  getDebtor = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.getDebtor(
        req.body.text ? req.body.text : ''
      );
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Debtor'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  listingDetails = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.listingDetails(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Client details'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  searchListing = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.searchListing(req);
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Clients list'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  updateDebtor = async (req: Request, res: Response) => {
    const response = await this.debtorService.updateDebtor(req);
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.successUpdateMessage('Debtor'),
      })
    );
  };

  createVault = async (req: Request, res: Response) => {
    if (!req.body || !req.body.paymentToken) {
      return [false, 'Payment token is missing'];
    }
    if (!req.body || !req.body.paymentType) {
      return [false, 'Payment token is missing'];
    }
    const response = await this.debtorService.createVault(
      req.body.paymentToken,
      req.params.id,
      req.body.paymentType
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
        message: constants.successAddMessage('Customer vault id'),
      })
    );
  };

  retryAuth = async (req: Request, res: Response) => {
    const response = await this.debtorService.retryAuth(req.params.id);
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
  };

  retryCapture = async (req: Request, res: Response) => {
    const response = await this.debtorService.retryCapture(req.params.id);
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
  };
}

export default new DebtorController();
