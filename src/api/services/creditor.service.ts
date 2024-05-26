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
}

export default CreditorService;
