"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterfallRepository = void 0;
const waterfall_model_1 = require("../../../database/models/waterfall.model");
const base_repository_1 = require("../base.repository");
class WaterfallRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(waterfall_model_1.Waterfall);
    }
}
exports.WaterfallRepository = WaterfallRepository;
//# sourceMappingURL=waterfall.repository.js.map