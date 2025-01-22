import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class CustomFieldRequest {
  async role(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      name: Joi.string().messages({
        'string.base': 'Name must be a string.',
        'string.empty': 'Name cannot be empty.',
      }),
      createdBy: Joi.string().optional().messages({
        'string.base': 'Created By must be a string.',
      }),
      generalPermissions: Joi.object({
        createNewCase: Joi.boolean().messages({
          'boolean.base': 'Create new case permission must be a boolean.',
        }),
        importBulkCases: Joi.boolean().messages({
          'boolean.base': 'Import bulk cases permission must be a boolean.',
        }),
        viewUserListing: Joi.boolean().messages({
          'boolean.base': 'View user listing permission must be a boolean.',
        }),
        addNewUser: Joi.boolean().messages({
          'boolean.base': 'Add new user permission must be a boolean.',
        }),
        deleteUser: Joi.boolean().messages({
          'boolean.base': 'Delete user permission must be a boolean.',
        }),
        createAdminUser: Joi.boolean().messages({
          'boolean.base': 'Create admin user permission must be a boolean.',
        }),
        viewHomeScreen: Joi.boolean().messages({
          'boolean.base': 'View home screen permission must be a boolean.',
        }),
        viewPaymentsAndAuthorizations: Joi.boolean().messages({
          'boolean.base':
            'View payments and authorizations permission must be a boolean.',
        }),
        retryPayment: Joi.boolean().messages({
          'boolean.base': 'Retry payment permission must be a boolean.',
        }),
        retryCapture: Joi.boolean().messages({
          'boolean.base': 'Retry capture permission must be a boolean.',
        }),
        viewCaseDetails: Joi.boolean().messages({
          'boolean.base': 'View case details permission must be a boolean.',
        }),
        viewClientsForSelf: Joi.boolean().messages({
          'boolean.base': 'View clients for self permission must be a boolean.',
        }),
        viewClientsForAllUsers: Joi.boolean().messages({
          'boolean.base':
            'View clients for all users permission must be a boolean.',
        }),
        viewCreditorsForSelf: Joi.boolean().messages({
          'boolean.base':
            'View creditors for self permission must be a boolean.',
        }),
        viewCreditorsForAllUsers: Joi.boolean().messages({
          'boolean.base':
            'View creditors for all users permission must be a boolean.',
        }),
      }),
      settings: Joi.object({
        editPaymentsNotificationSettings: Joi.boolean().messages({
          'boolean.base':
            'Edit payments notification settings permission must be a boolean.',
        }),
        editAuthorizationInterval: Joi.boolean().messages({
          'boolean.base':
            'Edit authorization interval permission must be a boolean.',
        }),
        editRetryInterval: Joi.boolean().messages({
          'boolean.base': 'Edit retry interval permission must be a boolean.',
        }),
        viewNotificationTemplates: Joi.boolean().messages({
          'boolean.base':
            'View notification templates permission must be a boolean.',
        }),
        viewCustomFields: Joi.boolean().messages({
          'boolean.base': 'View custom fields permission must be a boolean.',
        }),
        addNotificationTemplate: Joi.boolean().messages({
          'boolean.base':
            'Add notification template permission must be a boolean.',
        }),
        editNotificationTemplate: Joi.boolean().messages({
          'boolean.base':
            'Edit notification template permission must be a boolean.',
        }),
        addCustomFields: Joi.boolean().messages({
          'boolean.base': 'Add custom fields permission must be a boolean.',
        }),
        deleteNotificationTemplate: Joi.boolean().messages({
          'boolean.base':
            'Delete notification template permission must be a boolean.',
        }),
        editCustomFields: Joi.boolean().messages({
          'boolean.base': 'Edit custom fields permission must be a boolean.',
        }),
        deleteCustomFields: Joi.boolean().messages({
          'boolean.base': 'Delete custom fields permission must be a boolean.',
        }),
        viewCaseStatuses: Joi.boolean().messages({
          'boolean.base': 'View case statuses permission must be a boolean.',
        }),
        addCaseStatus: Joi.boolean().messages({
          'boolean.base': 'Add case status permission must be a boolean.',
        }),
        editCaseStatus: Joi.boolean().messages({
          'boolean.base': 'Edit case status permission must be a boolean.',
        }),
        deleteCaseStatus: Joi.boolean().messages({
          'boolean.base': 'Delete case status permission must be a boolean.',
        }),
        viewPipeline: Joi.boolean().messages({
          'boolean.base': 'View pipeline permission must be a boolean.',
        }),
        createPipeline: Joi.boolean().messages({
          'boolean.base': 'Create pipeline permission must be a boolean.',
        }),
        editPipeline: Joi.boolean().messages({
          'boolean.base': 'Edit pipeline permission must be a boolean.',
        }),
        deletePipeline: Joi.boolean().messages({
          'boolean.base': 'Delete pipeline permission must be a boolean.',
        }),
        addRole: Joi.boolean().messages({
          'boolean.base': 'Add role permission must be a boolean.',
        }),
        viewRoles: Joi.boolean().messages({
          'boolean.base': 'View roles permission must be a boolean.',
        }),
        editRole: Joi.boolean().messages({
          'boolean.base': 'Edit role permission must be a boolean.',
        }),
        deleteRole: Joi.boolean().messages({
          'boolean.base': 'Delete role permission must be a boolean.',
        }),
      }),
      analytics: Joi.object({
        viewAnalyticsForSelf: Joi.boolean().messages({
          'boolean.base':
            'View analytics for self permission must be a boolean.',
        }),
        viewAnalyticsForAllusers: Joi.boolean().messages({
          'boolean.base':
            'View analytics for all users permission must be a boolean.',
        }),
      }),
    });

    const {error} = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(error.details[0].message));
    }
  }
}

export default new CustomFieldRequest();
