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
const global_1 = __importDefault(require("../global"));
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
                return jwt.verify(token, process.env.jwtKey, async function (err, decoded) {
                    if (err || typeof decoded === 'string') {
                        return res
                            .status(constants_util_1.default.CODE.UNAUTHORIZED)
                            .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_REQUIRED));
                    }
                    const exists = await new token_service_1.default().validateToken(token, decoded?.userId);
                    if (exists === null) {
                        return res
                            .status(constants_util_1.default.CODE.FORBIDDEN)
                            .send(responseHelper_util_1.default.get4xxResponse(constants_util_1.default.Messages.AUTHENTICATION_ERROR));
                    }
                    global_1.default.userId = String(exists._id);
                    global_1.default.email = exists.email;
                    global_1.default.role = exists.role;
                    return next();
                });
            }
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
}
exports.default = new Authorize();
//# sourceMappingURL=authorize.middleware.js.map