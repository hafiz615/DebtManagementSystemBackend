import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import CaseService from '../../services/case.service';
import BulkUploadService from '../../services/bulkUpload.service';
import bulkUploadCronjob from '../../../cron-job/bulkUpload.cronjob';

class BulkUploadController {
  protected bulkUploadService: BulkUploadService;

  constructor() {
    this.bulkUploadService = new BulkUploadService();
  }

  getBulkUploadAnalytics = async (req: Request, res: Response) => {
    try {
      const response = await this.bulkUploadService.getBulkUploadAnalytics(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Bulk upload analytics'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getBulkCasesDetails = async (req: Request, res: Response) => {
    try {
      const response = await this.bulkUploadService.getBulkCasesDetails(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Bulk case details'),
        })
      );
    } catch (error) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  processBulkCronJob = async (req: Request, res: Response) => {
    try {
      await bulkUploadCronjob.testBulkCron();
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: [],
          message: 'Bulk cron job is completed',
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

export default new BulkUploadController();
