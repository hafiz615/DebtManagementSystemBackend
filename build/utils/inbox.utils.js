"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inbox_repository_1 = require("../api/repository/inbox/inbox.repository");
const inbox_repomodel_1 = require("../database/repomodels/inbox.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
class InboxUtil {
    constructor() {
        this.inboxRepository = new inbox_repository_1.InboxRepository();
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
            userName: userName
        });
        return result;
    }
    createDraft(data, text, caseData, userId) {
        const newDraft = new inbox_repomodel_1.Inbox();
        newDraft.userId = userId;
        newDraft.text = text;
        if (caseData) {
            newDraft.caseCode = caseData.caseCode;
            newDraft.debtorCompanyName = caseData.debtor.businessInformation.companyName;
            newDraft.creditorCompanyName = caseData.creditor.businessInformation.companyName;
            newDraft.negotiatorName = caseData.negotiator;
        }
        const validateDraft = dataCopier_util_1.DataCopier.copy(newDraft, data);
        return validateDraft;
    }
}
exports.default = new InboxUtil();
//# sourceMappingURL=inbox.utils.js.map