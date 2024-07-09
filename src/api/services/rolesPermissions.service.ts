import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {PipelineStatusRepository} from '../repository/pipelineStatus/pipelineStatus.repository';
import {IPipelineStatus} from '../../database/interfaces/pipelineStatus.interface';
import {PipelineStatus} from '../../database/repomodels/pipelineStatus.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';
import {capitalize} from 'lodash';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import {RolesPermissionsRepository} from '../repository/rolesPermissions/rolesPermissions.repository';

class RolesPermissionsService {
  private rolesPermissionsRepository: RolesPermissionsRepository;
  constructor() {
    this.rolesPermissionsRepository = new RolesPermissionsRepository();
  }
  async createRole(req: Request): Promise<[boolean, IPipelineStatus | string]> {
    const reqTemp: any = req;
    const newPipeline = new PipelineStatus();
    req.body.userId = reqTemp.id;
    req.body.pipeline = capitalize(req.body.pipeline);
    const validatedPipeline = DataCopier.copy(newPipeline, req.body);
    const result =
      await this.rolesPermissionsRepository.create<IPipelineStatus>(
        validatedPipeline
      );
    if (!result) {
      return [false, constantsUtil.failureAddMessage('pipeline')];
    }
    return [true, result];
  }

  async getAllRoles(
    req: Request
  ): Promise<[boolean, IPipelineStatus[] | string]> {
    const result =
      await this.rolesPermissionsRepository.getAllWithoutPagination<IPipelineStatus>();
    if (!result.length) {
      return [false, constantsUtil.notFoundMessage('pipelines')];
    }
    return [true, result];
  }

  async getRoleById(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    const result =
      await this.rolesPermissionsRepository.getById<IPipelineStatus>(
        req.params.id
      );
    if (!result) {
      return [false, constantsUtil.notFoundMessage('pipeline')];
    }
    return [true, result];
  }
  async updateRole(req: Request): Promise<[boolean, IPipelineStatus | string]> {
    req.body.pipeline = capitalize(req.body.pipeline);
    const result =
      await this.rolesPermissionsRepository.updateById<IPipelineStatus>(
        req.params.id,
        req.body
      );
    if (!result) {
      return [false, constantsUtil.failureUpdateMessage('pipeline')];
    }
    return [true, result];
  }
}

export default RolesPermissionsService;
