import {Request} from 'express';
import constants from '../../utils/constants.util';
import {ICase} from '../../database/interfaces/case.interface';
import {CaseRepository} from '../repository/case/case.repository';
import {LawsuitRepository} from '../repository/lawsuit/lawsuit.repository';
import {ILawsuit} from '../../database/interfaces/lawsuit.interface';
import {PaymentRepository} from '../repository/payment/payment.repository';
import {IPayment} from '../../database/interfaces/payment.interface';
class AttorneyService {
  private lawsuitRepository: LawsuitRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  constructor() {
    this.lawsuitRepository = new LawsuitRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
  }

  getLawSuitBalanceSummary = async (req: Request) => {
    const getCase: ICase = await this.caseRepository.getById<ICase>(
      req.body.caseId,
      'debtor creditor'
    );
    if (!getCase) return [false, constants.notFoundMessage('Case')];

    const lawSuitBalanceSummary = await this.lawsuitRepository.getOne<ILawsuit>(
      {
        attorneyId: req.params.id,
        debtorId: getCase.debtor,
        creditorId: getCase.creditor,
      }
    );

    const lawSuit = lawSuitBalanceSummary
      ? {
          lawSuitId: lawSuitBalanceSummary._id,
          balance: lawSuitBalanceSummary.balance,
          receivedBalance: lawSuitBalanceSummary.lawsuitReceiveAmount,
        }
      : null;

    return [true, lawSuit];
  };

  async cancelLawSuitPaymentPlan(req: Request) {
    const getCase: ICase = await this.caseRepository.getById<ICase>(
      req.body.caseId,
      'debtor creditor'
    );
    if (!getCase) return [false, constants.notFoundMessage('Case')];

    const lawSuit = await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        attorneyId: req.params.id,
        debtorId: getCase.debtor,
        creditorId: getCase.creditor,
      },
      {
        intervals: [],
        isExempt: false,
      }
    );
    const updatePayments = await this.paymentRepository.updateMany<IPayment>(
      {
        caseId: req.body.caseId,
        attorneyId: req.params.id,
        $or: [{authorized: 'Pending'}, {authorized: 'Failed'}],
      },
      {
        isDeleted: true,
      }
    );

    if (!lawSuit || !updatePayments)
      return [false, 'Failed to cancel law suit payment plan'];
    return [true, 'Law suit payment plan canceled successfully'];
  }
}

export default AttorneyService;
