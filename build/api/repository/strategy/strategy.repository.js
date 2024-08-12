"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyRepository = void 0;
const strategy_model_1 = require("../../../database/models/strategy.model");
const base_repository_1 = require("../base.repository");
class StrategyRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(strategy_model_1.Strategy);
    }
}
exports.StrategyRepository = StrategyRepository;
//# sourceMappingURL=strategy.repository.js.map