import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';
import {values} from 'lodash';
import {Events, User} from '../../enums';

class SettingValidate {
  async validateNotificationConfiguration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const schema = Joi.object({
      label: Joi.string().optional().allow('', null),
      value: Joi.string()
        .valid(
          Events.case_details_update,
          Events.case_manager_changed,
          Events.case_negotiator_changed,
          Events.case_note_added,
          Events.case_owner_changed,
          Events.case_task_added,
          Events.case_task_assigned,
          Events.case_task_due_data_near,
          Events.case_task_unassigned,
          Events.failed_authorization,
          Events.failed_payment,
          Events.successful_authorization,
          Events.case_details_update,
          Events.upcoming_payment,
          Events.successful_payment
        )
        .required(),
      userPermission: Joi.array()
        .items(
          Joi.object({
            role: Joi.string()
              .valid(
                User.admin,
                User.case_Manager,
                User.creditor,
                User.debtor,
                User.negotiator
              )
              .required(),
            sms_allowed: Joi.boolean().required(),
            email_allowed: Joi.boolean().required(),
            sms_template: Joi.string().allow(''),
            email_template: Joi.string().allow(''),
          })
        )
        .required(),
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
export default new SettingValidate();
