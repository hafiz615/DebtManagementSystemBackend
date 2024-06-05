import constants from '../../utils/constants.util';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import {Request} from 'express';
import {CaseRepository} from '../repository/case/case.repository';
import caseUtil from '../../utils/case.util';
import {ICase} from '../../database/interfaces/case.interface';

class CreditorService {
  private creditorRepository: CreditorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.caseRepository = new CaseRepository();
  }

  async getCreditor(text: string): Promise<[boolean, ICreditor | string]> {
    const creditor = await this.creditorRepository.getOne<ICreditor>(
      {
        $or: [
          {
            'basicInformation.email': {
              $regex: new RegExp(text, 'i'), // Case-insensitive match for email
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
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }
  async updateCreditor(req: Request): Promise<[boolean, ICreditor | string]> {
    const creditor = await this.creditorRepository.updateById<ICreditor>(
      req.params.id,
      {...req.body}
    );
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }

  async listingDetails(req: Request) {
    const casesCount = await this.caseRepository.getCount<ICase>({
      creditor: req.params.id,
    });
    const clientDetails = await caseUtil.getClientDetails(req);
    if (!clientDetails) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, {...clientDetails, debtorTotalCases: casesCount}];
  }

  async listing(req: Request) {
    const creditorsCount = await this.creditorRepository.getCount<ICreditor>();

    const pipeline = await caseUtil.getCreditorListingPipeline(req);
    const clientDetails =
      await this.caseRepository.applyAggregate<ICase>(pipeline);
    return [
      true,
      {clientDetails: clientDetails, creditorsCount: creditorsCount},
    ];
  }
}

export default CreditorService;
