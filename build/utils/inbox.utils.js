"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inbox_repomodel_1 = require("../database/repomodels/inbox.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
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
        const validTypes = type === 'default' ? ['draft', 'sent', 'received'] : [type];
        const result = inbox.reduce((acc, email) => {
            if (validTypes.includes(email.type)) {
                if (!acc[email.type]) {
                    acc[email.type] = [];
                    acc[`${email.type}Count`] = 0;
                }
                acc[email.type].push(email);
                acc[`${email.type}Count`] += 1;
            }
            return acc;
        }, {
            userName: userName,
        });
        return result;
    }
    async createDraft(data, caseData, userId, files) {
        let { sendTo, content } = data;
        const newDraft = new inbox_repomodel_1.Inbox();
        const filesData = await this.uploadUtil.awsS3FileUpload(files, false);
        for (const obj of filesData) {
            const mimeType = common_util_1.default.getMimeType(obj.key);
            obj.url = await this.uploadUtil.getS3FileSignedUrl(obj.key, mimeType, 60 * 60 * 24 * 365 * 10, process.env.s3BucketName);
        }
        newDraft.to = sendTo;
        newDraft.userId = userId;
        newDraft.text = content;
        newDraft.textAsHtml = content;
        newDraft.attachments = filesData;
        if (caseData) {
            newDraft.caseCode = caseData.caseCode;
            newDraft.debtorCompanyName =
                caseData.debtor.businessInformation.companyName;
            newDraft.creditorCompanyName =
                caseData.creditor.businessInformation.companyName;
            newDraft.negotiatorName = caseData.negotiator;
        }
        const validateDraft = dataCopier_util_1.DataCopier.copy(newDraft, data);
        return validateDraft;
    }
}
exports.default = new InboxUtil();
//# sourceMappingURL=inbox.utils.js.map