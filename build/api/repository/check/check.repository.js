"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckRepository = void 0;
const check_model_1 = require("../../../database/models/check.model");
const base_repository_1 = require("../base.repository");
class CheckRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(check_model_1.Check);
    }
}
exports.CheckRepository = CheckRepository;
//# sourceMappingURL=check.repository.js.map