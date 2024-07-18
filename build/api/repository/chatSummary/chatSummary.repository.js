"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSummaryRepository = void 0;
const chatSummary_model_1 = require("../../../database/models/chatSummary.model");
const base_repository_1 = require("../base.repository");
class ChatSummaryRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(chatSummary_model_1.ChatSummary);
    }
}
exports.ChatSummaryRepository = ChatSummaryRepository;
//# sourceMappingURL=chatSummary.repository.js.map