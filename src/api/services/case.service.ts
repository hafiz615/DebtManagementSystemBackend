import {Request} from 'express';
import {DataCopier} from '../../utils/dataCopier.util';
import {CaseRepository} from '../repository/case/case.repository';
import caseUtil from '../../utils/case.util';
import {IContact} from '../../database/interfaces/contact.interface';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import {Case} from '../../database/repomodels/case.repomodel';
import {ICase, IKeyFile} from '../../database/interfaces/case.interface';
import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';
import GlobalVariables from '../../global';

class CaseService {
  private caseRepository: CaseRepository;
  private uploadUtil: UploadUtil;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.uploadUtil = new UploadUtil();
  }
  createCase = async (
    req: Request
  ): Promise<[boolean, Partial<ICase> | string]> => {
    let contactIds = null;
    let debtor = null;
    let creditor = null;
    if (req.query.debtor === 'null') {
      contactIds = await caseUtil.createContacts(
        req.body.debtor.contacts as IContact[]
      );
      const debtorData = {
        ...req.body.debtor,
        contacts: contactIds,
      };
      debtor = await caseUtil.createDebtor(debtorData as IDebtor);
    }
    if (req.query.creditor === 'null') {
      contactIds = await caseUtil.createContacts(
        req.body.creditor.contacts as IContact[]
      );
      const creditorData = {
        ...req.body.creditor,
        contacts: contactIds,
      };
      creditor = await caseUtil.createCreditor(creditorData as ICreditor);
    }
    req.body.debtor = debtor ? debtor._id : req.query.debtor;
    req.body.creditor = creditor ? creditor._id : req.query.creditor;
    const newCase = new Case();
    newCase.caseOwner = GlobalVariables.role;
    newCase.createdBy = GlobalVariables.email;
    newCase.caseCode = await caseUtil.getCaseCode();
    const validatedCase = DataCopier.copy(newCase, req.body);
    const caseCreated = await this.caseRepository.create<ICase>(validatedCase);
    await caseUtil.createPayment(caseCreated);
    return [true, caseCreated];
  };

  getAllCases = async (req: Request): Promise<[boolean, ICase[] | string]> => {
    let cases = await this.caseRepository.getAll<ICase>(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      Number(req.query.page),
      Number(req.query.limit)
    );
    if (!cases.length) {
      return [false, constantsUtil.notFoundMessage('Cases')];
    }
    for (let temp of cases) {
      for (let doc of temp.documents) {
        const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
        doc.url = url;
      }
    }
    return [true, cases];
  };

  getCaseById = async (req: Request): Promise<[boolean, ICase | string]> => {
    let findCase = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      [
        {path: 'creditor', populate: 'contacts'},
        {path: 'debtor', populate: 'contacts'},
      ]
    );
    if (!findCase) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    for (let doc of findCase.documents) {
      const url = await this.uploadUtil.getS3FileSignedUrl(doc.key);
      doc.url = url;
    }
    const creditors = await caseUtil.getAllCreditorsOfDebtor(
      findCase.debtor as any
    );
    const tempCase: any = findCase;
    tempCase['creditors'] = creditors;
    return [true, tempCase];
  };
}

export default CaseService;
