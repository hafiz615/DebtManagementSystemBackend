"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inbox_repomodel_1 = require("../database/repomodels/inbox.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
const lodash_1 = __importDefault(require("lodash"));
const upload_util_1 = __importDefault(require("./upload.util"));
const common_util_1 = __importDefault(require("./common.util"));
class InboxUtil {
    constructor() {
        this.uploadUtil = new upload_util_1.default();
    }
    async getAllInboxFilters(req) {
        const filters = {};
        if (req.query.search === 'true') {
            const text = req.body.text;
            if (text) {
                filters['$or'] = [
                    { subject: { $regex: text, $options: 'i' } },
                    { caseCode: { $regex: text, $options: 'i' } },
                    { from: { $regex: text, $options: 'i' } },
                    { to: { $regex: text, $options: 'i' } },
                    { creditorCompanyName: { $regex: text, $options: 'i' } },
                    { debtorCompanyName: { $regex: text, $options: 'i' } },
                    { negotiatorName: { $regex: text, $options: 'i' } },
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
    formatInboxData(inbox, userName, type) {
        const result = { userName };
        if (type === 'default') {
            ['draft', 'sent', 'received'].forEach(defaultType => {
                result[defaultType] = [];
                result[`${defaultType}Count`] = 0;
            });
        }
        else {
            result[type] = [];
            result[`${type}Count`] = 0;
        }
        inbox.forEach((email) => {
            const validTypes = type === 'default' ? ['draft', 'sent', 'received'] : [type];
            if (validTypes.includes(email.type)) {
                result[email.type].push(email);
                result[`${email.type}Count`] += 1;
            }
        });
        return result;
    }
    async prepareCreateDraft(data, caseData, userId, files) {
        let { sendTo, content } = data;
        const newDraft = new inbox_repomodel_1.Inbox();
        const filesData = await this.uploadUtil.awsS3FileUpload(files, false);
        for (const obj of filesData) {
            const mimeType = common_util_1.default.getMimeType(obj.key);
            obj.url = await this.uploadUtil.getS3FileSignedUrl(obj.key, mimeType, 60 * 60 * 24 * 365 * 10, process.env.s3BucketName);
        }
        const uniqueAttachments = lodash_1.default.uniqBy(filesData, item => `${item.key}-${item.originalFileName}`);
        const validateDraft = await this.prepareDraft(data, newDraft, sendTo, content, uniqueAttachments, caseData, userId);
        return validateDraft;
    }
    async prepareDraft(data, updateDraft, sendTo, content, filesData, caseData, userId) {
        updateDraft.to = sendTo;
        updateDraft.userId = userId;
        updateDraft.text = content;
        updateDraft.textAsHtml = content;
        updateDraft.attachments = filesData;
        if (caseData) {
            updateDraft.caseCode = caseData.caseCode;
            updateDraft.debtorCompanyName =
                caseData.debtor.businessInformation.companyName;
            updateDraft.creditorCompanyName =
                caseData.creditor.businessInformation.companyName;
            updateDraft.negotiatorName = caseData.negotiator;
        }
        updateDraft.medium = 'EMAIL';
        const preparedDraft = dataCopier_util_1.DataCopier.copy(updateDraft, data);
        return preparedDraft;
    }
    async prepareUpdateDraft(updateDraft, data, caseData, userId, files) {
        let { sendTo, content, removedFiles } = data;
        if (typeof removedFiles === 'string') {
            removedFiles = JSON.parse(removedFiles);
        }
        let updatedExistingFiles = updateDraft.attachments || [];
        if (removedFiles) {
            updatedExistingFiles = updatedExistingFiles.filter((file) => !removedFiles.some((removed) => removed.key === file.key));
        }
        const filesData = await this.uploadUtil.awsS3FileUpload(files, false);
        for (const obj of filesData) {
            const mimeType = common_util_1.default.getMimeType(obj.key);
            obj.url = await this.uploadUtil.getS3FileSignedUrl(obj.key, mimeType, 60 * 60 * 24 * 365 * 10, process.env.s3BucketName);
        }
        const allFilesData = [...updatedExistingFiles, ...filesData];
        const uniqueAttachments = lodash_1.default.uniqBy(allFilesData, item => `${item.key}-${item.originalFileName}`);
        const validateDraft = await this.prepareDraft(data, updateDraft, sendTo, content, uniqueAttachments, caseData, userId);
        return validateDraft;
    }
}
exports.default = new InboxUtil();
//# sourceMappingURL=inbox.utils.js.map