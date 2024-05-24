import constants from '../../utils/constants.util';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import {Request} from 'express';

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
  async updateCreditor(req: Request): Promise<[boolean, ICreditor | string]> {
    const bodyCreditor = req?.body as ICreditor;
    const creditor = await this.creditorRepository.updateByOne<ICreditor>(
      {
        'basicInformation.email':
          req?.body?.basicInformation?.email.toLowerCase(),
      },
      {...bodyCreditor}
    );
    if (!creditor) {
      return [false, constants.notFoundMessage('Creditor')];
    }
    return [true, creditor];
  }
}

export default CreditorService;
