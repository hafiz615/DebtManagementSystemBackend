"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
class CreditorUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
    }
    async checkCreditorsMapping(creditorsArray) {
        for (const creditor of creditorsArray) {
            const accountTitles = creditor.accountTitleMapping
                ? creditor.accountTitleMapping
                : [];
            const accTitleObj = accountTitles.find(temp => {
                return temp.caseId === creditor.caseId;
            });
            if (accTitleObj && accTitleObj?.accountTitle)
                creditor.creditorAccountTitle = accTitleObj?.accountTitle;
            if (!accTitleObj && creditor.creditorAccountTitle) {
                accountTitles.push({
                    caseId: String(creditor.caseId),
                    accountTitle: creditor.creditorAccountTitle,
                });
                creditor.accountTitleMapping = accountTitles;
                await this.creditorRepository.updateById(creditor.creditorId, {
                    accountTitleMapping: accountTitles,
                });
            }
        }
        return creditorsArray;
    }
}
exports.default = new CreditorUtil();
//# sourceMappingURL=creditor.util.js.map