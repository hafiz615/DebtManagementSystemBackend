import {NextFunction, Request, Response} from 'express';
import constants from '../utils/constants.util';
import responseHelper from '../utils/responseHelper.util';
import Joi from 'joi';

class CaseValidate {
  async validateCase(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      debtor: Joi.object({
        basicInformation: Joi.object({
          fullName: Joi.string().required(),
          email: Joi.string().email().required(),
          SSID: Joi.string().required(),
          country: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
          phone: Joi.string().allow(''),
          address: Joi.string().allow(''),
        }),
        businessInformation: Joi.object({
          organizationName: Joi.string().required(),
          EIN: Joi.string().required(),
          businessCategory: Joi.string().allow(''),
          description: Joi.string().allow(''),
          country: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
          phone: Joi.string().allow(''),
          address: Joi.string().allow(''),
        }),
        contacts: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            title: Joi.string().required(),
            phone: Joi.string().allow(''),
            email: Joi.string().email().required(),
            relationWithDebtor: Joi.string().allow(''),
            country: Joi.string().allow(''),
            state: Joi.string().allow(''),
            city: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
          })
        ),
      }).optional(),
      creditor: Joi.object({
        basicInformation: Joi.object({
          fullName: Joi.string().required(),
          email: Joi.string().email().required(),
          SSID: Joi.string().required(),
          country: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
          phone: Joi.string().allow(''),
          address: Joi.string().allow(''),
        }),
        businessInformation: Joi.object({
          organizationName: Joi.string().required(),
          EIN: Joi.string().required(),
          businessCategory: Joi.string().allow(''),
          description: Joi.string().allow(''),
          country: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
          phone: Joi.string().allow(''),
          address: Joi.string().allow(''),
        }),
        contacts: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            title: Joi.string().required(),
            phone: Joi.string().allow(''),
            email: Joi.string().email().required(),
            relationWithDebtor: Joi.string().allow(''),
            country: Joi.string().allow(''),
            state: Joi.string().allow(''),
            city: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
          })
        ),
      }).optional(),
      totalDebt: Joi.number().required(),
      lastPaymentDate: Joi.date(),
      paidAmount: Joi.number().required(),
      remaining: Joi.number().required(),
      documents: Joi.array().items(Joi.string().allow('')).optional(),
      paymentPlanStartDate: Joi.date().required(),
      intervals: Joi.array().items(
        Joi.object({
          amount: Joi.number().required(),
          startDate: Joi.date().required(),
          frequency: Joi.number().required(),
          timePeriod: Joi.string().valid('Weekly', 'Monthly', 'Custom'),
        })
      ),
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
export default new CaseValidate();
