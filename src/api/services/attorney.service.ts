import {Request} from 'express';
import constants from '../../utils/constants.util';
import {ICase} from '../../database/interfaces/case.interface';
import {CaseRepository} from '../repository/case/case.repository';
import {LawsuitRepository} from '../repository/lawsuit/lawsuit.repository';
import {ILawsuit} from '../../database/interfaces/lawsuit.interface';
import {PaymentRepository} from '../repository/payment/payment.repository';
import {IPayment} from '../../database/interfaces/payment.interface';
import {AttorneyRepository} from '../repository/attorney/attorney.repository';
import {IAttorney} from '../../database/interfaces/attorney.interface';
import commonUtil from '../../utils/common.util';
class AttorneyService {
  private attorneyRepository: AttorneyRepository;
  private lawsuitRepository: LawsuitRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  constructor() {
    this.lawsuitRepository = new LawsuitRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.attorneyRepository = new AttorneyRepository();
  }
  getLawsuitDetails = async (req: Request) => {
    const caseData: ICase = await this.caseRepository.getById<ICase>(
      req.params.id,
      'debtor creditor',
      undefined,
      ['lawfirmId']
    );

    if (!caseData) return [false, constants.notFoundMessage('Case')];

    const lawsuit = await this.lawsuitRepository.getOne<ILawsuit>(
      {
        debtorId: caseData.debtor,
        creditorId: caseData.creditor,
        isDeleted: {$ne: true},
      },
      undefined,
      undefined,
      ['attorneyId', 'lawfirmId']
    );

    if (!lawsuit) {
      return [true, caseData.lawfirmId ? {lawfirm: caseData.lawfirmId} : null];
    }

    const {attorneyId, lawfirmId, ...rest} = lawsuit;

    return [
      true,
      {
        lawSuit: rest,
        attorney: attorneyId,
        lawfirm: lawfirmId,
      },
    ];
  };

  updateAttorney = async (req: Request) => {
    const updateData = {...req.body, updatedAt: commonUtil.getCurrentDate()};
    const attorney = await this.attorneyRepository.updateById<IAttorney>(
      req.params.id,
      updateData
    );

    if (!attorney) {
      return [false, constants.notFoundMessage('Attorney')];
    }
    return [true, attorney];
  };
  async cancelLawSuitPaymentPlan(req: Request) {
    const getCase: ICase = await this.caseRepository.getById<ICase>(
      req.body.caseId,
      'debtor creditor'
    );
    if (!getCase) return [false, constants.notFoundMessage('Case')];

    const lawSuit = await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        // attorneyId: req.params.id,
        debtorId: getCase.debtor,
        creditorId: getCase.creditor,
        isDeleted: {$ne: true},
      },
      {
        intervals: [],
        isExempt: false,
      }
    );
    const updatePayments = await this.paymentRepository.updateMany<IPayment>(
      {
        caseId: req.body.caseId,
        lawsuitId: lawSuit._id,
        $or: [{authorized: 'Pending'}, {authorized: 'Failed'}],
      },
      {
        isDeleted: true,
      }
    );

    if (!lawSuit || !updatePayments)
      return [false, 'Failed to cancel lawsuit payment plan'];
    return [true, 'Lawsuit payment plan cancelled successfully'];
  }
}

export default AttorneyService;
