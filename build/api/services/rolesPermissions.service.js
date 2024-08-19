"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const dataCopier_util_1 = require("../../utils/dataCopier.util");
const rolesPermissions_repository_1 = require("../repository/rolesPermissions/rolesPermissions.repository");
const rolesPermissions_repomodel_1 = require("../../database/repomodels/rolesPermissions.repomodel");
const user_repository_1 = require("../repository/user/user.repository");
const common_util_1 = __importDefault(require("../../utils/common.util"));
class RolesPermissionsService {
    constructor() {
        this.rolesPermissionsRepository = new rolesPermissions_repository_1.RolesPermissionsRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    async createRole(req) {
        const findRole = await this.rolesPermissionsRepository.getOne({
            name: req.body.name,
            isDeleted: false,
        });
        console.log(findRole);
        if (findRole) {
            return [false, constants_util_1.default.alreadyExistsMessage('Role')];
        }
        const reqTemp = req;
        const newRole = new rolesPermissions_repomodel_1.RolesPermissions();
        newRole.createdBy = reqTemp.id;
        const validatedRole = dataCopier_util_1.DataCopier.copy(newRole, req.body);
        const result = await this.rolesPermissionsRepository.create(validatedRole);
        if (!result) {
            return [false, constants_util_1.default.failureAddMessage('role')];
        }
        return [true, result];
    }
    async getAllRoles(req) {
        const filter = { isDeleted: false };
        const checkPermission = await common_util_1.default.checkPermission('createAdminUser', req);
        if (req.query.usersPage && req.query.usersPage === 'true') {
            if (checkPermission) {
                filter['name'] = { $nin: ['Super User', 'Admin'] };
            }
            filter['name'] = { $nin: ['Super User'] };
        }
        const result = await this.rolesPermissionsRepository.getAllWithoutPagination(filter);
        if (!result.length) {
            return [false, constants_util_1.default.notFoundMessage('roles')];
        }
        return [true, result];
    }
    async getRoleById(req) {
        const result = await this.rolesPermissionsRepository.getById(req.params.id);
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('role')];
        }
        return [true, result];
    }
    async getRoleByName(req) {
        if (!String(req.query.role)) {
            return [false, 'Role name is missing'];
        }
        const role = String(req.query.role);
        const result = await this.getRole(role);
        if (!result) {
            return [false, constants_util_1.default.notFoundMessage('role')];
        }
        return [true, result];
    }
    async getRole(name) {
        const result = await this.rolesPermissionsRepository.getOne({
            name: name,
        });
        return result;
    }
    async updateRole(req) {
        const findRole = await this.rolesPermissionsRepository.getOne({
            _id: { $ne: req.params.id },
            name: req.body.name,
            isDeleted: false,
        });
        if (findRole) {
            return [false, constants_util_1.default.alreadyExistsMessage('Role')];
        }
        const role = await this.rolesPermissionsRepository.getById(req.params.id);
        if (role.name === 'Super User') {
            return [false, 'Super User role cannot be updated'];
        }
        let reqTemp = req;
        if (role.name === 'Admin' && reqTemp.role !== 'Super User') {
            return [false, 'Only a super user can update an admin role'];
        }
        const result = await this.rolesPermissionsRepository.updateById(req.params.id, req.body);
        if (!result) {
            return [false, constants_util_1.default.failureUpdateMessage('role')];
        }
        return [true, result];
    }
    async deleteRole(req) {
        const role = await this.rolesPermissionsRepository.getById(req.params.id);
        if (!role) {
            return [false, constants_util_1.default.notFoundMessage('role')];
        }
        if (role.name === 'Super User') {
            return [false, 'Super User role cannot be deleted'];
        }
        let reqTemp = req;
        if (role.name === 'Admin' && reqTemp.role !== 'Super User') {
            return [false, 'Only a super user can delete an admin role.'];
        }
        const findUserRole = await this.userRepository.getOne({
            role: role.name,
        });
        if (findUserRole) {
            return [
                false,
                'The role is currently assigned to users and cannot be deleted. Please unassign the role from all users before deleting',
            ];
        }
        const result = await this.rolesPermissionsRepository.updateById(req.params.id, { isDeleted: true });
        if (!result) {
            return [false, constants_util_1.default.failureDeleteMessage('role')];
        }
        return [true, result];
    }
}
exports.default = RolesPermissionsService;
//# sourceMappingURL=rolesPermissions.service.js.map