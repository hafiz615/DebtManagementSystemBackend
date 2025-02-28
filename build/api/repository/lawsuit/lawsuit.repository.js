"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawsuitRepository = void 0;
const lawsuit_model_1 = require("../../../database/models/lawsuit.model");
const base_repository_1 = require("../base.repository");
class LawsuitRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(lawsuit_model_1.Lawsuit);
    }
}
exports.LawsuitRepository = LawsuitRepository;
//# sourceMappingURL=lawsuit.repository.js.map