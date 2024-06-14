import {NextFunction, Request, Response} from 'express';
import constants from '../../utils/constants.util';
import responseHelper from '../../utils/responseHelper.util';
import Joi from 'joi';

class CaseValidate {
  async validateCase(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      debtor: Joi.object({
        basicInformation: Joi.object({
          fullName: Joi.string().required(),
          email: Joi.string().email().required(),
          SSID: Joi.string()
            .pattern(/^\d{9}$/)
            .required(),
          country: Joi.string().required(),
          state: Joi.string().required(),
          status: Joi.string()
            .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
            .required(),
          city: Joi.string().required(),
          zipCode: Joi.string().required(),
          phone: Joi.string()
            .pattern(/^\+\d{11}$/)
            .required(),
          address: Joi.string().required(),
          weeklyBudget: Joi.number(),
        }),
        businessInformation: Joi.object({
          companyName: Joi.string().required(),
          EIN: Joi.string()
            .pattern(/^\d{9}$/)
            .required(),
          businessCategory: Joi.string().required(),
          description: Joi.string().allow(''),
          country: Joi.string().required(),
          state: Joi.string().required(),
          city: Joi.string().required(),
          zipCode: Joi.string().required(),
          phone: Joi.string()
            .pattern(/^\+\d{11}$/)
            .required(),
          address: Joi.string().required(),
        }),
        contacts: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            title: Joi.string().required(),
            phone: Joi.string()
              .pattern(/^\+\d{11}$/)
              .required(),
            email: Joi.string().email().required(),
            relationWithDebtor: Joi.string().allow(''),
            country: Joi.string().allow(''),
            state: Joi.string().allow(''),
            city: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
          })
        ),
      }),
      creditor: Joi.object({
        basicInformation: Joi.object({
          fullName: Joi.string().required(),
          email: Joi.string().email().required(),
          phone: Joi.string()
            .pattern(/^\+\d{11}$/)
            .required(),
        }),
        businessInformation: Joi.object({
          companyName: Joi.string().required(),
          businessCategory: Joi.string().required(),
        }),
        contacts: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            title: Joi.string().required(),
            phone: Joi.string()
              .pattern(/^\+\d{11}$/)
              .required(),
            email: Joi.string().email().required(),
            relationWithDebtor: Joi.string().allow(''),
            country: Joi.string().allow(''),
            state: Joi.string().allow(''),
            city: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
          })
        ),
        notes: Joi.string().allow(''),
        creditorSecurityKey: Joi.string(),
        lastFundedDate: Joi.date().required(),
        historicalRange: Joi.object({
          minimum: Joi.number().strict().required(),
          maximum: Joi.number().strict().required(),
        }),
      }),
      totalDebt: Joi.number().strict().required(),
      lastPaymentDate: Joi.date(),
      paidAmount: Joi.number().strict().required(),
      remaining: Joi.number().strict().required(),
      paymentToken: Joi.string().allow(''),
      paymentType: Joi.string().valid('cc', 'ck').allow(''),
      status: Joi.string().required(),
      feePayment: Joi.string().valid(
        'paidViaCash',
        'toPay',
        'paidViaThirdParty'
      ),
      intervals: Joi.array().items(
        Joi.object({
          amount: Joi.number().strict().required(),
          startDate: Joi.date().required(),
          frequency: Joi.number().optional(),
          timePeriod: Joi.string()
            .valid('Weekly', 'Monthly', 'Custom', 'Fortnightly', 'Daily')
            .required(),
        })
      ),
    });
    if (req.query.bulk === 'true') {
      const cases = req.body.cases;
      if (Array.isArray(cases)) {
        for (const tempCase of cases) {
          const {error} = schema.validate(tempCase);
          if (error) {
            return res
              .status(constants.CODE.BAD_REQUEST)
              .send(
                responseHelper.get4xxResponse(
                  error.details[0].context.label +
                    constants.Messages.INVALID_FIELD
                )
              );
          }
        }
      } else {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse('Please provide cases array'));
      }
      return next();
    }
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

  async validateCaseAbout(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      status: Joi.string()
        .valid('Customer', 'On hold', 'Canceled', 'Declared Bankrupcy')
        .required(),
      caseOwner: Joi.string().required(),
      negotiator: Joi.string().required(),
      manager: Joi.string().required(),
      caseOwnerId: Joi.string().required(),
      negotiatorId: Joi.string().required(),
      managerId: Joi.string().required(),
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
