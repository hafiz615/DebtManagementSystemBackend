"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailThreading_repository_1 = require("../repository/emailThreading/emailThreading.repository");
class EmailThreadingService {
    constructor() {
        this.emailThreadingRepository = new emailThreading_repository_1.EmailThreadingRepository();
    }
}
exports.default = EmailThreadingService;
//# sourceMappingURL=emailThreading.service.js.map