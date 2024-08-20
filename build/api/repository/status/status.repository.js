"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusRepository = void 0;
const status_model_1 = require("../../../database/models/status.model");
const base_repository_1 = require("../base.repository");
class StatusRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(status_model_1.Status);
    }
}
exports.StatusRepository = StatusRepository;
//# sourceMappingURL=status.repository.js.map