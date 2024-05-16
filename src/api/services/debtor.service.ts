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
            'basicInformation.email': text.toLowerCase(),
          },
          {
            'basicInformation.SSID': text,
          },
          {
            'basicInformation.phone': text,
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
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    const cases = await this.caseRepository.getAll<ICase>(
      {debtor: req.params.id},
      undefined,
      undefined,
      undefined,
      ['debtor', {path: 'creditor', select: ['basicInformation.fullName']}],
      undefined,
      Number(req.query.page),
      Number(req.query.limit)
    );
    const clientDetails = await caseUtil.getClientDetails(cases);
    return [true, {debtor: debtor.basicInformation, ...clientDetails}];
  }

  async searchListing(req: Request) {
    const pipeline = await caseUtil.getClientListingPipeline(req);
    const clientDetails =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    return [true, clientDetails];
  }
}

export default DebtorService;
