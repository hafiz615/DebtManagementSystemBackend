import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {PipelineStatusRepository} from '../repository/pipelineStatus/pipelineStatus.repository';
import {IPipelineStatus} from '../../database/interfaces/pipelineStatus.interface';
import {PipelineStatus} from '../../database/repomodels/pipelineStatus.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';
import {capitalize} from 'lodash';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';

class PipelineStatusService {
  private pipelineStatusRepository: PipelineStatusRepository;
  private caseRepository: CaseRepository;
  constructor() {
    this.pipelineStatusRepository = new PipelineStatusRepository();
    this.caseRepository = new CaseRepository();
  }
  async createPipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    const reqTemp: any = req;
    const newPipeline = new PipelineStatus();
    req.body.userId = reqTemp.id;
    req.body.pipeline = capitalize(req.body.pipeline);
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
      await this.pipelineStatusRepository.getAllWithoutPagination<IPipelineStatus>(
        {},
        undefined,
        undefined,
        {_id: -1}
      );
    if (!result.length) {
      return [false, constantsUtil.notFoundMessage('pipelines')];
    }
    return [true, result];
  }

  async addStatusPipeline(
    req: Request
  ): Promise<[boolean, IPipelineStatus | string]> {
    req.body.name = capitalize(req.body.name);
    const findStatus =
      await this.pipelineStatusRepository.getById<IPipelineStatus>(
        req.params.id,
        {
          status: {$elemMatch: {name: req.body.name}},
        }
      );
    if (findStatus && findStatus.status) {
      return [false, constantsUtil.Messages.STATUS_PIPELINE_EXIST];
    }
    const result =
      await this.pipelineStatusRepository.updateById<IPipelineStatus>(
        req.params.id,
        {$addToSet: {status: req.body}}
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
    req.body.pipeline = capitalize(req.body.pipeline);
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
    req.body.update.name = capitalize(req.body.update.name);
    req.body.original.name = capitalize(req.body.original.name);
    const findStatus =
      await this.pipelineStatusRepository.getById<IPipelineStatus>(
        req.params.id,
        {
          status: {$elemMatch: {name: req.body.update.name}},
        }
      );
    if (findStatus && findStatus.status) {
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
    req.body.original.name = capitalize(req.body.original.name);
    let result = null;
    if (!Object.keys(req.body.update).length) {
      result = await this.deleteStatus(req.params.id, req.body.original);
    } else {
      req.body.update.name = capitalize(req.body.update.name);
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

  async getPipelineDetails(req: Request) {
    const pipeline =
      await this.pipelineStatusRepository.getById<IPipelineStatus>(
        req.params.id
      );
    const cases: ICase[] =
      await this.caseRepository.getAllWithoutPagination<ICase>(
        {isDeleted: false},
        undefined,
        undefined,
        {_id: -1},
        ['debtor', 'creditor']
      );
    if (!pipeline || !cases.length) {
      return [false, constantsUtil.notFoundMessage('pipeline or cases')];
    }
    if (!pipeline.status.length)
      return [false, constantsUtil.notFoundMessage('pipeline statuses')];
    const statusNames = pipeline.status.map(status => status.name);
    const result = {};
    statusNames.forEach(statusName => {
      const matchingCases = cases.filter(
        caseItem => caseItem.status === statusName
      );
      const annualizedValue = matchingCases.reduce(
        (sum, obj) => sum + (obj.totalDebt || 0),
        0
      );
      result[statusName] = {cases: matchingCases, annualizedValue};
    });
    return [true, result];
  }
}

export default PipelineStatusService;
