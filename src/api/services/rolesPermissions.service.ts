import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {DataCopier} from '../../utils/dataCopier.util';
import {RolesPermissionsRepository} from '../repository/rolesPermissions/rolesPermissions.repository';
import {RolesPermissions} from '../../database/repomodels/rolesPermissions.repomodel';
import {IRolesPermissions} from '../../database/interfaces/rolesPermissions.interface';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';

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
      });
    console.log(findRole);
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
    const result =
      await this.rolesPermissionsRepository.getAllWithoutPagination<IRolesPermissions>();
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
  async updateRole(
    req: Request
  ): Promise<[boolean, IRolesPermissions | string]> {
    const findRole =
      await this.rolesPermissionsRepository.getOne<IRolesPermissions>({
        _id: {$ne: req.params.id},
        name: req.body.name,
      });
    if (findRole) {
      return [false, constantsUtil.alreadyExistsMessage('Role')];
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
  async deleteRole(req: Request): Promise<[boolean, boolean | string]> {
    const role =
      await this.rolesPermissionsRepository.getById<IRolesPermissions>(
        req.params.id
      );
    if (!role) {
      return [false, constantsUtil.notFoundMessage('role')];
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
      await this.rolesPermissionsRepository.delete<IRolesPermissions>({
        _id: req.params.id,
      });
    if (!result) {
      return [false, constantsUtil.failureDeleteMessage('role')];
    }
    return [true, result];
  }
}

export default RolesPermissionsService;
