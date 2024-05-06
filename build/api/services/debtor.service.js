"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const debtor_repository_1 = require("../repository/debtor/debtor.repository");
class DebtorService {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    async getDebtor(email) {
        const debtor = await this.debtorRepository.getOne({ 'basicInformation.email': email }, undefined, undefined, ['contacts']);
        if (!debtor) {
            return [false, constants_util_1.default.notFoundMessage('Debtor')];
        }
        return [true, debtor];
    }
}
exports.default = DebtorService;
//# sourceMappingURL=debtor.service.js.map