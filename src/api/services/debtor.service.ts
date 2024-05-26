import constants from '../../utils/constants.util';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {CaseRepository} from '../repository/case/case.repository';
import {Request} from 'express';
import caseUtil from '../../utils/case.util';
import {ICase} from '../../database/interfaces/case.interface';

class DebtorService {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
  }

  async getDebtor(text: string): Promise<[boolean, IDebtor | string]> {
    const debtor = await this.debtorRepository.getOne<IDebtor>(
      {
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
      },
      undefined,
      undefined,
      ['contacts']
    );
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
    return [true, {...clientDetails, debtorTotalCases: casesCount}];
  }

  async searchListing(req: Request) {
    const debtorsCount = await this.debtorRepository.getCount<IDebtor>();

    const pipeline = await caseUtil.getClientListingPipeline(req);
    const clientDetails =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    return [true, {clientDetails: clientDetails, debtorsCount: debtorsCount}];
  }

  async updateDebtor(req: Request): Promise<[boolean, IDebtor | string]> {
    const debtor = await this.debtorRepository.updateById<IDebtor>(
      req.params.id,
      {...req.body}
    );
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }
}

export default DebtorService;
