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
      if(filter && filter.userId){
        filters['userId'] = filter.userId;
      }
    }
    return filters;
  }

  formatInboxData(inbox: any, userName: string, type: any) {
    const validTypes = type === 'default' ? ['draft', 'sent', 'received'] : [type];
    const result = inbox.reduce(
      (acc: any, email: any) => {
        if (validTypes.includes(email.type)) {
          if (!acc[email.type]) {
            acc[email.type] = [];
            acc[`${email.type}Count`] = 0;
          }
          acc[email.type].push(email);
          acc[`${email.type}Count`] += 1;
        }
        return acc;
      },
      {
        userName: userName
      }
    );
    return result;
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
