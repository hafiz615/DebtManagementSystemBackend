import {Request} from 'express';
import {InboxRepository} from '../api/repository/inbox/inbox.repository';

class InboxUtil {
  private inboxRepository: InboxRepository;

  constructor() {
    this.inboxRepository = new InboxRepository();
  }

  async getAllInboxFilters(req: Request) {
    const reqTemp: any = req;
    const filters = {};

    if (req.query.search === 'true') {
      const text = req.body.text;
      if (text) {
        filters['$or'] = [
          {name: {$regex: text, $options: 'i'}},
          {subject: {$regex: text, $options: 'i'}},
          {caseCode: {$regex: text, $options: 'i'}},
          {text: {$regex: text, $options: 'i'}},
          {textAsHtml: {$regex: text, $options: 'i'}},
          {from: {$regex: text, $options: 'i'}},
          {to: {$regex: text, $options: 'i'}},
          {creditorCompanyName: {$regex: text, $options: 'i'}},
          {debitorCompanyName: {$regex: text, $options: 'i'}},
          {negotiatorName: {$regex: text, $options: 'i'}},
        ];
      }
    }
    if (req.query.filter === 'true') {
      const filter = req.body.filter;
      if (filter && filter.caseCode) {
        filters['caseCode'] = filter.caseCode;
      }
      if (filter && filter.debitorCompanyName) {
        filters['debitorCompanyName'] = filter.debitorCompanyName;
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
}
export default new InboxUtil();
