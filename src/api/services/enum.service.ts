import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import {EnumRepository} from '../repository/enum/enum.repository';
import {IEnum} from '../../database/interfaces/enum.interface';
import {Enum} from '../../database/repomodels/enum.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';

class EnumService {
  private enumRepository: EnumRepository;
  constructor() {
    this.enumRepository = new EnumRepository();
  }
  async createEnum(req: Request): Promise<[boolean, IEnum | string]> {
    const newEnum = new Enum();
    const validatedEnum = DataCopier.copy(newEnum, req.body);
    const result = await this.enumRepository.create<IEnum>(validatedEnum);
    if (!result) {
      return [false, constantsUtil.failureAddMessage('enum list')];
    }
    return [true, result];
  }

  async getAllEnums(req: Request): Promise<[boolean, IEnum[] | string]> {
    const result = await this.enumRepository.getAll<IEnum>();
    if (!result) {
      return [false, constantsUtil.notFoundMessage('enums')];
    }
    return [true, result];
  }

  async getEnumByTarget(req: Request): Promise<[boolean, IEnum | string]> {
    const result = await this.enumRepository.getOne<IEnum>({
      enumTarget: String(req.query.target),
    });
    if (!result) {
      return [false, constantsUtil.notFoundMessage('enum')];
    }
    return [true, result];
  }
}

export default EnumService;
