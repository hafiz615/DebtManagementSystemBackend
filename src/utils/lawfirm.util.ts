import dotenv from 'dotenv';
import {LawfirmRepository} from '../api/repository/lawfirm/lawfirm.repository';
import {ILawfirm} from '../database/interfaces/lawfirm.interface';
import {Lawfirm} from '../database/repomodels/lawfirm.repomodel';
import {DataCopier} from './dataCopier.util';
import commonUtil from './common.util';
import {v4} from 'uuid';
dotenv.config();
class LawfirmUtil {
  private lawfirmRepository: LawfirmRepository;

  constructor() {
    this.lawfirmRepository = new LawfirmRepository();
  }

  async createLawfirm(data: any) {
    const newLawfirm = new Lawfirm();
    const validatedLawfirm = DataCopier.copy(newLawfirm, data as ILawfirm);
    return await this.lawfirmRepository.create<ILawfirm>(validatedLawfirm);
  }

  async upsertLawfirm(data: any) {
    const newLawfirm = new Lawfirm();
    const validatedLawfirm = DataCopier.copy(newLawfirm, data as ILawfirm);

    return await this.lawfirmRepository.upsert<ILawfirm>(
      {lawfirmCompanyName: data.lawfirmCompanyName},
      {
        $setOnInsert: {logTrackingId: v4()},
        $set: {...validatedLawfirm, updatedAt: commonUtil.getCurrentDate()},
      }
    );
  }

  async lawfirmDetails(data: any, id: string) {
    return {
      lawfirmCompanyName: data.result.lawfirmCompanyName,
      email: data.result.email,
      phone: await commonUtil.cleanPhoneNumber(data.result.phone),
      address: data.result.address,
      city: data.result.city,
      state: data.result.state,
      EIN: data.result.EIN,
      userId: id,
    };
  }

  async lawfirmData(req: any) {
    return {
      name: req.body['lawfirm.name'],
      email: req.body['lawfirm.email'],
      phone: req.body['lawfirm.phone'],
      address: req.body['lawfirm.address'],
      city: req.body['lawfirm.city'],
      state: req.body['lawfirm.state'],
      status: req.body['lawfirm.status'],
      EIN: req.body['lawfirm.EIN'],
      lawfirmFee: req.body['lawfirm.lawfirmFee'],
      platform: req.body['lawfirm.platform'] === 'true',
    };
  }
}
export default new LawfirmUtil();
