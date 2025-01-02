import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../../utils/responseHelper.util';
import constants from '../../utils/constants.util';
import Joi from 'joi';

dotenv.config();
class DebtorRequests {
    validateDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      paymentToken: Joi.string().optional().allow(''),
      paymentType: Joi.string().optional().allow(''),
      profitMargin: Joi.number().optional(),
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        state: Joi.string().required(),
        status: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required(),
        address: Joi.string().required(),
        weeklyBudget: Joi.number().optional(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        businessCategory: Joi.string().required(),
        description: Joi.string().allow(''),
        state: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string().pattern(/^\d{10}$/),
        address: Joi.string().required(),
      }),
      contact: Joi.object({
        name: Joi.string().required(),
        title: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required(),
        email: Joi.string().email().required(),
        relationWithDebtor: Joi.string().allow(''),
        state: Joi.string().allow(''),
        city: Joi.string().allow(''),
        zipCode: Joi.string().allow(''),
        _id: Joi.string().optional(),
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
  };

  createDebtor = (req: Request | any, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      mcaDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      bankStatementDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      otherDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      paymentType: Joi.string().allow(''),
      paymentToken: Joi.string().allow(''),
      extractedFields: Joi.array().allow(null).optional(),
      profitMargin: Joi.number().optional(),
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        state: Joi.string().required(),
        status: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required(),
        address: Joi.string().required(),
        weeklyBudget: Joi.number().optional(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        businessCategory: Joi.string().required(),
        description: Joi.string().allow(''),
        state: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string().pattern(/^\d{10}$/),
        address: Joi.string().required(),
      }),
      contacts: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          title: Joi.string().required(),
          phone: Joi.string()
            .pattern(/^\d{10}$/)
            .required(),
          email: Joi.string().email().required(),
          relationWithDebtor: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
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

  updateDebtorBulk = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      documents: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      paymentType: Joi.string().allow(''),
      paymentToken: Joi.string().allow(''),
      extractedFields: Joi.array().allow(null).optional(),
      profitMargin: Joi.number().optional(),
      basicInformation: Joi.object({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        SSID: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        state: Joi.string().required(),
        status: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string()
          .pattern(/^\d{10}$/)
          .required(),
        address: Joi.string().required(),
        weeklyBudget: Joi.number().optional(),
      }),
      businessInformation: Joi.object({
        companyName: Joi.string().required(),
        EIN: Joi.string()
          .pattern(/^\d{9}$/)
          .required(),
        businessCategory: Joi.string().required(),
        description: Joi.string().allow(''),
        state: Joi.string().required(),
        city: Joi.string().required(),
        zipCode: Joi.string().required(),
        phone: Joi.string().pattern(/^\d{10}$/),
        address: Joi.string().required(),
      }),
      contacts: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          title: Joi.string().required(),
          phone: Joi.string()
            .pattern(/^\d{10}$/)
            .required(),
          email: Joi.string().email().required(),
          relationWithDebtor: Joi.string().allow(''),
          state: Joi.string().allow(''),
          city: Joi.string().allow(''),
          zipCode: Joi.string().allow(''),
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

  createMultipleDebtors = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      debtors: Joi.array().items(
        Joi.object({
          paymentType: Joi.string().allow(''),
          paymentToken: Joi.string().allow(''),
          extractedFields: Joi.array().allow(null).optional(),
          driveUrl: Joi.string().allow(''),
          profitMargin: Joi.number().optional(),
          basicInformation: Joi.object({
            fullName: Joi.string().required().allow(''),
            email: Joi.string().email().required().allow(''),
            SSID: Joi.string().allow(''),
            state: Joi.string().allow(''),
            status: Joi.string().allow(''),
            city: Joi.string().allow(''),
            zipCode: Joi.string().allow(''),
            phone: Joi.string().allow(''),
            address: Joi.string().allow(''),
            weeklyBudget: Joi.number().optional(),
          }),
          businessInformation: Joi.object({
            companyName: Joi.string().required().allow(''),
            EIN: Joi.string().allow(''),
            businessCategory: Joi.string().allow(''),
            description: Joi.string().allow(''),
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
              phone: Joi.string().required(),
              email: Joi.string().email().required(),
              relationWithDebtor: Joi.string().allow(''),
              state: Joi.string().allow(''),
              city: Joi.string().allow(''),
              zipCode: Joi.string().allow(''),
            })
          ),
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

  addDebtorAccount = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      paymentType: Joi.string().required(),
      paymentToken: Joi.string().required(),
      platform: Joi.string().valid('Easypay direct', 'Seamlesschex').required(),
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

  saveWeeklyBudgetValues = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      strategy1Profit: Joi.number().strict(),
      strategy1Weekly: Joi.number().strict(),
      strategy1Custom: Joi.number().strict(),
      strategy1Choosen: Joi.string(),
      strategy3Profit: Joi.number().strict(),
      strategy3ProfitMargin: Joi.number().strict(),
      strategy3Custom: Joi.number().strict(),
      strategy3Choosen: Joi.string(),
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
  validateManualPayment(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      debtorId: Joi.string().required(),
      transactionIds: Joi.array().items(Joi.string()).required(),
      amount: Joi.number().required(),
      commission: Joi.number().required(),
      transactionDate: Joi.date().required(),
      transactionType: Joi.string().valid('Wire', 'Check', 'Cash').required(),
      referenceId: Joi.string().required(),
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

  async revertPayment(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      commission: Joi.number().required(),
      referenceId: Joi.string().required(),
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

  updateWeeklyBudget = (
    req: Request | any,
    res: Response,
    next: NextFunction
  ) => {
    const schema = Joi.object({
      weeklyBudget: Joi.number().strict().required(),
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

  async addDocumentsToDebtor(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({  
      mcaDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      bankStatementDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      ),
      otherDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          originalFileName: Joi.string().required(),
        }).optional()
      )})
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

export default new DebtorRequests();
