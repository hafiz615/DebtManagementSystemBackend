import {Request} from 'express';
import {InboxRepository} from '../api/repository/inbox/inbox.repository';
import {Inbox} from '../database/repomodels/inbox.repomodel';
import {DataCopier} from './dataCopier.util';
import {IKeyFile} from '../database/interfaces/debtor.interface';
import _ from 'lodash';
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
      if (filter && filter.userId) {
        filters['userId'] = filter.userId;
      }
    }
    return filters;
  }

  formatInboxData(inbox: any, userName: string, type: any) {
    const result: any = {userName};

    if (type === 'default') {
      ['draft', 'sent', 'received'].forEach(defaultType => {
        result[defaultType] = [];
        result[`${defaultType}Count`] = 0;
      });
    } else {
      result[type] = [];
      result[`${type}Count`] = 0;
    }

    inbox.forEach((email: any) => {
      const validTypes =
        type === 'default' ? ['draft', 'sent', 'received'] : [type];
      if (validTypes.includes(email.type)) {
        result[email.type].push(email);
        result[`${email.type}Count`] += 1;
      }
    });

    return result;
  }

  async prepareCreateDraft(
    data: any,
    caseData: any,
    userId: string,
    files: any
  ) {
    let {sendTo, content} = data;
    const newDraft = new Inbox();
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

    const uniqueAttachments = _.uniqBy(
      filesData,
      item => `${item.key}-${item.originalFileName}`
    );
    const validateDraft = await this.prepareDraft(
      data,
      newDraft,
      sendTo,
      content,
      uniqueAttachments,
      caseData,
      userId
    );
    return validateDraft;
  }

  async prepareDraft(
    data: any,
    updateDraft: any,
    sendTo: string,
    content: string,
    filesData: any,
    caseData: any,
    userId: string
  ) {
    updateDraft.to = sendTo;
    updateDraft.userId = userId;
    updateDraft.text = content;
    updateDraft.textAsHtml = content;
    updateDraft.attachments = filesData as any;
    if (caseData) {
      updateDraft.caseCode = caseData.caseCode;
      updateDraft.debtorCompanyName =
        caseData.debtor.businessInformation.companyName;
      updateDraft.creditorCompanyName =
        caseData.creditor.businessInformation.companyName;
      updateDraft.negotiatorName = caseData.negotiator;
    }
    const preparedDraft = DataCopier.copy(updateDraft, data);
    return preparedDraft;
  }

  async prepareUpdateDraft(
    updateDraft: any,
    data: any,
    caseData: any,
    userId: string,
    files: any
  ) {
    let {sendTo, content, removedFiles} = data;

    if (typeof removedFiles === 'string') {
      removedFiles = JSON.parse(removedFiles);
    }
    let updatedExistingFiles = updateDraft.attachments || [];
    if (removedFiles) {
      updatedExistingFiles = updatedExistingFiles.filter(
        (file: any) =>
          !removedFiles.some((removed: any) => removed.key === file.key)
      );
    }
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
    const allFilesData = [...updatedExistingFiles, ...filesData];
    const uniqueAttachments = _.uniqBy(
      allFilesData,
      item => `${item.key}-${item.originalFileName}`
    );
    const validateDraft = await this.prepareDraft(
      data,
      updateDraft,
      sendTo,
      content,
      uniqueAttachments,
      caseData,
      userId
    );
    return validateDraft;
  }
}
export default new InboxUtil();
