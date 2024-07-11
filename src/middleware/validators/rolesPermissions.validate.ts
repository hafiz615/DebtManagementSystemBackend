import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
class CustomFieldRequest {
  async role(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string(),
      createdBy: Joi.string().optional(),
      generalPermissions: Joi.object({
        createNewCase: Joi.boolean(),
        importBulkCases: Joi.boolean(),
        viewUserListing: Joi.boolean(),
        addNewUser: Joi.boolean(),
        deleteUser: Joi.boolean(),
        createAdminUser: Joi.boolean(),
        viewHomeScreen: Joi.boolean(),
        viewPaymentsAndAuthorizations: Joi.boolean(),
        retryPayment: Joi.boolean(),
        viewCaseDetails: Joi.boolean(),
        viewClientsForSelf: Joi.boolean(),
        viewClientsForAllUsers: Joi.boolean(),
        viewCreditorsForSelf: Joi.boolean(),
        viewCreditorsForAllUsers: Joi.boolean(),
      }),
      settings: Joi.object({
        editPaymentsNotificationSettings: Joi.boolean(),
        editAuthorizationInterval: Joi.boolean(),
        editRetryInterval: Joi.boolean(),
        viewNotificationTemplates: Joi.boolean(),
        viewCustomFields: Joi.boolean(),
        addNotificationTemplate: Joi.boolean(),
        editNotificationTemplate: Joi.boolean(),
        addCustomFields: Joi.boolean(),
        deleteNotificationTemplate: Joi.boolean(),
        editCustomFields: Joi.boolean(),
        deleteCustomFields: Joi.boolean(),
        viewCaseStatuses: Joi.boolean(),
        addCaseStatus: Joi.boolean(),
        editCaseStatus: Joi.boolean(),
        deleteCaseStatus: Joi.boolean(),
        viewPipeline: Joi.boolean(),
        createPipeline: Joi.boolean(),
        editPipeline: Joi.boolean(),
        deletePipeline: Joi.boolean(),
      }),
      analytics: Joi.object({
        viewAnalyticsForSelf: Joi.boolean(),
        viewAnalyticsForAllusers: Joi.boolean(),
      }),
    });

    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(
          responseHelper.get4xxResponse(
            error.details[0].context.label + constants.Messages.INVALID_FIELD
          )
        );
    }
  }
}
export default new CustomFieldRequest();
