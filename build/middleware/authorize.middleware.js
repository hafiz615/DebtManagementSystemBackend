"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = __importStar(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const responseHelper_util_1 = __importDefault(require("../utils/responseHelper.util"));
const constants_util_1 = __importDefault(require("../utils/constants.util"));
const token_service_1 = __importDefault(require("../api/services/token.service"));
const localStorage_util_1 = __importDefault(require("../utils/localStorage.util"));
// import {asyncLocalStorage} from '../utils/check';
dotenv_1.default.config();
class Authorize {
    constructor() {
        this.validateAuth = (req, res, next) => {
            if (!req.headers.authorization) {
                return res
                    .status(constants_util_1.default.CODE.FORBIDDEN)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
            }
            const token = req.headers.authorization.split(' ')[1];
            if (token) {
                // verifies secret and checks exp
                return jwt.verify(token, process.env.jwtKey, async (err, decoded) => {
                    if (err || typeof decoded === 'string') {
                        return res
                            .status(constants_util_1.default.CODE.UNAUTHORIZED)
                            .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
                    }
                    const exists = await new token_service_1.default().validateToken(token, decoded?.userId, decoded?.sessionId);
                    if (exists === null || exists.isDeleted) {
                        return res
                            .status(constants_util_1.default.CODE.FORBIDDEN)
                            .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_ERROR));
                    }
                    req.id = String(exists._id);
                    req.email = exists.email.toLowerCase();
                    req.role = exists.role;
                    const checkDipanRole = this.validateDipanRole(req.role, req.originalUrl);
                    if (!checkDipanRole) {
                        return res
                            .status(constants_util_1.default.CODE.FORBIDDEN)
                            .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.ROLE_ACCESS));
                    }
                    req.sessionId = decoded?.sessionId;
                    req.name = exists.name;
                    req.twilioNo = exists.twilioNo;
                    const store = localStorage_util_1.default.getStore();
                    if (store) {
                        store.set('ip', req.ip);
                        store.set('name', req.name);
                        store.set('userId', req.id);
                        store.set('url', req.originalUrl);
                        store.set('method', req.method);
                    }
                    return next();
                });
            }
            else {
                return res
                    .status(constants_util_1.default.CODE.UNAUTHORIZED)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
            }
        };
        this.validateRole = (req, res, next) => {
            if (req.role !== 'Admin') {
                return res
                    .status(constants_util_1.default.CODE.FORBIDDEN)
                    .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.ROLE_ACCESS));
            }
            return next();
        };
        this.validateDipanRole = (role, path) => {
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
                const findPath = allowedPaths.find(allowedPath => path.startsWith(allowedPath));
                if (findPath)
                    return true;
                return false;
            }
            return true;
        };
    }
    validateVerifyToken(token) {
        let validity = false;
        jwt.verify(token, process.env.verifyKey, function (err, decoded) {
            if (err || typeof decoded === 'string') {
                validity = false;
            }
            validity = true;
        });
        return validity;
    }
    validateDebtorToken(req, res, next) {
        if (!req.headers.authorization) {
            return res
                .status(constants_util_1.default.CODE.FORBIDDEN)
                .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
        }
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
            // verifies secret and checks exp
            return jwt.verify(token, process.env.jwtKey, async (err, decoded) => {
                if (err || typeof decoded === 'string') {
                    return res
                        .status(constants_util_1.default.CODE.UNAUTHORIZED)
                        .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
                }
                return next();
            });
        }
        else {
            return res
                .status(constants_util_1.default.CODE.UNAUTHORIZED)
                .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
        }
    }
}
exports.default = new Authorize();
//# sourceMappingURL=authorize.middleware.js.map