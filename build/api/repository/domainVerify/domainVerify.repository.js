"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainVerifyRepository = void 0;
const domainVerify_model_1 = require("../../../database/models/domainVerify.model");
const base_repository_1 = require("../base.repository");
class DomainVerifyRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(domainVerify_model_1.DomainVerifyLink);
    }
}
exports.DomainVerifyRepository = DomainVerifyRepository;
//# sourceMappingURL=domainVerify.repository.js.map