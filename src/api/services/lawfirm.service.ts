import {Request} from 'express';
import constants from '../../utils/constants.util';
import constantsUtil from '../../utils/constants.util';
import commonUtil from '../../utils/common.util';
import dotenv from 'dotenv';
import {LawfirmRepository} from '../repository/lawfirm/lawfirm.repository';
import LawfirmUtil from '../../utils/lawfirm.util';
import AttorneyUtil from '../../utils/attorney.util';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import {ILawfirm} from '../../database/interfaces/lawfirm.interface';
import {AttorneyRepository} from '../repository/attorney/attorney.repository';
import {LawsuitRepository} from '../repository/lawsuit/lawsuit.repository';
import {ILawsuit} from '../../database/interfaces/lawsuit.interface';
import lawsuitUtil from '../../utils/lawsuit.util';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import {Lawsuit} from '../../database/repomodels/lawsuit.repomodel';
import attorneyUtil from '../../utils/attorney.util';

dotenv.config();

class LawfirmService {
  private lawfirmRepository: LawfirmRepository;
  private debtorRepository: DebtorRepository;
  private attorneyRepository: AttorneyRepository;
  private lawsuitRepository: LawsuitRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.lawfirmRepository = new LawfirmRepository();
    this.debtorRepository = new DebtorRepository();
    this.attorneyRepository = new AttorneyRepository();
    this.lawsuitRepository = new LawsuitRepository();
    this.caseRepository = new CaseRepository();
  }

  createLawfirm = async (req: Request) => {
    const reqTemp: any = req;
    const platform = req.query.platform ?? true;

    req.body.lawfirm = {...req.body.lawfirm, platform, userId: reqTemp.id};
    req.body.attorney = {...req.body.attorney, platform, userId: reqTemp.id};

    const lawfirmExist = await this.lawfirmRepository.getOne<ILawfirm>({
      name: req.body.lawfirm.name,
    });

    if (lawfirmExist) return [false, constants.alreadyExistsMessage('Lawfirm')];

    const attorneyExist = await this.attorneyRepository.getOne<ILawfirm>({
      SSN: req.body.attorney.SSN,
    });

    if (attorneyExist)
      return [false, constants.alreadyExistsMessage('Attorney')];

    const lawfirm = await LawfirmUtil.createLawfirm(req.body.lawfirm);
    console.log('lawfirm: ', lawfirm);

    if (!lawfirm) return [false, constants.failureRegisterMessage('Lawfirm')];

    req.body.attorney.lawfirmId = lawfirm._id;
    const attorney = await AttorneyUtil.createAttorney(req.body.attorney);
    if (!attorney) return [false, constants.failureRegisterMessage('Attorney')];

    const lawsuitData = {
      lawfirmId: lawfirm._id,
      attorneyId: attorney._id,
      debtorId: reqTemp.params.id,
      userId: reqTemp.id,
    };

    const lawsuit = await lawsuitUtil.createLawsuit(lawsuitData);

    return [true, []];
  };

  updateLawfirm = async (req: Request) => {
    req.body.lawfirmFee = req.body?.monthly_subscription_fee;
    const updateData = {...req.body, updatedAt: commonUtil.getCurrentDate()};
    const lawfirm = await this.lawfirmRepository.updateById<ILawfirm>(
      req.params.id,
      updateData
    );

    if (!lawfirm) {
      return [false, constants.notFoundMessage('Lawfirm')];
    }
    return [true, []];
  };

  getLawfirm = async (req: Request) => {
    const lawfirms =
      await this.lawfirmRepository.getAllWithoutPagination<ILawfirm>({
        isDeleted: {$ne: true},
      });

    return lawfirms
      ? [true, lawfirms]
      : [true, constants.notFoundMessage('Lawfirms')];
  };

  assignLawfirmToCase = async (req: Request) => {
    const reqTemp: any = req;

    const caseTemp: any = await this.caseRepository.getById<ICase>(
      req.params.id,
      undefined,
      undefined,
      ['debtor', 'creditor']
    );

    if (!caseTemp) return [false, constants.notFoundMessage('Case')];

    const lawFirm = await this.lawfirmRepository.getById<ILawfirm>(
      req.body.lawfirmId
    );

    if (!lawFirm) return [false, constants.notFoundMessage('lawfirm')];

    const lawSuit = new Lawsuit();
    lawSuit.debtorId = caseTemp.debtor._id;
    lawSuit.creditorId = caseTemp.creditor._id;
    lawSuit.lawfirmId = req.body.lawfirmId;
    lawSuit.lawfirmCompanyName = lawFirm.lawfirmCompanyName;
    lawSuit.userId = reqTemp.id;
    lawSuit.defendentCompanyName =
      caseTemp.debtor.businessInformation.companyName;
    lawSuit.plantiffCompanyName =
      caseTemp.creditor.businessInformation.companyName;
    await this.lawsuitRepository.create<ILawsuit>(lawSuit as any);
    const updatedCase = await this.caseRepository.updateById<ICase>(
      req.params.id,
      {dummyLawsuitExist: true}
    );

    return updatedCase
      ? [true, []]
      : [false, constants.failureAddMessage('Lawfirm')];
  };

  async updateLawsuit(req: Request) {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);

    if (!caseTemp) return [false, constants.notFoundMessage('Case')];

    const lawsuit = await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        debtorId: caseTemp.debtor,
        creditorId: caseTemp.creditor,
        isDeleted: {$ne: true},
      },
      req.body
    );

    if (!lawsuit) return [false, constants.failureUpdateMessage('lawsuit')];

    return [true, []];
  }

  async addAttorney(req: Request) {
    let reqTemp: any = req;
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) return [false, constants.notFoundMessage('Case')];

    req.body.userId = reqTemp.id;
    const attorney = await attorneyUtil.createAttorney(req.body);
    if (!attorney) return [false, constants.failureAddMessage('attorney')];

    await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        debtorId: caseTemp.debtor,
        creditorId: caseTemp.creditor,
      },
      {attorneyId: attorney._id}
    );
    return [true, []];
  }
}

export default LawfirmService;
