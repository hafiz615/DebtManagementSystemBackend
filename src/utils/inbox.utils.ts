import {Request} from 'express';
import {InboxRepository} from '../api/repository/inbox/inbox.repository';
import { Inbox } from '../database/repomodels/inbox.repomodel';
import { DataCopier } from './dataCopier.util';

class InboxUtil {
  private inboxRepository: InboxRepository;

  constructor() {
    this.inboxRepository = new InboxRepository();
  }

  async getAllInboxFilters(req: Request) {
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
    }
    return filters;
  }
  formatInboxData(inbox: any) {
    const fromArray: string[] = [];

    for (let message of inbox) {
      if (
        message.creditorCompanyName &&
        fromArray.indexOf(message.creditorCompanyName) === -1
      ) {
        fromArray.push(message.creditorCompanyName);
      }
    }

    let fromObj: {[key: string]: any[]} = {};

    for (let message of inbox) {
      if (message.creditorCompanyName) {
        if (!fromObj[message.creditorCompanyName]) {
          fromObj[message.creditorCompanyName] = [];
        }
        fromObj[message.creditorCompanyName].push(message);
      }
    }

    return fromObj;
  }

  createDraft(data: any, text: string, caseData: any, userId: string){
      const newDraft= new Inbox();
      newDraft.userId = userId;
      newDraft.text = text;
      if(caseData){
        newDraft.caseCode = caseData.caseCode;
        newDraft.debtorCompanyName = caseData.debtor.businessInformation.companyName;
        newDraft.creditorCompanyName = caseData.creditor.businessInformation.companyName;
        newDraft.negotiatorName = caseData.negotiator;
      }
      const validateDraft = DataCopier.copy(newDraft, data);
      return validateDraft;
    }
}
export default new InboxUtil();
