import constants from '../../utils/constants.util';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {DebtorRepository} from '../repository/debtor/debtor.repository';

class DebtorService {
  private debtorRepository: DebtorRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
  }

  async getDebtor(email: string): Promise<[boolean, IDebtor | string]> {
    const debtor = await this.debtorRepository.getOne<IDebtor>(
      {'basicInformation.email': email},
      undefined,
      undefined,
      ['contacts']
    );
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    return [true, debtor];
  }
}

export default DebtorService;
