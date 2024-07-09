import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {StatusRepository} from '../repository/status/status.repository';
import {IStatus} from '../../database/interfaces/status.interface';
import {Status} from '../../database/repomodels/status.repomodel';
import {capitalize} from 'lodash';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';

class StatusService {
  private statusRepository: StatusRepository;
  private caseRepository: CaseRepository;
  constructor() {
    this.statusRepository = new StatusRepository();
    this.caseRepository = new CaseRepository();
  }

  async getCaseStatuses(req: Request): Promise<[boolean, IStatus | string]> {
    const result =
      await this.statusRepository.getAllWithoutPagination<IStatus>();
    if (!result.length) {
      return [false, constantsUtil.notFoundMessage('statuses')];
    }
    return [true, result[0]];
  }

  async addStatus(req: Request): Promise<[boolean, IStatus | string]> {
    const capitalizeStatus = capitalize(req.body.status);
    const getAllStatuses =
      await this.statusRepository.getAllWithoutPagination<IStatus>();
    if (!getAllStatuses.length) {
      const status = new Status();
      status.status = [capitalizeStatus];
      const createStatus = await this.statusRepository.create<IStatus>(
        status as any
      );
      return [true, createStatus];
    }
    const statusFind = getAllStatuses[0];
    const duplicateStatus = await this.statusRepository.getOne<IStatus>({
      _id: statusFind._id,
      status: {$in: capitalizeStatus},
    });
    if (duplicateStatus && duplicateStatus.status) {
      return [false, constantsUtil.Messages.STATUS_CASE_EXIST];
    }
    const result = await this.statusRepository.updateById<IStatus>(
      statusFind._id,
      {$addToSet: {status: capitalizeStatus}}
    );
    if (!result) {
      return [false, constantsUtil.notFoundMessage('status')];
    }
    return [true, result];
  }

  async getStatusesById(req: Request): Promise<[boolean, IStatus | string]> {
    const result = await this.statusRepository.getById<IStatus>(req.params.id);
    if (!result) {
      return [false, constantsUtil.notFoundMessage('statuses')];
    }
    return [true, result];
  }

  async updateStatus(req: Request): Promise<[boolean, IStatus | string]> {
    const updateStatusCap = capitalize(req.body.update);
    const originalStatusCap = capitalize(req.body.original);
    const findStatus = await this.statusRepository.getOne<IStatus>({
      _id: req.params.id,
      status: {$in: updateStatusCap},
    });
    if (findStatus && findStatus.status) {
      return [false, constantsUtil.Messages.STATUS_CASE_EXIST];
    }
    const result = await this.statusRepository.updateByOne<IStatus>(
      {
        _id: req.params.id,
        status: {$in: originalStatusCap},
      },
      {$set: {'status.$': updateStatusCap}}
    );
    if (!result) {
      return [false, constantsUtil.failureUpdateMessage('status')];
    }
    return [true, result];
  }

  async updateStatusArray(req: Request): Promise<[boolean, IStatus | string]> {
    const result = await this.statusRepository.updateById<IStatus>(
      req.params.id,
      {
        status: req.body.status,
      }
    );
    if (!result) {
      return [false, constantsUtil.failureUpdateMessage('status')];
    }
    return [true, result];
  }

  async deleteStatus(req: Request): Promise<[boolean, IStatus | string]> {
    const originalStatusCap = capitalize(req.body.original);
    const updateStatusCap = capitalize(req.body.update);
    const findStatus = await this.statusRepository.getById<IStatus>(
      req.params.id
    );
    if (!findStatus) {
      return [false, constantsUtil.notFoundMessage('statuses')];
    }
    const statusArr = findStatus.status;
    const originalIndex = statusArr.findIndex(
      item => item === originalStatusCap
    );
    const updateIndex = statusArr.findIndex(item => item === updateStatusCap);
    statusArr[originalIndex] = updateStatusCap;
    statusArr.splice(updateIndex, 1);
    const result = await this.statusRepository.updateById<IStatus>(
      req.params.id,
      {
        status: statusArr,
      }
    );
    if (!result) {
      return [false, constantsUtil.failureDeleteMessage('status')];
    }
    await this.caseRepository.updateMany<ICase>(
      {status: req.body.original, isDeleted: false},
      {status: req.body.update}
    );
    return [true, result];
  }
}

export default StatusService;
