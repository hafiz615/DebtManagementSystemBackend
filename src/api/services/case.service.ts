import {Request} from 'express';
import {DataCopier} from '../../utils/dataCopier.util';
import {CaseRepository} from '../repository/case/case.repository';
import caseUtil from '../../utils/case.util';
import {IContact} from '../../database/interfaces/contact.interface';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import {Case} from '../../database/repomodels/case.repomodel';
import {ICase} from '../../database/interfaces/case.interface';

class CaseService {
  private caseRepository: CaseRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
  }
  createCase = async (
    req: Request
  ): Promise<[boolean, Partial<ICase> | string]> => {
    let contactIds = null;
    let debtor,
      creditor = null;
    if (req.query.debtor === 'null') {
      contactIds = await caseUtil.createContacts(
        req.body.debtor.contacts as IContact[]
      );
      const debtorData = {
        basicInformation: req.body.debtor.basicInformation,
        businessInformation: req.body.debtor.businessInformation,
        contacts: contactIds,
      };
      debtor = await caseUtil.createDebtor(debtorData as IDebtor);
    }
    if (req.query.creditor === 'null') {
      contactIds = await caseUtil.createContacts(
        req.body.creditor.contacts as IContact[]
      );
      const creditorData = {
        basicInformation: req.body.creditor.basicInformation,
        businessInformation: req.body.creditor.businessInformation,
        contacts: contactIds,
      };
      creditor = await caseUtil.createCreditor(creditorData as ICreditor);
    }
    req.body.debtor = debtor ? debtor._id : req.query.debtor;
    req.body.creditor = creditor ? creditor._id : req.query.creditor;
    const newCase = new Case();
    const validatedCase = DataCopier.copy(newCase, req.body);
    const caseCreated = await this.caseRepository.create<ICase>(validatedCase);
    return [true, caseCreated];
  };
}

export default CaseService;
