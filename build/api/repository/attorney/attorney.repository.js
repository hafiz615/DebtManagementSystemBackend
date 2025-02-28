"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttorneyRepository = void 0;
const attorney_model_1 = require("../../../database/models/attorney.model");
const base_repository_1 = require("../base.repository");
class AttorneyRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(attorney_model_1.Attorney);
    }
}
exports.AttorneyRepository = AttorneyRepository;
//# sourceMappingURL=attorney.repository.js.map