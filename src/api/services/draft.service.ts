import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import dotenv from 'dotenv';
import {DraftRepository} from '../repository/draft/draft.repository';
import {CaseRepository} from '../repository/case/case.repository';
import draftUtil from '../../utils/draft.util';
import { IDraft } from '../../database/interfaces/draft.interface';
import { ICase } from '../../database/interfaces/case.interface';
import commonUtil from '../../utils/common.util';
dotenv.config();

class DraftService {
  protected draftRepository: DraftRepository;
  protected caseRepository: CaseRepository;
  constructor() {
    this.draftRepository = new DraftRepository();
    this.caseRepository = new CaseRepository();
  }

  async getAllDraftMessages(req: Request) {
    const reqTemp: any = req;
    const filters = (Object.keys(await draftUtil.getAllDraftFilters(req))).length ? await draftUtil.getAllDraftFilters(req) : { userId: reqTemp.id };
    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    let draft = await this.draftRepository.getAll<IDraft>( filters,
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      undefined, 
      pageLimit.page,
      pageLimit.limit                                          
    );
    const formattedData = draftUtil.formatDraftData(draft);

    if (!draft.length) {
      return [false, constantsUtil.notFoundMessage('Draft')];
    }
    return [true, formattedData];
  }

  async createEmailDraft(req: Request) {
    const reqTemp: any = req;
    const caseData: any = await this.caseRepository.getById<ICase>(
              req.params.caseId,
              undefined,
              undefined,
              [
                {path: 'debtor', select: ['businessInformation.companyName']},
                {path: 'creditor', select: ['businessInformation.companyName']},
              ]
    );
    if (!caseData) {
      return [false, constantsUtil.notFoundMessage('Case')];
    }
    
    const validateDraft = draftUtil.createDraft(req.body,caseData, reqTemp.id, )
    const result = await this.draftRepository.create<IDraft>(validateDraft);
      if (!result) {
        return [false, constantsUtil.failureAddMessage('draft')];
      }
    return [true, result];
  }

}

export default DraftService;
