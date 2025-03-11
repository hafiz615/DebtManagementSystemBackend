import {Request} from 'express';
import constants from '../../utils/constants.util';
import {ICase} from '../../database/interfaces/case.interface';
import {CaseRepository} from '../repository/case/case.repository';
import {LawsuitRepository} from '../repository/lawsuit/lawsuit.repository';
import {ILawsuit} from '../../database/interfaces/lawsuit.interface';
class AttorneyService {
  private lawsuitRepository: LawsuitRepository;
  private caseRepository: CaseRepository;
  constructor() {
    this.lawsuitRepository = new LawsuitRepository();
    this.caseRepository = new CaseRepository();
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
}

export default AttorneyService;
