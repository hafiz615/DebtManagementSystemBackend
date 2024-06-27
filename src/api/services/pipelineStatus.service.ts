import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {PipelineStatusRepository} from '../repository/pipelineStatus/pipelineStatus.repository';
import {IPipelineStatus} from '../../database/interfaces/pipelineStatus.interface';
import {PipelineStatus} from '../../database/repomodels/pipelineStatus.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';

class PipelineStatusService {
  private pipelineStatusRepository: PipelineStatusRepository;
  constructor() {
    this.pipelineStatusRepository = new PipelineStatusRepository();
  }
  async createPipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    const reqTemp: any = req;
    const newPipeline = new PipelineStatus();
    newPipeline.userId = reqTemp.id;
    const validatedPipeline = DataCopier.copy(newPipeline, req.body);
    const result =
      await this.pipelineStatusRepository.create<IPipelineStatus>(
        validatedPipeline
      );
    if (!result) {
      return [false, constantsUtil.failureAddMessage('pipeline')];
    }
    return [true, result];
  }

  async getAllPipelines(
    req: Request
  ): Promise<[boolean, IPipelineStatus[] | string]> {
    const result =
      await this.pipelineStatusRepository.getAllWithoutPagination<IPipelineStatus>();
    if (!result.length) {
      return [false, constantsUtil.notFoundMessage('pipelines')];
    }
    return [true, result];
  }

  async addStatusPipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    const {name, type} = req.body.status;
    if (!name || !type) {
      return [false, 'Body is invalid'];
    }
    const findStatus =
      await this.pipelineStatusRepository.getById<IPipelineStatus>(
        req.params.id,
        {
          status: {$elemMatch: {name: name}},
        }
      );
    if (findStatus.status) {
      return [false, constantsUtil.Messages.STATUS_PIPELINE_EXIST];
    }
    const result =
      await this.pipelineStatusRepository.updateById<IPipelineStatus>(
        req.params.id,
        {$addToSet: {status: req.body.status}}
      );
    if (!result) {
      return [false, constantsUtil.notFoundMessage('pipeline')];
    }
    return [true, result];
  }
  async getPipelineById(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    const result = await this.pipelineStatusRepository.getById<IPipelineStatus>(
      req.params.id
    );
    if (!result) {
      return [false, constantsUtil.notFoundMessage('pipeline')];
    }
    return [true, result];
  }
  async updatePipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    delete req.body.status;
    const result =
      await this.pipelineStatusRepository.updateById<IPipelineStatus>(
        req.params.id,
        req.body
      );
    if (!result) {
      return [false, constantsUtil.failureUpdateMessage('pipeline')];
    }
    return [true, result];
  }

  async deletePipeline(req: Request): Promise<[boolean, boolean | string]> {
    const getPipeline =
      await this.pipelineStatusRepository.getById<IPipelineStatus>(
        req.params.id
      );
    if (!getPipeline) {
      return [false, constantsUtil.notFoundMessage('pipeline')];
    }
    if (getPipeline.status.length) {
      return [false, constantsUtil.Messages.PIPELINE_DELETE_STATUS_ERROR];
    }
    const result = await this.pipelineStatusRepository.delete<IPipelineStatus>({
      _id: req.params.id,
    });
    if (!result) {
      return [false, constantsUtil.failureDeleteMessage('pipeline')];
    }
    return [true, result];
  }

  async updateStatusPipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    const {name, type} = req.body.update;
    const findStatus =
      await this.pipelineStatusRepository.getById<IPipelineStatus>(
        req.params.id,
        {
          status: {$elemMatch: {name: name}},
        }
      );
    if (findStatus.status) {
      return [false, constantsUtil.Messages.STATUS_PIPELINE_EXIST];
    }
    const result =
      await this.pipelineStatusRepository.updateByOne<IPipelineStatus>(
        {
          _id: req.params.id,
          status: {$elemMatch: {name: req.body.original.name}},
        },
        {$set: {'status.$': req.body.update}}
      );
    if (!result) {
      return [false, constantsUtil.failureUpdateMessage('pipeline')];
    }
    return [true, result];
  }

  async deleteStatusPipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    let result = null;
    if (!Object.keys(req.body.update).length) {
      result = await this.deleteStatus(req.params.id, req.body.original);
    } else {
      const pipeline =
        await this.pipelineStatusRepository.getById<IPipelineStatus>(
          req.params.id
        );
      if (!pipeline) {
        return [false, constantsUtil.notFoundMessage('pipeline')];
      }
      const statusArr = pipeline.status;
      const originalIndex = statusArr.findIndex(
        item => item.name === req.body.original.name
      );
      const updateIndex = statusArr.findIndex(
        item => item.name === req.body.update.name
      );
      statusArr[originalIndex] = req.body.update;
      statusArr.splice(updateIndex, 1);
      // result = await this.deleteStatus(req.params.id, req.body.original);
      result = await this.pipelineStatusRepository.updateById<IPipelineStatus>(
        req.params.id,
        {status: statusArr}
      );
    }
    if (!result) {
      return [false, constantsUtil.failureDeleteMessage('status')];
    }
    return [true, result];
  }

  private async deleteStatus(id: string, original: any) {
    return await this.pipelineStatusRepository.updateById<IPipelineStatus>(id, {
      $pull: {status: original},
    });
  }
}

export default PipelineStatusService;
