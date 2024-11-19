"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inbox_repository_1 = require("../api/repository/inbox/inbox.repository");
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
    formatInboxData(inbox) {
        const fromArray = [];
        for (let message of inbox) {
            if (message.from && fromArray.indexOf(message.from) === -1) {
                fromArray.push(message.from);
            }
        }
        let fromObj = {};
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
exports.default = new InboxUtil();
//# sourceMappingURL=inbox.utils.js.map