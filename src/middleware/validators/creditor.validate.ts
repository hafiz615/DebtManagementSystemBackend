import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class CreditorRequests {
  validateCreditor = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        businessCategory: Joi.string().allow(''),
      }),
      accountTitle: Joi.string().optional().allow('', null),
      contact: Joi.object({
        name: Joi.string().required(),
        title: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required(),
        email: Joi.string().email().required(),
        relationWithCreditor: Joi.string().allow(''),
        state: Joi.string().allow(''),
        city: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        _id: Joi.string().optional(),
      }),
      paymentToken: Joi.string().optional().allow(''),
      paymentType: Joi.string().optional().allow(''),
      paynoteSourceId: Joi.string().optional().allow(''),
      paynoteUserId: Joi.string().optional().allow(''),
      lastFundedDate: Joi.date().optional().allow(''),
      historicalRange: Joi.object({
        minimum: Joi.number().strict().optional(),
        maximum: Joi.number().strict().optional(),
      })
        .optional()
        .allow(null),
      aggression: Joi.number().optional().min(0).max(10),
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
  };

  validateMultipleCreditors = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      cases: Joi.array().items(
        Joi.object({
          _id: Joi.string().optional().allow(''),
          totalDebt: Joi.number().strict().optional(),
          lastPaymentDate: Joi.date().optional().allow(''),
          paidAmount: Joi.number().strict().optional(),
          remaining: Joi.number().strict().optional(),
          confidence: Joi.number().strict(),
          contractDetails: Joi.object().optional().allow(null),
          status: Joi.string().optional().allow(''),
          feePayment: Joi.string()
            .valid('paidViaCash', 'toPay', 'paidViaThirdParty')
            .optional()
            .allow(''),
          creditor: Joi.object({
            aggression: Joi.number().optional().min(0).max(10),
            _id: Joi.string().optional().allow(''),
            paymentType: Joi.string().allow(''),
            paymentToken: Joi.string().allow(''),
            basicInformation: Joi.object({
              fullName: Joi.string().required(),
              email: Joi.string().email().required(),
              phone: Joi.string()
                .pattern(/^\d{10}$/)
                .required(),
            }),
            businessInformation: Joi.object({
              companyName: Joi.string().required(),
              businessCategory: Joi.string().allow(''),
            }),
            contacts: Joi.array()
              .items(
                Joi.object({
                  name: Joi.string().required(),
                  title: Joi.string().required(),
                  phone: Joi.string()
                    .pattern(/^\d{10}$/)
                    .required(),
                  email: Joi.string().email().required(),
                  relationWithCreditor: Joi.string().allow(''),
                  state: Joi.string().allow(''),
                  city: Joi.string().allow(''),
                  zipCode: Joi.string().allow(''),
                  _id: Joi.string().optional(),
                })
              )
              .optional(),
            notes: Joi.string().allow(''),
            creditorSecurityKey: Joi.string().optional().allow(''),
            paynoteSourceId: Joi.string().optional().allow(''),
            paynoteUserId: Joi.string().optional().allow(''),
            accountTitle: Joi.string().optional().allow('', null),
            lastFundedDate: Joi.date().optional().allow(''),
            historicalRange: Joi.object({
              minimum: Joi.number().strict().optional(),
              maximum: Joi.number().strict().optional(),
            }),
          })
            .optional()
            .allow(null),
        })
      ),
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
  };

  async syncCreditorEmail(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
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

export default new CreditorRequests();
