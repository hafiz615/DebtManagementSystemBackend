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
import {ServiceFeeRepository} from '../api/repository/serviceFee/serviceFee.repository';
import {IFee} from '../database/interfaces/serviceFee.interface';
import commonUtil from './common.util';
dotenv.config();
class LawsuitUtil {
  private lawsuitRepository: LawsuitRepository;
  private lawfirmRepository: LawfirmRepository;
  private attorneyRepository: AttorneyRepository;
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private serviceFeeRepository: ServiceFeeRepository;

  constructor() {
    this.lawsuitRepository = new LawsuitRepository();
    this.lawfirmRepository = new LawfirmRepository();
    this.attorneyRepository = new AttorneyRepository();
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.serviceFeeRepository = new ServiceFeeRepository();
  }

  async lawsuitFormation(req: any, caseData: any) {
    const {lawsuit, attorney, lawfirm} = req.body;
    const id = lawsuit?.userId;

    const newLawfirm = lawsuit?.lawfirmCompanyName
      ? {
          lawfirmCompanyName: lawsuit.lawfirmCompanyName,
          platform: req.body.platform,
          userId: id,
        }
      : lawfirm
        ? {...lawfirm, platform: req.body.platform, userId: id}
        : null;

    const lawfirmTemp = await lawfirmUtil.upsertLawfirm({
      ...newLawfirm,
    });

    const attorneyTemp = await attorneyUtil.upsertAttorney({
      ...attorney,
      platform: req.body.platform,
      userId: id,
      lawfirmId: lawfirmTemp.id,
    });

    const lawsuitInfo = this.lawsuitInfo(
      lawsuit,
      caseData,
      attorneyTemp._id,
      lawfirmTemp._id,
      id
    );

    const lawsuitTemp = await this.upsertLawsuit(lawsuitInfo);

    return lawsuitTemp ? [true, lawsuitTemp] : false;
  }

  async lawsuitDetailsDebtorPortal(lawsuitFields: any, userId?: any) {
    return {
      body: {
        attorney: {
          name: lawsuitFields?.name || '',
          phone: await commonUtil.cleanPhoneNumber(lawsuitFields?.phone),
          address: lawsuitFields.address || '',
          city: lawsuitFields.city || '',
          SSN: lawsuitFields.SSN || '',
          state: lawsuitFields.state || '',
          userId: userId || null,
          email: lawsuitFields?.email || '',
        },
        lawsuit: {
          balance: lawsuitFields?.balance || lawsuitFields?.Balance || 0,
          lawfirmCompanyName: lawsuitFields.lawfirmCompanyName || '',
          startDate: lawsuitFields.startDate || '',
          defendentCompanyName: lawsuitFields.defendentCompanyName || '',
          plantiffCompanyName: lawsuitFields.plantiffCompanyName || '',
          userId: userId || null,
        },
        lawfirm: {
          lawfirmCompanyName: lawsuitFields.lawfirmCompanyName,
          // email: lawsuitFields.email,
          // phone: await commonUtil.cleanPhoneNumber(lawsuitFields.phone),
          // address: lawsuitFields.address,
          // city: lawsuitFields.city,
          // state: lawsuitFields.state,
          // EIN: lawsuitFields.EIN,
          // userId: userId || null,
        },
      },
    };
  }

  async lawsuitDetails(lawsuitFields: any, userId?: any) {
    return {
      body: {
        attorney: {
          name: lawsuitFields?.attorney_name || '',
          phone: await commonUtil.cleanPhoneNumber(
            lawsuitFields?.attorney_telephone
          ),
          address: lawsuitFields.attorney_address || '',
          city: lawsuitFields.attorney_city || '',
          SSN: lawsuitFields.attorney_SSN || '',
          state: lawsuitFields.attorney_state || '',
          userId: userId || null,
        },
        lawsuit: {
          balance: lawsuitFields?.balance || lawsuitFields?.Balance || 0,
          startDate: lawsuitFields.document_date || '',
          defendentCompanyName: lawsuitFields.defendant_company || '',
          plantiffCompanyName: lawsuitFields.plaintiff_company || '',
          userId: userId || null,
        },
        lawfirm: {
          lawfirmCompanyName: lawsuitFields.lawfirmCompanyName,
          email: lawsuitFields.email,
          phone: await commonUtil.cleanPhoneNumber(lawsuitFields.phone),
          address: lawsuitFields.address,
          city: lawsuitFields.city,
          state: lawsuitFields.state,
          EIN: lawsuitFields.EIN,
          userId: userId || null,
          lawfirmFee: commonUtil.extractAmount(
            lawsuitFields?.monthly_subscription_fee
          ),
        },
      },
    };
  }

