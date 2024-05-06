"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const common_util_1 = __importDefault(require("../../utils/common.util"));
class Contact {
    constructor() {
        this.name = '';
        this.title = '';
        this.phone = '';
        this.email = '';
        this.relationWithDebtor = '';
        this.country = '';
        this.state = '';
        this.city = '';
        this.zipCode = '';
        this.createdAt = common_util_1.default.getCurrentDate();
        this.updatedAt = common_util_1.default.getCurrentDate();
    }
}
exports.Contact = Contact;
//# sourceMappingURL=contact.repomodel.js.map