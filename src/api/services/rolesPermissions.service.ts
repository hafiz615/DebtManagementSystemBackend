import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {DataCopier} from '../../utils/dataCopier.util';
import {RolesPermissionsRepository} from '../repository/rolesPermissions/rolesPermissions.repository';
import {RolesPermissions} from '../../database/repomodels/rolesPermissions.repomodel';
import {IRolesPermissions} from '../../database/interfaces/rolesPermissions.interface';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';
import commonUtil from '../../utils/common.util';

class RolesPermissionsService {
  private rolesPermissionsRepository: RolesPermissionsRepository;
  private userRepository: UserRepository;
  constructor() {
    this.rolesPermissionsRepository = new RolesPermissionsRepository();
    this.userRepository = new UserRepository();
  }
  async createRole(
    req: Request
  ): Promise<[boolean, IRolesPermissions | string]> {
    const findRole =
      await this.rolesPermissionsRepository.getOne<IRolesPermissions>({
        name: req.body.name,
        isDeleted: false,
      });
    if (findRole) {
      return [false, constantsUtil.alreadyExistsMessage('Role')];
    }
    const reqTemp: any = req;
    const newRole = new RolesPermissions();
    newRole.createdBy = reqTemp.id;
    const validatedRole = DataCopier.copy(newRole, req.body);
    const result =
      await this.rolesPermissionsRepository.create<IRolesPermissions>(
        validatedRole
      );
    if (!result) {
      return [false, constantsUtil.failureAddMessage('role')];
    }
    return [true, result];
  }

  async getAllRoles(
    req: Request
  ): Promise<[boolean, IRolesPermissions[] | string]> {
    const filter = {isDeleted: false};
    const checkPermission = await commonUtil.checkPermission(
      'createAdminUser',
      req
    );
    if (req.query.usersPage && req.query.usersPage === 'true') {
      if (!checkPermission) {
        filter['name'] = {$nin: ['Super User', 'Admin']};
      } else {
        filter['name'] = {$nin: ['Super User']};
      }
    }
    const result =
      await this.rolesPermissionsRepository.getAllWithoutPagination<IRolesPermissions>(
        filter,
        undefined,
        undefined,
        {_id: -1}
      );
    if (!result.length) {
      return [false, constantsUtil.notFoundMessage('roles')];
    }
    return [true, result];
  }

  async getRoleById(
    req: Request
  ): Promise<[boolean, IRolesPermissions | string]> {
    const result =
      await this.rolesPermissionsRepository.getById<IRolesPermissions>(
        req.params.id
      );
    if (!result) {
      return [false, constantsUtil.notFoundMessage('role')];
    }
    return [true, result];
  }

  async getRoleByName(
    req: Request
  ): Promise<[boolean, IRolesPermissions | string]> {
    if (!String(req.query.role)) {
      return [false, 'Role name is missing'];
    }
    const role = String(req.query.role);
    const result = await this.getRole(role);
    if (!result) {
      return [false, constantsUtil.notFoundMessage('role')];
    }
    return [true, result];
  }
  async getRole(name: string) {
    const result =
      await this.rolesPermissionsRepository.getOne<IRolesPermissions>({
        name: name,
      });
    return result;
  }
  async updateRole(
    req: Request
  ): Promise<[boolean, IRolesPermissions | string]> {
    const findRole =
      await this.rolesPermissionsRepository.getOne<IRolesPermissions>({
        _id: {$ne: req.params.id},
        name: req.body.name,
        isDeleted: false,
      });
    if (findRole) {
      return [false, constantsUtil.alreadyExistsMessage('Role')];
    }
    const role =
      await this.rolesPermissionsRepository.getById<IRolesPermissions>(
        req.params.id
      );
    if (role.name === 'Super User') {
      return [false, 'Super User role cannot be updated'];
    }
    let reqTemp: any = req;
    if (role.name === 'Admin' && reqTemp.role !== 'Super User') {
      return [false, 'Only a super user can update an admin role'];
    }
    const result =
      await this.rolesPermissionsRepository.updateById<IRolesPermissions>(
        req.params.id,
        req.body
      );
    if (!result) {
      return [false, constantsUtil.failureUpdateMessage('role')];
    }
    return [true, result];
  }
  async deleteRole(
    req: Request
  ): Promise<[boolean, IRolesPermissions | string]> {
    const role =
      await this.rolesPermissionsRepository.getById<IRolesPermissions>(
        req.params.id
      );
    if (!role) {
      return [false, constantsUtil.notFoundMessage('role')];
    }
    if (role.name === 'Super User') {
      return [false, 'Super User role cannot be deleted'];
    }
    let reqTemp: any = req;
    if (role.name === 'Admin' && reqTemp.role !== 'Super User') {
      return [false, 'Only a super user can delete an admin role.'];
    }
    const findUserRole = await this.userRepository.getOne<IUser>({
      role: role.name,
    });
    if (findUserRole) {
      return [
        false,
        'The role is currently assigned to users and cannot be deleted. Please unassign the role from all users before deleting',
      ];
    }
    const result =
      await this.rolesPermissionsRepository.updateById<IRolesPermissions>(
        req.params.id,
        {isDeleted: true}
      );
    if (!result) {
      return [false, constantsUtil.failureDeleteMessage('role')];
    }
    return [true, result];
  }
}

export default RolesPermissionsService;
