import constants from '../../utils/constants.util';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {CaseRepository} from '../repository/case/case.repository';
import {Request} from 'express';
import caseUtil from '../../utils/case.util';
import {ICase} from '../../database/interfaces/case.interface';
import axios from 'axios';
import {URLSearchParams} from 'url';

class DebtorService {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
  }

  async getDebtor(text: string): Promise<[boolean, IDebtor[] | string]> {
    const debtor = await this.debtorRepository.getAll<IDebtor>({
      $or: [
        {
          'basicInformation.email': {
            $regex: new RegExp(text, 'i'), // Case-insensitive match for email
          },
        },
        {
          'basicInformation.SSID': {
            $regex: new RegExp(text), // Case-insensitive match for SSID
          },
        },
        {
          'basicInformation.phone': {
            $regex: new RegExp(text), // Case-insensitive match for phone
          },
        },
      ],
    });
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }

  async listingDetails(req: Request) {
    const casesCount = await this.caseRepository.getCount<ICase>({
      debtor: req.params.id,
    });
    const clientDetails = await caseUtil.getClientDetails(req);
    if (!clientDetails) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, {...clientDetails, debtorTotalCases: casesCount}];
  }

  async searchListing(req: Request) {
    let debtorsCount: number = 0;
    let page = 1;
    let limit = 10;

    // Check if pageNumber and pageSize are provided and valid
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    const pipeline: any = await caseUtil.getClientListingPipeline(req);
    const clientDetails: any =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    if (req.query.filter === 'true' || req.query.search === 'true') {
      debtorsCount = clientDetails.length;
    } else {
      debtorsCount = await this.debtorRepository.getCount<IDebtor>();
    }
    const paginatedDetails = clientDetails.slice(
      (page - 1) * limit,
      page * limit
    );
    return [
      true,
      {clientDetails: paginatedDetails, debtorsCount: debtorsCount},
    ];
  }

  async updateDebtor(req: Request): Promise<[boolean, IDebtor | string]> {
    const email = req.body.basicInformation.email.toLowerCase();
    const getDebtor = await this.debtorRepository.getOne<IDebtor>({
      $or: [
        {
          'basicInformation.email': email,
        },
        {
          'basicInformation.SSID': req.body.basicInformation.SSID,
        },
        {
          'basicInformation.phone': req.body.basicInformation.phone,
        },
      ],
    });
    if (getDebtor) {
      if (
        getDebtor.basicInformation.email === email &&
        String(getDebtor._id) !== req.params.id
      ) {
        return [
          false,
          constants.alreadyExistsMessage('Debtor with basicInformation.email'),
        ];
      }
      if (
        getDebtor.basicInformation.SSID === req.body.basicInformation.SSID &&
        String(getDebtor._id) !== req.params.id
      ) {
        return [
          false,
          constants.alreadyExistsMessage('Debtor with basicInformation.SSN'),
        ];
      }
      if (
        getDebtor.basicInformation.phone === req.body.basicInformation.phone &&
        String(getDebtor._id) !== req.params.id
      ) {
        return [
          false,
          constants.alreadyExistsMessage('Debtor with basicInformation.phone'),
        ];
      }
    }
    if (
      req.body.basicInformation.weeklyBudget !==
      getDebtor.basicInformation.weeklyBudget
    ) {
      const response = await caseUtil.checkWeeklyBudget(
        {debtor: req.body},
        true,
        getDebtor
      );
      if (!response.status) {
        return [
          false,
          'Weekly budget is not fulfiling the payment plan of debtor',
        ];
      }
      req.body.weeklyCommission = response.commission;
    }
    req.body;
    const debtor = await this.debtorRepository.updateById<IDebtor>(
      req.params.id,
      req.body
    );
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }

  async createVault(req: Request) {
    const url = 'https://seamlesschex.transactiongateway.com/api/transact.php';
    if (!req.body || !req.body.paymentToken) {
      return [false, 'Payment token is missing'];
    }
    const params = {
      customer_vault: 'add_customer',
      security_key: '6457Thfj624V5r7WUwc5v6a68Zsd6YEm',
      payment_token: req.body.paymentToken,
    };
    const response = await axios.get(url, {params});
    const responseNum = new URLSearchParams(response.data).get('response');
    const customerVault = new URLSearchParams(response.data).get(
      'customer_vault'
    );
    if (responseNum === '1') {
      const debtor = await this.debtorRepository.updateById<IDebtor>(
        req.params.id,
        {customerVaultId: customerVault}
      );
      return [true, debtor];
    }
    return [false, 'Unable to create customer vault'];
  }
}

export default DebtorService;
