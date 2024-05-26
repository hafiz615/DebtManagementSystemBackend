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
import DebtorService from './debtor.service';
import CreditorService from './creditor.service';

class CaseService {
  private caseRepository: CaseRepository;
  private uploadUtil: UploadUtil;
  private debtorService: DebtorService;
  private creditorService: CreditorService;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.uploadUtil = new UploadUtil();
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
  }
  createCase = async (
    req: Request
  ): Promise<[boolean, ICase | ICase[] | string]> => {
    const reqTemp: any = req;
    if (req.query.bulk === 'true') {
      const casesArray: ICase[] = [];
      for (const tempCase of req.body.cases) {
        const checkCasePayment = await caseUtil.checkCasePayment(tempCase);
        if (!checkCasePayment[0]) return checkCasePayment;
        const caseCreated = await caseUtil.createCase(
          tempCase,
          reqTemp.role,
          reqTemp.email
        );
        casesArray.push(caseCreated);
      }
      if (!casesArray.length)
        return [false, constantsUtil.failureAddMessage('cases')];
      return [true, casesArray];
    }
    const checkCasePayment = await caseUtil.checkCasePayment(req.body);
    if (!checkCasePayment[0]) return checkCasePayment;
    const caseCreated = await caseUtil.createCase(
      req.body,
      reqTemp.role,
      reqTemp.email
    );
    if (!caseCreated) return [false, constantsUtil.failureAddMessage('case')];
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

  updateCase = async (
    req: Request
  ): Promise<[boolean, Partial<ICase> | string]> => {
    await caseUtil.updateContacts(req.body.debtor.contacts as IContact[]);
    await caseUtil.updateDebtor(req.body.debtor as IDebtor);
    await caseUtil.updateContacts(req.body.creditor.contacts as IContact[]);
    await caseUtil.updateCreditor(req.body.creditor as ICreditor);
    delete req.body.debtor;
    delete req.body.creditor;
    const caseUpdated = await this.caseRepository.updateById<ICase>(
      req.params.id,
      req.body
    );
    if (!caseUpdated) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    return [true, caseUpdated];
  };
}

export default CaseService;
