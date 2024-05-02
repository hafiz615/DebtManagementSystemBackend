import constants from '../../utils/constants.util';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';

class CreditorService {
  private creditorRepository: CreditorRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
  }

  async getCreditor(email: string): Promise<[boolean, ICreditor | string]> {
    const creditor = await this.creditorRepository.getOne<ICreditor>(
      {'basicInformation.email': email},
      undefined,
      undefined,
      ['contacts']
    );
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }
}

export default CreditorService;
