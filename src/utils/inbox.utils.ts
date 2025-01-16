import {Request} from 'express';
import {InboxRepository} from '../api/repository/inbox/inbox.repository';
import { Inbox } from '../database/repomodels/inbox.repomodel';
import { DataCopier } from './dataCopier.util';
import { IKeyFile } from '../database/interfaces/debtor.interface';
import UploadUtil from './upload.util';
import commonUtil from './common.util';

class InboxUtil {
  private uploadUtil: UploadUtil;
  constructor() {
    this.uploadUtil = new UploadUtil();
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

  async createDraft(data: any, caseData: any, userId: string, files: any){
    let { sendTo,  content} = data;
    const newDraft= new Inbox();
    const filesData: IKeyFile[] = await this.uploadUtil.awsS3FileUpload(
              files,
              false
            );
    for (const obj of filesData) {
      const mimeType = commonUtil.getMimeType(obj.key);
      obj.url = await this.uploadUtil.getS3FileSignedUrl(
        obj.key,
        mimeType,
        60 * 60 * 24 * 365 * 10,
        process.env.s3BucketName
      );
    }
    
    newDraft.to = sendTo;
    newDraft.userId = userId;
    newDraft.text = content;
    newDraft.textAsHtml = content;
    newDraft.attachments = filesData as any ;
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
