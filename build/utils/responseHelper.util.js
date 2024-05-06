"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../enums");
const constants_util_1 = __importDefault(require("./constants.util"));
class ResponseHelper {
    get2xxResponse(response) {
        return {
            status: true,
            name: response.statusCode === constants_util_1.default.CODE.OK
                ? enums_1.responseName.ok
                : enums_1.responseName.created,
            message: response.message,
            data: response.data,
        };
    }
    get4xxResponse(message) {
        return {
            status: false,
            name: enums_1.responseName.failure,
            message: message,
            data: null,
        };
    }
}
exports.default = new ResponseHelper();
//# sourceMappingURL=responseHelper.util.js.map