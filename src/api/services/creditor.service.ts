import constants from '../../utils/constants.util';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import {Request} from 'express';
import {CaseRepository} from '../repository/case/case.repository';
import caseUtil from '../../utils/case.util';
import {ICase} from '../../database/interfaces/case.interface';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstanceInterceptor';
import commonUtil from '../../utils/common.util';
import {BulkUploadRepository} from '../repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../../database/interfaces/bulkUpload.interface';
import {BulkUpload} from '../../database/repomodels/bulkUpload.repomodel';
import paynoteUtil from '../../utils/paynote.util';
import dotenv from 'dotenv';
import {SyncPaymentMethodRepository} from '../repository/ISyncPaymentMethod/syncPaymentMethod.repository';
import {ISyncPaymentMethod} from '../../database/interfaces/syncPaymentMethod.interface';
import debtorUtil from '../../utils/debtor.util';
import creditorUtil from '../../utils/creditor.util';
import {LawsuitRepository} from '../repository/lawsuit/lawsuit.repository';
import {ILawsuit} from '../../database/interfaces/lawsuit.interface';
dotenv.config();

class CreditorService {
  private creditorRepository: CreditorRepository;
  private caseRepository: CaseRepository;
  private bulkUploadRepository: BulkUploadRepository;
  private syncPaymentMethodRepository: SyncPaymentMethodRepository;
  private lawsuitRepository: LawsuitRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.lawsuitRepository = new LawsuitRepository();
    this.caseRepository = new CaseRepository();
    this.bulkUploadRepository = new BulkUploadRepository();
    this.syncPaymentMethodRepository = new SyncPaymentMethodRepository();
  }

  async getCreditor(text: string): Promise<[boolean, ICreditor[] | string]> {
    const creditor = await this.creditorRepository.getAll<ICreditor>(
      {
        $or: [
          {
            'basicInformation.email': {
              $regex: new RegExp(text, 'i'), // Case-insensitive match for email
            },
          },
          {
            'basicInformation.fullName': {
              $regex: new RegExp(text, 'i'), // Case-insensitive match for email
            },
          },
          {
            'basicInformation.phone': {
              $regex: new RegExp(text),
            },
          },
          {
            'businessInformation.companyName': {
              $regex: new RegExp(text, 'i'),
            },
          },
        ],
      },
      undefined,
      undefined,
      {_id: -1}
    );
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }
  async updateCreditor(req: Request): Promise<[boolean, ICreditor | string]> {
    let creditor = null;
    const getCreditor = await this.creditorRepository.getById<ICreditor>(
      req.params.id
    );
    if (!getCreditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    if (req.body.businessInformation) {
      const alreadyPresent = await this.creditorRepository.getOne<ICreditor>({
        _id: {$ne: req.params.id},
        'businessInformation.companyName':
          req.body.businessInformation.companyName,
      });
      if (alreadyPresent) {
        return [
          false,
          constants.alreadyExistsMessage(
            `Creditor with companyName ${req.body.businessInformation.companyName}`
          ),
        ];
      }
      req.body.updatedAt = commonUtil.getCurrentDate();
      creditor = await this.creditorRepository.updateById<ICreditor>(
        req.params.id,
        req.body
      );
    }
    if (req.body.contact && req.query.contact === 'add') {
      creditor = await this.creditorRepository.updateById<ICreditor>(
        req.params.id,
        {
          $push: {contacts: req.body.contact},
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
    }
    if (req.body.contact && req.query.contact === 'edit') {
      creditor = await this.creditorRepository.updateByOne<ICreditor>(
        {
          _id: req.params.id,
          contacts: {$elemMatch: {_id: req.body.contact._id}},
        },
        {
          $set: {'contacts.$': req.body.contact},
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
    }
    // if (req.body.paymentToken && req.body.paymentType) {
    //   const customerVaultResponse = await caseUtil.createVault(
    //     req.body.paymentToken
    //   );
    //   if (!customerVaultResponse[0]) return customerVaultResponse;
    //   creditor = await this.creditorRepository.updateById<ICreditor>(
    //     req.params.id,
    //     {customerVaultId: customerVaultResponse[1]}
    //   );
    // }

    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }

  async listingDetails(req: Request) {
    let casesCount = 0;
    let page = 1;
    let limit = 5;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    let clientDetails = await caseUtil.getCreditorDetails(req);
    // if (req.query.filter === 'true' || req.query.search === 'true') {
    //   casesCount = clientDetails.caseHistory.length;
    // } else {
    //   casesCount = await this.caseRepository.getCount<ICase>({
    //     creditor: req.params.id,
    //     isDeleted: false,
    //   });
    // }
    casesCount = clientDetails.caseHistory.length;
    clientDetails.caseHistory = clientDetails.caseHistory.slice(
      (page - 1) * limit,
      page * limit
    );
    if (!clientDetails) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, {...clientDetails, creditorTotalCases: casesCount}];
  }

  async listing(req: Request, keyword: string) {
    let creditorsCount: number = 0;
    let page = 1;
    let limit = 10;
    let reqTemp: any = req;
    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    let match = {isDeleted: {$ne: true}};
    let countFilter = {};
    if (keyword === 'viewCreditorsForSelf') {
      match['$or'] = [
        {caseOwnerId: reqTemp.id},
        {negotiatorId: reqTemp.id},
        {managerId: reqTemp.id},
      ];
      countFilter['$or'] = [
        {caseOwnerId: reqTemp.id},
        {negotiatorId: reqTemp.id},
        {managerId: reqTemp.id},
      ];
    }
    const pipeline: any = await caseUtil.getCreditorListingPipeline(req, match);
    const clientDetails: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    creditorsCount = clientDetails.length;
    // if (req.query.filter === 'true' || req.query.search === 'true') {
    //   creditorsCount = clientDetails.length;
    // } else {
    //   if (keyword === 'viewCreditorsForSelf') {
    //     const cases =
    //       await this.caseRepository.getAllWithoutPagination<ICase>(countFilter);
    //     const setCount = new Set<string>();
    //     for (const caseTemp of cases) {
    //       setCount.add(String(caseTemp.creditor));
    //     }
    //     creditorsCount = setCount.size;
    //   } else {
    //     creditorsCount = await this.creditorRepository.getCount<ICreditor>();
    //   }
    // }
    const paginatedDetails = clientDetails.slice(
      (page - 1) * limit,
      page * limit
    );
    return [
      true,
      {clientDetails: paginatedDetails, creditorsCount: creditorsCount},
    ];
  }

  async updateCreditorAccountTitle(
    req: Request
  ): Promise<[boolean, ICreditor | string]> {
    const title = String(req.query.title);
    if (!title) return [false, 'Title is missing'];
    const creditor = await this.creditorRepository.updateById<ICreditor>(
      req.params.id,
      {accountTitle: title, updatedAt: commonUtil.getCurrentDate()}
    );
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }

  async createVault(paymentToken: string, id: string, paymentType: string) {
    const url = process.env.seamlesschexMerchantUrl;
    const params = {
      customer_vault: 'add_customer',
      security_key: process.env.seamlesschexMerchantSecurityKey,
      payment_token: paymentToken,
    };
    const response = await axiosInstance.get(url, {params});
    const responseNum = new URLSearchParams(response.data).get('response');
    if (responseNum === '1') {
      const customerVault = new URLSearchParams(response.data).get(
        'customer_vault_id'
      );
      const creditor = await this.creditorRepository.updateById<ICreditor>(id, {
        customerVaultId: customerVault,
        paymentType: paymentType,
        updatedAt: commonUtil.getCurrentDate(),
      });
      return [true, creditor];
    }
    return [false, 'Unable to create customer vault'];
  }

  async updateMultipleCreditors(req: Request) {
    const cases = req.body.cases;
    const result = [];
    const createCases = [];
    for (const tempCase of cases) {
      if (!tempCase?.creditor?._id) {
        createCases.push(tempCase);
        continue;
      }
      tempCase.creditor.updatedAt = commonUtil.getCurrentDate();
      const updatedCreditor =
        await this.creditorRepository.updateById<ICreditor>(
          tempCase.creditor._id,
          tempCase.creditor
        );
      delete tempCase.creditor;
      let caseUpdated = await this.caseRepository.updateById<ICase>(
        tempCase._id,
        tempCase
      );
      if (updatedCreditor && caseUpdated) result.push(true);
    }
    if (createCases.length) {
      const reqTemp: any = req;
      caseUtil.createCreditorsCasesFromExtraction(
        createCases,
        reqTemp.name,
        reqTemp.id,
        req.params.id
      );
    }
    if (!result.length && !createCases.length)
      return [false, constants.failureUpdateMessage('cases and creditors')];
    const bulkId = String(req.query.bulk);
    if (bulkId !== 'undefined') {
      const bulkDoc =
        await this.bulkUploadRepository.getById<IBulkUpload>(bulkId);
      const caseIds = bulkDoc.caseIds;
      const bulkUploads = [];
      for (const caseId of caseIds) {
        const newBulkUpload = new BulkUpload();
        newBulkUpload.driveUrl = bulkDoc.driveUrl;
        newBulkUpload.debtor = bulkDoc.debtor;
        newBulkUpload.status = 'Success';
        newBulkUpload.createdByName = bulkDoc.createdByName;
        newBulkUpload.createdById = bulkDoc.createdById;
        newBulkUpload.caseIds = [caseId];
        newBulkUpload.time = [new Date(commonUtil.getCurrentDate())] as any;
        newBulkUpload.retries = bulkDoc.retries;
        bulkUploads.push(newBulkUpload);
      }
      await this.bulkUploadRepository.updateById<IBulkUpload>(bulkDoc._id, {
        status: 'Moved to Success',
      });
      await this.bulkUploadRepository.createMany<IBulkUpload>(bulkUploads);
    }
    return [true, constants.successUpdateMessage('Creditors and cases')];
  }

  async createPaynoteCustomer(
    req: Request
  ): Promise<[boolean, ICreditor | string]> {
    const creditor = await this.creditorRepository.getById<ICreditor>(
      req.params.id
    );
    if (!creditor) return [false, constants.notFoundMessage('creditor')];
    const result = await paynoteUtil.createCustomer(
      creditor._id,
      creditor.basicInformation.fullName,
      creditor.basicInformation.email,
      new CreditorRepository()
    );
    console.log(result);
    if (result.error) {
      let message = '';
      if (result?.messages) {
        message = result.messages[0];
      } else {
        message = result.message;
      }
      return [false, message];
    }
    if (result?.success)
      await this.creditorRepository.updateById<ICreditor>(creditor._id, {
        paynoteUserId: result.user.user_id,
      });
    return [true, 'Customer added successfully'];
  }

  async pausePayments(req: Request) {
    const {pause, type} = req.query;
    const {id} = req.params;
    if (
      (pause !== 'true' && pause !== 'false') ||
      (type !== 'lawfirm' && type !== 'creditor')
    ) {
      return [false, 'Query param missing or invalid!'];
    }

    const caseTemp: ICase = await this.caseRepository.getById<ICase>(
      id,
      'debtor creditor'
    );
    if (!caseTemp) return [false, constants.notFoundMessage('case')];
    const updateResult =
      type === 'lawfirm'
        ? await this.lawsuitRepository.updateByOne<ILawsuit>(
            {
              debtorId: caseTemp.debtor,
              creditorId: caseTemp.creditor,
              isDeleted: {$ne: true},
            },
            {paymentsProceed: pause}
          )
        : await this.caseRepository.updateById<ICase>(id, {
            creditorPaymentsProceed: pause,
          });

    if (!updateResult)
      return [false, constants.failureUpdateMessage('payments')];

    const word = pause === 'true' ? 'resumed' : 'paused';
    return [true, `Funds transfer ${word} successfully`];
  }

  async syncPaynote(req: Request) {
    const reqTemp: any = req;
    const type = reqTemp.query.type;
    const user: any = await commonUtil.getUserByType(req.params.id, type);
    if (!user) return [false, constants.notFoundMessage('user')];
    const email = req.body.email.toLowerCase();
    let page = 1;
    let limit = 100;
    const result = await paynoteUtil.getAllCustomerDetails(page, limit);
    if (result?.error) {
      let message = await paynoteUtil.getPaynoteErrorMessage(result);
      return [false, message];
    }
    const resultSync = await paynoteUtil.processSyncCreditorPaynote(
      result.list.data,
      email
    );
    if (resultSync[0]) {
      await paynoteUtil.updateSyncObject(
        resultSync[1],
        req.params.id,
        user.model
      );
      await paynoteUtil.upsertPaynoteEmail(req.params.id, email);
      return resultSync;
    }

    const lastPage = result.list.last_page;
    if (lastPage === page) {
      user.model;
      user.model;
      user.model;
      await paynoteUtil.updateSyncObject(
        resultSync[1],
        req.params.id,
        user.model
      );
      return resultSync;
    }
    let returnValue = null;
    if (lastPage > page) {
      for (let i = page + 1; i <= lastPage; i++) {
        const result = await paynoteUtil.getAllCustomerDetails(i, limit);
        if (result?.error) {
          let message = await paynoteUtil.getPaynoteErrorMessage(result);
          return [false, message];
        }
        const resultSync = await paynoteUtil.processSyncCreditorPaynote(
          result.list.data,
          email
        );
        if (resultSync[0]) {
          await paynoteUtil.updateSyncObject(
            resultSync[1],
            req.params.id,
            user.model
          );
          await paynoteUtil.upsertPaynoteEmail(req.params.id, email);
          return resultSync;
        }
        if (!resultSync[0] && i === lastPage) {
          await paynoteUtil.updateSyncObject(
            resultSync[1],
            req.params.id,
            user.model
          );
          returnValue = [false, 'Could not found user in paynote'];
        }
      }
      return returnValue;
    }
  }

  async getSyncEmail(req: Request) {
    const reqTemp: any = req;
    const type = reqTemp.query.type;
    const user: any = await commonUtil.getUserByType(req.params.id, type);
    if (!user) return [false, constants.notFoundMessage('user')];
    const email = await commonUtil.getUserDetails(user.obj);
    const result =
      await this.syncPaymentMethodRepository.getOne<ISyncPaymentMethod>({
        syncId: req.params.id,
      });
    if (!result) return [true, email.email];
    return [true, result.email];
  }

  async mcaByMonth(req: Request) {
    return creditorUtil.mcaByMonth(req.params.id);
  }
}

export default CreditorService;
