"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRepository = void 0;
const call_model_1 = require("../../../database/models/call.model");
const base_repository_1 = require("../base.repository");
class CallRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(call_model_1.Call);
    }
}
exports.CallRepository = CallRepository;
//# sourceMappingURL=call.repository.js.map