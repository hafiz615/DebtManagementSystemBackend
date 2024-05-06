"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRepository = void 0;
const contact_model_1 = require("../../../database/models/contact.model");
const base_repository_1 = require("../base.repository");
class ContactRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(contact_model_1.Contact);
    }
}
exports.ContactRepository = ContactRepository;
//# sourceMappingURL=contact.repository.js.map