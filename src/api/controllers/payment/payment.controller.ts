import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import PaymentService from '../../services/payment.service';
import commonUtil from '../../../utils/common.util';
import bulkUploadCronjob from '../../../cron-job/bulkUpload.cronjob';
import paymentCronjob from '../../../cron-job/payment.cronjob';

class PaymentController {
  protected paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }
  getHomePayments = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'viewHomeScreen',
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
      const response = await this.paymentService.getHomePayments(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
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
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getCasePayments = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'viewCaseDetails',
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
      const response = await this.paymentService.getCasePayments(req.params.id);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Case payments'),
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  addACHDetailsCreditor = async (req: Request, res: Response) => {
    try {
      const response = await this.paymentService.addACHDetailsCreditor(req);
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

  processAuthAndCapture = async (req: Request, res: Response) => {
    try {
      await paymentCronjob.processPayments();
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: [],
          message: 'Payments auth and capture is done',
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  processPaynoteTransfer = async (req: Request, res: Response) => {
    try {
      await paymentCronjob.testPaynote();
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: [],
          message: 'Payments transfer via paynote is done',
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  sendPaymentPaynote = async (req: Request, res: Response) => {
    try {
      // const response = await this.paymentService.sendPaymentPaynote(req);
      // if (!response[0]) {
      //   return res
      //     .status(constants.CODE.BAD_REQUEST)
      //     .send(responseHelper.get4xxResponse(response[1]));
      // }
      // return res.status(constants.CODE.OK).send(
      //   responseHelper.get2xxResponse({
      //     statusCode: constants.CODE.OK,
      //     data: [],
      //     message: response[1],
      //   })
      // );
      return 'ok';
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new PaymentController();
