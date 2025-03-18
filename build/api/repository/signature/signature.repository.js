"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureRepository = void 0;
const signature_model_1 = require("../../../database/models/signature.model");
const base_repository_1 = require("../base.repository");
class SignatureRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(signature_model_1.Signature);
    }
}
exports.SignatureRepository = SignatureRepository;
//# sourceMappingURL=signature.repository.js.map