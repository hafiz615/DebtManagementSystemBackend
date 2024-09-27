"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkUploadRepository = void 0;
const bulkUpload_model_1 = require("../../../database/models/bulkUpload.model");
const base_repository_1 = require("../base.repository");
class BulkUploadRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(bulkUpload_model_1.BulkUpload);
    }
}
exports.BulkUploadRepository = BulkUploadRepository;
//# sourceMappingURL=bulkUpload.repository.js.map