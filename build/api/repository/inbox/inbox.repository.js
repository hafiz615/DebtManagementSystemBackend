"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxRepository = void 0;
const inbox_model_1 = require("../../../database/models/inbox.model");
const base_repository_1 = require("../base.repository");
class InboxRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(inbox_model_1.Inbox);
    }
}
exports.InboxRepository = InboxRepository;
//# sourceMappingURL=inbox.repository.js.map