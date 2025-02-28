import dotenv from 'dotenv';
import {LawsuitRepository} from '../api/repository/lawsuit/lawsuit.repository';
import {ILawsuit} from '../database/interfaces/lawsuit.interface';
import {Lawsuit} from '../database/repomodels/lawsuit.repomodel';
import {DataCopier} from './dataCopier.util';
import {IPayment} from '../database/interfaces/payment.interface';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {ICase} from '../database/interfaces/case.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import lawfirmUtil from './lawfirm.util';
import {ILawfirm} from '../database/interfaces/lawfirm.interface';
import {LawfirmRepository} from '../api/repository/lawfirm/lawfirm.repository';
import {IAttorney} from '../database/interfaces/attorney.interface';
import {AttorneyRepository} from '../api/repository/attorney/attorney.repository';
import attorneyUtil from './attorney.util';
dotenv.config();
class LawsuitUtil {
  private lawsuitRepository: LawsuitRepository;
  private lawfirmRepository: LawfirmRepository;
  private attorneyRepository: AttorneyRepository;
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.lawsuitRepository = new LawsuitRepository();
    this.lawfirmRepository = new LawfirmRepository();
    this.attorneyRepository = new AttorneyRepository();
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
  }

  async lawsuitFormation(req: any, caseData: any) {
    const {lawsuit, attorney} = req.body;

    const lawfirmExist = await this.lawfirmRepository.getOne<ILawfirm>({
      lawfirmCompanyName: lawsuit.lawfirmCompanyName,
    });
    let createdLawfirm = null;
    let createdAttorney = null;
    if (!lawfirmExist) {
      createdLawfirm = await lawfirmUtil.createLawfirm({
        lawfirmCompanyName: lawsuit.lawfirmCompanyName,
        userId: null,
      });
    }
    const lawfirmId = lawfirmExist ? lawfirmExist._id : createdLawfirm._id;

    const attorneyExist = await this.attorneyRepository.getOne<IAttorney>({
      SSN: attorney.SSN,
    });
    attorney.lawfirmId = lawfirmId;
    if (!attorneyExist) {
      createdAttorney = await attorneyUtil.createAttorney(attorney);
    }

    const attorneyId = attorneyExist ? attorneyExist._id : createdAttorney._id;

    const lawsuitData = {
      attorneyId: attorneyId,
      lawfirmId: lawfirmId,
      debtorId: caseData.debtor,
      userId: null,
      creditorId: caseData.creditor,
      lawfirmCompanyName: lawsuit.lawfirmCompanyName,
      defendentCompanyName: lawsuit.defendentCompanyName,
      plantiffCompanyName: lawsuit.plantiffCompanyName,
      lawsuitDate: lawsuit.startDate,
    };
    const lawsuitTemp = await this.createLawsuit(lawsuitData);

    return lawsuitTemp ? [true, lawsuitTemp] : false;
  }

  async createLawsuit(data: any) {
    const newLawsuit = new Lawsuit();
    const validatedLawsuit = DataCopier.copy(newLawsuit, data as ILawsuit);
    return await this.lawsuitRepository.create<ILawsuit>(validatedLawsuit);
  }

  async updateLegalFee(payments: IPayment[]) {
    for (const payment of payments) {
      const updateObjPayment = {};
      if (payment.caseId) {
        updateObjPayment['legalFee'] = await this.getLegalFee(payment.caseId);
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
      }
    }
  }

  async getTotalLegalFee(payments: IPayment[]) {
    let totalLegalFee = 0;

    for (const payment of payments) {
      if (payment.caseId) {
        totalLegalFee += await this.getLegalFee(payment.caseId);
      }
    }
    return totalLegalFee;
  }

  async getLegalFee(caseId: any) {
    const caseData = await this.caseRepository.getById<ICase>(caseId);

    const lawsuitData: any = await this.lawsuitRepository.getOne<ILawsuit>(
      {
        debtorId: caseData.debtor,
        creditorId: caseData.creditor,
      },
      undefined,
      undefined,
      [
        {path: 'lawfirmId', select: ['lawfirmFee']},
        {path: 'attorneyId', select: ['attorneyFee']},
      ]
    );

    const legalFee = lawsuitData
      ? lawsuitData.attorneyId?.attorneyFee
      : lawsuitData.lawfirmId?.lawfirmFee;

    return legalFee;
  }
}
export default new LawsuitUtil();
