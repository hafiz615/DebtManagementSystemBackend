import {Request} from 'express';
import { DraftRepository } from '../api/repository/draft/draft.repository';
import { Draft } from '../database/repomodels/draft.repomodel';
import { DataCopier } from '../utils/dataCopier.util'; 
class DraftUtil {
  private draftRepository: DraftRepository;

  constructor() {
    this.draftRepository = new DraftRepository();
  }

  async getAllDraftFilters(req: Request) {
    const reqTemp: any = req;
    const filters = {};

    if (req.query.search === 'true') {
      const text = req.body.text;
      if (text) {
        filters['$or'] = [
          {subject: {$regex: text, $options: 'i'}},
          {caseCode: {$regex: text, $options: 'i'}},
          {from: {$regex: text, $options: 'i'}},
          {to: {$regex: text, $options: 'i'}},
          {creditorCompanyName: {$regex: text, $options: 'i'}},
          {debtorCompanyName: {$regex: text, $options: 'i'}},
          {negotiatorName: {$regex: text, $options: 'i'}},
        ];
      }
    }
    if (req.query.filter === 'true') {
      const filter = req.body.filter;
      if (filter && filter.caseCode) {
        filters['caseCode'] = filter.caseCode;
      }
      if (filter && filter.debtorCompanyName) {
        filters['debtorCompanyName'] = filter.debtorCompanyName;
      }
      if (filter && filter.creditorCompanyName) {
        filters['creditorCompanyName'] = filter.creditorCompanyName;
      }
      if (filter && filter.negotiatorName) {
        filters['negotiatorName'] = filter.negotiatorName;
      }
      if(filter && filter.userId){
        filters['userId'] = filter.userId;
      }
    }
    return filters;
  }
  formatDraftData(draft: any) {
    const fromArray: string[] = [];

    for (let message of draft) {
      if (
        message.creditorCompanyName &&
        fromArray.indexOf(message.creditorCompanyName) === -1
      ) {
        fromArray.push(message.creditorCompanyName);
      }
    }

    let fromObj: {[key: string]: any[]} = {};

    for (let message of draft) {
      if (message.creditorCompanyName) {
        if (!fromObj[message.creditorCompanyName]) {
          fromObj[message.creditorCompanyName] = [];
        }
        fromObj[message.creditorCompanyName].push(message);
      }
    }

    return fromObj;
  }

  createDraft(data: any, caseData: any, userId: string){
    const newDraft= new Draft();
    newDraft.userId = userId;
    newDraft.caseCode = caseData.caseCode;
    newDraft.caseId = caseData._id;
    newDraft.debtorCompanyName = caseData.debtor.businessInformation.companyName;
    newDraft.creditorCompanyName = caseData.creditor.businessInformation.companyName;
    newDraft.negotiatorName = caseData.negotiator;
    const validateDraft = DataCopier.copy(newDraft, data);
    return validateDraft;
  }
}
export default new DraftUtil();
