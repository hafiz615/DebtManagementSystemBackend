"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesPermissionsRepository = void 0;
const rolesPermissions_model_1 = require("../../../database/models/rolesPermissions.model");
const base_repository_1 = require("../base.repository");
class RolesPermissionsRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(rolesPermissions_model_1.RolesPermissions);
    }
}
exports.RolesPermissionsRepository = RolesPermissionsRepository;
//# sourceMappingURL=rolesPermissions.repository.js.map