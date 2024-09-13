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

class CreditorService {
  private creditorRepository: CreditorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.caseRepository = new CaseRepository();
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
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    const params = {
      customer_vault: 'add_customer',
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
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
    for (const tempCase of cases) {
      tempCase.creditor.updatedAt = commonUtil.getCurrentDate();
      const updatedCreditor =
        await this.creditorRepository.updateById<ICreditor>(
          tempCase.creditor._id,
          tempCase.creditor
        );
      delete tempCase.creditor;
      console.log(tempCase, 'tempCaseeeee');
      let caseUpdated = await this.caseRepository.updateById<ICase>(
        tempCase._id,
        tempCase
      );
      if (updatedCreditor && caseUpdated) result.push(true);
    }
    if (!result.length)
      return [false, constants.failureUpdateMessage('cases and creditors')];
    return [true, constants.successUpdateMessage('Creditors and cases')];
  }
}

export default CreditorService;
