"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const draft_repository_1 = require("../api/repository/draft/draft.repository");
const draft_repomodel_1 = require("../database/repomodels/draft.repomodel");
const dataCopier_util_1 = require("../utils/dataCopier.util");
class DraftUtil {
    constructor() {
        this.draftRepository = new draft_repository_1.DraftRepository();
    }
    async getAllDraftFilters(req) {
        const reqTemp = req;
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
    formatDraftData(draft) {
        const fromArray = [];
        for (let message of draft) {
            if (message.creditorCompanyName &&
                fromArray.indexOf(message.creditorCompanyName) === -1) {
                fromArray.push(message.creditorCompanyName);
            }
        }
        let fromObj = {};
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
    createDraft(data, caseData, userId) {
        const newDraft = new draft_repomodel_1.Draft();
        newDraft.userId = userId;
        newDraft.caseCode = caseData.caseCode;
        newDraft.caseId = caseData._id;
        newDraft.debtorCompanyName = caseData.debtor.businessInformation.companyName;
        newDraft.creditorCompanyName = caseData.creditor.businessInformation.companyName;
        newDraft.negotiatorName = caseData.negotiator;
        const validateDraft = dataCopier_util_1.DataCopier.copy(newDraft, data);
        return validateDraft;
    }
}
exports.default = new DraftUtil();
//# sourceMappingURL=draft.util.js.map