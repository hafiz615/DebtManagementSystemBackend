import {IRolesPermissions} from '../../../database/interfaces/rolesPermissions.interface';
import {IUser} from '../../../database/interfaces/user.interface';
import {RolesPermissions} from '../../../database/models/rolesPermissions.model';
import {User} from '../../../database/models/user.model';
import {BaseRepository} from '../base.repository';
import {IRolesPermissionRepository} from './rolesPermissions.repository.interface';

export class RolesPermissionsRepository
  extends BaseRepository<IRolesPermissions>
  implements IRolesPermissionRepository
{
  constructor() {
    super(RolesPermissions);
  }
}
