"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JustificationRepository = void 0;
const justification_model_1 = require("../../../database/models/justification.model");
const base_repository_1 = require("../base.repository");
class JustificationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(justification_model_1.Justification);
    }
}
exports.JustificationRepository = JustificationRepository;
//# sourceMappingURL=justification.repository.js.map