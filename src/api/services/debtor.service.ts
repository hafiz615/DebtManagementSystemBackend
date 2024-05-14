import constants from '../../utils/constants.util';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {CaseRepository} from '../repository/case/case.repository';
import {Request} from 'express';
import caseUtil from '../../utils/case.util';

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

  async listing(req: Request) {
    const cases: any = await this.caseRepository.getAll(
      {},
      undefined,
      undefined,
      undefined,
      ['debtor'],
      undefined,
      Number(req.query.page),
      Number(req.query.limit)
    );
    const result = await caseUtil.getClientsList(cases);
    return [true, result];
  }
}

export default DebtorService;
