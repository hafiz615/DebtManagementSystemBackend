import dotenv from 'dotenv';
import {AttorneyRepository} from '../api/repository/attorney/attorney.repository';
import {IAttorney} from '../database/interfaces/attorney.interface';
import {Attorney} from '../database/repomodels/attorney.repomodel';
import {DataCopier} from './dataCopier.util';
dotenv.config();
class AttorneyUtil {
  private attorneyRepository: AttorneyRepository;

  constructor() {
    this.attorneyRepository = new AttorneyRepository();
  }

  async createAttorney(data: IAttorney) {
    const newattorney = new Attorney();
    const validatedattorney = DataCopier.copy(newattorney, data as IAttorney);
    return await this.attorneyRepository.create<IAttorney>(validatedattorney);
  }

  async upsertAttorney(data: IAttorney) {
    const newattorney = new Attorney();
    const validatedattorney = DataCopier.copy(newattorney, data as IAttorney);
    return await this.attorneyRepository.upsert<IAttorney>(
      {phone: data.phone},
      validatedattorney
    );
  }

  async attorneyData(req: any) {
    return {
      name: req.body['attorney.name'],
      email: req.body['attorney.email'],
      phone: req.body['attorney.phone'],
      address: req.body['attorney.address'],
      city: req.body['attorney.city'],
      state: req.body['attorney.state'],
      SSN: req.body['attorney.SSN'],
      status: req.body['attorney.status'],
      attorneyFee: req.body['attorney.attorneyFee'],
      platform: req.body['attorney.platform'] === 'true',
    };
  }
}
export default new AttorneyUtil();
