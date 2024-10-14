import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import DebtorService from '../../services/debtor.service';
import commonUtil from '../../../utils/common.util';

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
      const checkPermissionAll = await commonUtil.checkPermission(
        'viewClientsForAllUsers',
        req
      );
      if (!checkPermissionAll) {
        const checkPermission = await commonUtil.checkPermission(
          'viewClientsForSelf',
          req
        );
        if (!checkPermission)
          return res
            .status(constants.CODE.BAD_REQUEST)
            .send(
              responseHelper.get4xxResponse(
                'You do not have permission to perform this operation'
              )
            );
      }
      const keyword = checkPermissionAll
        ? 'viewClientsForAllUsers'
        : 'viewClientsForSelf';
      const response = await this.debtorService.searchListing(req, keyword);
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
    try {
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
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  updateDebtorBulk = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.updateDebtorBulk(req);
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
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  // createVault = async (req: Request, res: Response) => {
  //   try {
  //     if (!req.body || !req.body.paymentToken) {
  //       return [false, 'Payment token is missing'];
  //     }
  //     if (!req.body || !req.body.paymentType) {
  //       return [false, 'Payment token is missing'];
  //     }
  //     const response = await this.debtorService.createVault(
  //       req.body.paymentToken,
  //       req.params.id,
  //       req.body.paymentType
  //     );
  //     if (!response[0]) {
  //       return res
  //         .status(constants.CODE.BAD_REQUEST)
  //         .send(responseHelper.get4xxResponse(response[1]));
  //     }
  //     return res.status(constants.CODE.OK).send(
  //       responseHelper.get2xxResponse({
  //         statusCode: constants.CODE.OK,
  //         data: response[1],
  //         message: constants.successAddMessage('Customer vault id'),
  //       })
  //     );
  //   } catch (error) {
  //     console.log(error);
  //     return res
  //       .status(constants.CODE.BAD_REQUEST)
  //       .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
  //   }
  // };

  retryAuth = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'retryPayment',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
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
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  retryCapture = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'retryCapture',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
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
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getAllDebtors = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.getAllDebtors(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Debtors'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  createDebtor = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.createDebtor(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successRegisterMessage('Debtor'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  addDocumentsToDebtor = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.addDocumentsToDebtor(req);
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
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getLumpSumAmount = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.getLumpSumAmount(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Lump sum amount'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getFullProfitSettlement = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.getFullProfitSettlement(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Profit settlement'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getLumpSumJustifications = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.lumpSumJustifications(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Lump sum justifications'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getFullProfitJustifications = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.fullProfitJustifications(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Full profit justifications'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  getExtractedFields = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.getExtractedFields(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Extracted data'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
  createMultipleDebtors = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.createMultipleDebtors(req);
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
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  addDebtorAccount = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.addDebtorAccount(req);
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
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  saveWeeklyBudgetValues = async (req: Request, res: Response) => {
    try {
      const response = await this.debtorService.saveWeeklyBudgetValues(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: [],
          message: response[1],
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

export default new DebtorController();
