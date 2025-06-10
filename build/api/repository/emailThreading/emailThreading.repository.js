"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailThreadingRepository = void 0;
const emailThreading_model_1 = require("../../../database/models/emailThreading.model");
const base_repository_1 = require("../base.repository");
class EmailThreadingRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(emailThreading_model_1.EmailThreading);
    }
}
exports.EmailThreadingRepository = EmailThreadingRepository;
//# sourceMappingURL=emailThreading.repository.js.map