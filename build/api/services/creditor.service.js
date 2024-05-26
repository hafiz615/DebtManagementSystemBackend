"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const creditor_repository_1 = require("../repository/creditor/creditor.repository");
class CreditorService {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
    }
    async getCreditor(text) {
        const creditor = await this.creditorRepository.getOne({
            $or: [
                {
                    'basicInformation.email': {
                        $regex: new RegExp(text, 'i'), // Case-insensitive match for email
                    },
                },
                {
                    'basicInformation.phone': {
                        $regex: new RegExp(text), // Case-insensitive match for phone
                    },
                },
            ],
        }, undefined, undefined, ['contacts']);
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
    async updateCreditor(req) {
        const creditor = await this.creditorRepository.updateById(req.params.id, { ...req.body });
        if (!creditor) {
            return [false, constants_util_1.default.notFoundMessage('Creditor')];
        }
        return [true, creditor];
    }
}
exports.default = CreditorService;
//# sourceMappingURL=creditor.service.js.map