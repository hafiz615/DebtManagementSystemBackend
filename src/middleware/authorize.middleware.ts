import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../utils/responseHelper.util';
import constants from '../utils/constants.util';
import TokenService from '../api/services/token.service';
import asyncLocalStorage from '../utils/localStorage.util';
// import {asyncLocalStorage} from '../utils/check';

dotenv.config();
class Authorize {
  validateAuth = (req: Request | any, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      return res
        .status(constants.CODE.FORBIDDEN)
        .send(
          responseHelper.get4xxResponse(
            constants.Messages.AUTHENTICATION_REQUIRED
          )
        );
    }
    const token = req.headers.authorization.split(' ')[1];
    if (token) {
      // verifies secret and checks exp
      return jwt.verify(
        token,
        process.env.jwtKey!,
        async (err: any, decoded: any) => {
          if (err || typeof decoded === 'string') {
            return res
              .status(constants.CODE.UNAUTHORIZED)
              .send(
                responseHelper.get4xxResponse(
                  constants.Messages.AUTHENTICATION_REQUIRED
                )
              );
          }
          const exists = await new TokenService().validateToken(
            token,
            decoded?.userId,
            decoded?.sessionId
          );
          if (exists === null || exists.isDeleted) {
            return res
              .status(constants.CODE.FORBIDDEN)
              .send(
                responseHelper.get4xxResponse(
                  constants.Messages.AUTHENTICATION_ERROR
                )
              );
          }
          req.id = String(exists._id);
          req.email = exists.email.toLowerCase();
          req.role = exists.role;
          const checkDipanRole = this.validateDipanRole(
            req.role,
            req.originalUrl
          );
          if (!checkDipanRole) {
            return res
              .status(constants.CODE.FORBIDDEN)
              .send(
                responseHelper.get4xxResponse(constants.Messages.ROLE_ACCESS)
              );
          }
          req.sessionId = decoded?.sessionId;
          req.name = exists.name;
          req.twilioNo = exists.twilioNo;
          const store = asyncLocalStorage.getStore();
          if (store) {
            store.set('ip', req.ip);
            store.set('name', req.name);
            store.set('userId', req.id);
            store.set('url', req.originalUrl);
            store.set('method', req.method);
          }
          return next();
        }
      );
    } else {
      return res
        .status(constants.CODE.UNAUTHORIZED)
        .send(
          responseHelper.get4xxResponse(
            constants.Messages.AUTHENTICATION_REQUIRED
          )
        );
    }
  };

  validateVerifyToken(token: string) {
    let validity = false;
    jwt.verify(
      token,
      process.env.verifyKey!,
      function (err: any, decoded: any) {
        if (err || typeof decoded === 'string') {
          validity = false;
        }
        validity = true;
      }
    );
    return validity;
  }

  validateRole = (req: Request | any, res: Response, next: NextFunction) => {
    if (req.role !== 'Admin') {
      return res
        .status(constants.CODE.FORBIDDEN)
        .send(responseHelper.get4xxResponse(constants.Messages.ROLE_ACCESS));
    }
    return next();
  };

  validateDipanRole = (role: string, path: string) => {
    if (role === 'Dipan') {
      const allowedPaths = [
        '/api/v1/debtor/add-debtor-account',
        '/api/v1/debtor/update-debtor-account',
        '/api/v1/debtor/delete-debtor-account',
        '/api/v1/debtor/get-extracted-data',
        '/api/v1/debtor/get-debtor-extracted-data',
        '/api/v1/debtor/client-financial-summary',
        '/api/v1/debtor/create-invoice',
        '/api/v1/seemlesschex/update-payment-link-status',
        '/api/v1/seemlesschex/get-payment-link-status',
        '/api/v1/seemlesschex/update-invoice-status',
        '/api/v1/seemlesschex/get-invoice-status',
      ];

      const findPath = allowedPaths.find(allowedPath =>
        path.startsWith(allowedPath)
      );

      if (findPath) return true;
      return false;
    }
    return true;
  };
}

export default new Authorize();
