import constants from '../../utils/constants.util';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';

class CreditorService {
  private creditorRepository: CreditorRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
  }

  async getCreditor(text: string): Promise<[boolean, ICreditor | string]> {
    const creditor = await this.creditorRepository.getOne<ICreditor>(
      {
        $or: [
          {
            'basicInformation.email': text.toLowerCase(),
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
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }
}

export default CreditorService;
