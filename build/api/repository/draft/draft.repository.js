"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftRepository = void 0;
const draft_model_1 = require("../../../database/models/draft.model");
const base_repository_1 = require("../base.repository");
class DraftRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(draft_model_1.Draft);
    }
}
exports.DraftRepository = DraftRepository;
//# sourceMappingURL=draft.repository.js.map