"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emailThreading_service_1 = __importDefault(require("../../../api/services/emailThreading.service"));
class EmailThreadingController {
    constructor() {
        this.emailThreadingService = new emailThreading_service_1.default();
    }
}
exports.default = new EmailThreadingController();
//# sourceMappingURL=emailThreading.controller.js.map