  private lawsuitInfo(
    lawsuit: any,
    caseData: any,
    attorneyId: string,
    lawfirmId: string,
    userId?: string
  ) {
    return {
      attorneyId,
      lawfirmId,
      debtorId: caseData.debtor,
      creditorId: caseData.creditor,
      lawfirmCompanyName: lawsuit.lawfirmCompanyName,
      defendentCompanyName: lawsuit.defendentCompanyName,
      plantiffCompanyName: lawsuit.plantiffCompanyName,
      lawsuitDate: lawsuit.startDate,
      balance: lawsuit?.balance || lawsuit?.Balance,
      userId: userId || null,
    };
  }

  async createLawsuit(data: any) {
    const newLawsuit = new Lawsuit();
    const validatedLawsuit = DataCopier.copy(newLawsuit, data as ILawsuit);
    return await this.lawsuitRepository.create<ILawsuit>(validatedLawsuit);
  }

  async upsertLawsuit(data: any) {
    const newLawsuit = new Lawsuit();
    const validatedLawsuit = DataCopier.copy(newLawsuit, data as ILawsuit);
    delete validatedLawsuit.debtorId;
    delete validatedLawsuit.creditorId;
    return await this.lawsuitRepository.upsert<ILawsuit>(
      {
        debtorId: data.debtorId,
        creditorId: data.creditorId,
        isDeleted: false,
      },
      validatedLawsuit
    );
  }

  async updateFee(payments: any) {
    for (const payment of payments) {
      const updateObjPayment = {};
      if (payment.caseId) {
        const fee = await this.getLegalFee(payment.caseId);
        updateObjPayment['legalFee'] = fee;
        updateObjPayment['serviceFee'] = await this.getServiceFee(
          payment.caseId
        );
        updateObjPayment['updatedAt'] = commonUtil.getCurrentDate();
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
        this.updateLawsuitFee(
          fee,
          payment.caseId.debtor._id,
          payment.caseId.creditor._id
        );
      }
    }
  }

  async updatePaymentLawsuit(payments: any) {
    for (const payment of payments) {
      if (payment.caseId) {
        const fee = await this.getLegalFee(payment.caseId);
        if (fee) {
          this.updateLawsuitFee(
            fee,
            payment.caseId.debtor._id,
            payment.caseId.creditor._id
          );
        }
      }
    }
  }

  async updateLawsuitFee(fee: number, debtorId: any, creditorId: any) {
    await this.lawsuitRepository.updateByOne<ILawsuit>(
      {creditorId, debtorId, isDeleted: {$ne: true}},
      {
        $inc: {
          lawsuitReceiveAmount: fee,
          lawsuitReceiveCount: 1,
        },
      }
    );
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

  async getTotalServiceFee(payments: IPayment[]) {
    let totalServiceFee = 0;

    for (const payment of payments) {
      if (payment.caseId) {
        totalServiceFee += await this.getServiceFee(payment.caseId);
      }
    }
    return totalServiceFee;
  }

  async getLegalFee(caseData: any) {
    // const caseData = await this.caseRepository.getById<ICase>(caseId._id);
    if (caseData.lawsuitExist) {
      if (caseData.legalFee > 0) {
        return caseData.legalFee;
      }

      const lawsuitData: any = await this.lawsuitRepository.getOne<ILawsuit>(
        {
          debtorId: caseData.debtor._id,
          creditorId: caseData.creditor,
          isDeleted: {$ne: true},
        },
        undefined,
        undefined,
        ['lawfirmId']
      );

      if (lawsuitData?.lawfirmId?.lawfirmFee !== 0) {
        return lawsuitData.lawfirmId.lawfirmFee;
      }

      let legalFee = await this.serviceFeeRepository.getOne<IFee>({
        type: 'legalFee',
      });
      return legalFee ? legalFee.fee : 0;
    }
    return 0;
  }

  async getServiceFee(caseData: any) {
    // const caseData = await this.caseRepository.getById<ICase>(caseId._id);
    if (caseData.serviceFee !== 0) {
      return caseData.serviceFee;
    }

    const serviceFee = await this.serviceFeeRepository.getOne<IFee>({
      type: 'serviceFee',
    });

    return serviceFee ? serviceFee.fee : 0;
  }

  async deleteLawsuit(debtorId: string, creditorId: string) {
    await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        debtorId: debtorId,
        creditorId: creditorId,
        isDeleted: {$ne: true},
      },
      {
        isDeleted: true,
      }
    );
  }

  async cancelPlan(debtorId: string, creditorId: string) {
    await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        debtorId: debtorId,
        creditorId: creditorId,
        isDeleted: {$ne: true},
      },
      {
        intervals: [],
        isExempt: false,
      }
    );
  }
}
export default new LawsuitUtil();
