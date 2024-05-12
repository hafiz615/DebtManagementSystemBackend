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
          status: Joi.string()
            .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
            .required(),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
          phone: Joi.string().allow(''),
          address: Joi.string().allow(''),
        }),
        businessInformation: Joi.object({
          companyName: Joi.string().required(),
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
          phone: Joi.string().allow(''),
        }),
        businessInformation: Joi.object({
          companyName: Joi.string().required(),
          businessCategory: Joi.string().allow(''),
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
        notes: Joi.string(),
        lastFundedDate: Joi.date().required(),
        historicalRange: Joi.object({
          minimum: Joi.number().required(),
          maximum: Joi.number().required(),
        }),
      }).optional(),
      totalDebt: Joi.number().required(),
      lastPaymentDate: Joi.date(),
      paidAmount: Joi.number().required(),
      remaining: Joi.number().required(),
      status: Joi.string().required(),
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      intervals: Joi.array().items(
        Joi.object({
          amount: Joi.number().required(),
          startDate: Joi.date().required(),
          frequency: Joi.number().optional(),
          timePeriod: Joi.string().valid(
            'Weekly',
            'Monthly',
            'Custom',
            'Fortnightly'
          ),
        })
      ),
    });
    if (req.query.bulk === 'true') {
      const cases = req.body.cases;
      for (const tempCase of cases) {
        const {error} = schema.validate(tempCase);
        if (error) {
          return res
            .status(constants.CODE.BAD_REQUEST)
            .send(responseHelper.get4xxResponse(error.details[0].message));
        }
      }
      return next();
    }
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
