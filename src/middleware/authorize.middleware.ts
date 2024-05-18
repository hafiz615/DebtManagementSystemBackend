import * as _ from 'lodash';
import * as jwt from 'jsonwebtoken';
import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import responseHelper from '../utils/responseHelper.util';
import constants from '../utils/constants.util';
import TokenService from '../api/services/token.service';
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
        async function (err: any, decoded: any) {
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
          if (exists === null) {
            return res
              .status(constants.CODE.FORBIDDEN)
              .send(
                responseHelper.get4xxResponse(
                  constants.Messages.AUTHENTICATION_ERROR
                )
              );
          }
          req.id = String(exists._id);
          req.email = exists.email;
          req.role = exists.role;
          return next();
        }
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
}

export default new Authorize();
