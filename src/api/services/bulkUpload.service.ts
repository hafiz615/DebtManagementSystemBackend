import {Request} from 'express';
import {BulkUploadRepository} from '../repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../../database/interfaces/bulkUpload.interface';
import constantsUtil from '../../utils/constants.util';
import {CaseRepository} from '../repository/case/case.repository';
import {DebtorRepository} from '../repository/debtor/debtor.repository';

class BulkUploadService {
  private bulkUploadRepository: BulkUploadRepository;
  private caseRepository: CaseRepository;
  private debtorRepository: DebtorRepository;
  constructor() {
    this.bulkUploadRepository = new BulkUploadRepository();
    this.caseRepository = new CaseRepository();
    this.debtorRepository = new DebtorRepository();
  }

  getBulkUploadAnalytics = async (req: Request) => {
    const filter = {};
    let arrayName = '';
    arrayName = String(req.query.array);
    if (arrayName === 'undefined' || !arrayName) arrayName = 'default';
    let failedBulkUploads = [];
    let successBulkUploads = [];
    let pendingBulkUploads = [];
    let arBulkUploads = [];
    let duplicateBulkUploads = [];
    let pendingBulkUploadsCount = 0;
    let failedBulkUploadsCount = 0;
    let successBulkUploadsCount = 0;
    let arBulkUploadsCount = 0;
    let duplicateBulkUploadsCount = 0;
    let page = 1;
    let limit = 5;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    switch (arrayName) {
      case 'default':
        pendingBulkUploads =
          await this.bulkUploadRepository.getAll<IBulkUpload>(
            {status: 'Pending'},
            undefined,
            undefined,
            {_id: -1},
            {path: 'debtor', select: ['basicInformation.fullName']},
            undefined,
            page,
            limit
          );
        pendingBulkUploadsCount =
          await this.bulkUploadRepository.getCount<IBulkUpload>({
            status: 'Pending',
          });
        failedBulkUploads = await this.bulkUploadRepository.getAll<IBulkUpload>(
          {$and: [{retries: {$eq: 2}}, {status: 'Failed'}]},
          undefined,
          undefined,
          {_id: -1},
          {path: 'debtor', select: ['basicInformation.fullName']},
          undefined,
          page,
          limit
        );
        failedBulkUploadsCount =
          await this.bulkUploadRepository.getCount<IBulkUpload>({
            $and: [{retries: {$eq: 2}}, {status: 'Failed'}],
          });
        successBulkUploads =
          await this.bulkUploadRepository.getAll<IBulkUpload>(
            {status: 'Success'},
            undefined,
            undefined,
            {_id: -1},
            {path: 'debtor', select: ['basicInformation.fullName']},
            undefined,
            page,
            limit
          );
        successBulkUploadsCount =
          await this.bulkUploadRepository.getCount<IBulkUpload>({
            status: 'Success',
          });
        arBulkUploads = await this.bulkUploadRepository.getAll<IBulkUpload>(
          {status: 'Action Required'},
          undefined,
          undefined,
          {_id: -1},
          {path: 'debtor', select: ['basicInformation.fullName']},
          undefined,
          page,
          limit
        );
        arBulkUploadsCount =
          await this.bulkUploadRepository.getCount<IBulkUpload>({
            status: 'Action Required',
          });
        duplicateBulkUploads =
          await this.bulkUploadRepository.getAll<IBulkUpload>(
            {status: 'Duplicate'},
            undefined,
            undefined,
            {_id: -1},
            {path: 'debtor', select: ['basicInformation.fullName']},
            undefined,
            page,
            limit
          );
        duplicateBulkUploadsCount =
          await this.bulkUploadRepository.getCount<IBulkUpload>({
            status: 'Duplicate',
          });
        const response = {
          pending: pendingBulkUploads,
          success: successBulkUploads,
          failed: failedBulkUploads,
          actionRequired: arBulkUploads,
          duplicate: duplicateBulkUploads,
          count: {
            pending: pendingBulkUploadsCount,
            success: successBulkUploadsCount,
            failed: failedBulkUploadsCount,
            actionRequired: arBulkUploadsCount,
            duplicate: duplicateBulkUploadsCount,
          },
        };
        return [true, response];
      case 'actionRequired':
        filter['status'] = 'Action Required';
        break;
      case 'pending':
        filter['status'] = 'Pending';
        break;
      case 'failed':
        filter['$and'] = [{retries: {$eq: 2}}, {status: 'Failed'}];
        break;
      case 'success':
        filter['status'] = 'Success';
        break;
      case 'duplicate':
        filter['status'] = 'Duplicate';
    }
    const result = await this.bulkUploadRepository.getAll<IBulkUpload>(
      filter,
      undefined,
      undefined,
      {_id: -1},
      {path: 'debtor', select: ['basicInformation.fullName']},
      undefined,
      page,
      limit
    );
    const count = await this.bulkUploadRepository.getCount<IBulkUpload>(filter);
    const response = {};
    response[`${arrayName}`] = result;
    const countObj = {};
    countObj[`${arrayName}`] = count;
    response['count'] = countObj;
    return [true, response];
  };

  async getBulkCasesDetails(req: Request) {
    const bulk = await this.bulkUploadRepository.getById<IBulkUpload>(
      req.params.id
    );
    if (!bulk) return [false, constantsUtil.notFoundMessage('data')];
    const cases =
      await this.caseRepository.getAllWithoutPagination<IBulkUpload>(
        {
          _id: bulk.caseIds,
        },
        'totalDebt lastPaymentDate paidAmount status contractDetails feePayment remaining debtor',
        undefined,
        {_id: -1},
        ['creditor']
      );
    const debtor = await this.debtorRepository.getById(String(bulk.debtor));
    if (!debtor) return [false, constantsUtil.notFoundMessage('debtor')];
    if (!cases.length) return [false, constantsUtil.notFoundMessage('cases')];
    return [true, {cases, debtor}];
  }
}

export default BulkUploadService;
