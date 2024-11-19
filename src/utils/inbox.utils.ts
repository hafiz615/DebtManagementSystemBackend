import {Request} from 'express';
import {InboxRepository} from '../api/repository/inbox/inbox.repository';

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
      if (filter && filter.debitorCompanyName) {
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
  formatInboxData(inbox: any){
    const fromArray: string[] = [];

    for (let message of inbox) {
        if (message.from && fromArray.indexOf(message.from) === -1) {
            fromArray.push(message.from);
        }
    }

    let fromObj: { [key: string]: any[] } = {};

    for (let message of inbox) {
        if (message.from) {
            if (!fromObj[message.from]) {
                fromObj[message.from] = [];
            }
            fromObj[message.from].push(message);
        }
    }

    return fromObj;

  }
}
export default new InboxUtil();
