"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStatusRepository = void 0;
const pipelineStatus_model_1 = require("../../../database/models/pipelineStatus.model");
const base_repository_1 = require("../base.repository");
class PipelineStatusRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(pipelineStatus_model_1.PipelineStatus);
    }
}
exports.PipelineStatusRepository = PipelineStatusRepository;
//# sourceMappingURL=pipelineStatus.repository.js.map