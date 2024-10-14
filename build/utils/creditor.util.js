"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const case_repository_1 = require("../api/repository/case/case.repository");
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const common_util_1 = __importDefault(require("./common.util"));
class CreditorUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
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
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
        }
        return creditorsArray;
    }
    async getCreditorsEmailForDebtor(debtorId, creditorId = '') {
        const match = {
            debtor: new mongoose_1.default.Types.ObjectId(debtorId),
        };
        if (creditorId) {
            match['creditor'] = { $ne: new mongoose_1.default.Types.ObjectId(creditorId) };
        }
        return await this.caseRepository.applyAggregate([
            {
                $match: match, // Filter for a specific debtor
            },
            {
                $group: {
                    _id: '$creditor', // Group by creditor to get unique creditors
                },
            },
            {
                $lookup: {
                    from: 'creditors', // Name of the creditors collection
                    localField: '_id', // Field in the cases (creditor reference)
                    foreignField: '_id', // Field in the creditors collection (creditor _id)
                    as: 'creditorDetails', // Output field containing the matched creditor details
                },
            },
            {
                $unwind: '$creditorDetails', // Unwind the creditorDetails array to get individual creditor details
            },
            {
                $project: {
                    _id: 1, // Exclude the default _id field
                    creditorEmail: '$creditorDetails.basicInformation.email', // Include creditor's email
                    creditorName: '$creditorDetails.basicInformation.fullName',
                },
            },
        ]);
    }
    async addBreakEven(creditors) {
        for (const creditor of creditors) {
            const fundedAmount = 0;
            const paidBack = creditor.remainingAmountPaid;
            const currentBalance = fundedAmount - paidBack;
            let breakEven = fundedAmount * 1.2 - paidBack;
            if (breakEven <= 0)
                breakEven = currentBalance * 0.3;
            creditor['breakEven'] = breakEven;
        }
    }
    async addCreditorPercentagesAndGetPercentageCommission(creditors, debtor) {
        const totalRemaining = creditors.reduce((sum, item) => sum + item.remaining, 0);
        for (const creditor of creditors) {
            const percentage = (creditor.remaining / totalRemaining) * debtor.weeklyBudgetStrategy3;
            creditor.percentageReceivable = Math.round(percentage * 100) / 100;
            creditor.percentageReceivableAmount =
                creditor.percentageReceivable * creditor.remaining;
        }
        const percentageReceivableCommission = (debtor.totalCommission / (totalRemaining + debtor.totalCommission)) *
            debtor.weeklyBudgetStrategy3;
        console.log(percentageReceivableCommission, 'percentageReceivableCommission');
        return Math.round(percentageReceivableCommission * 100) / 100;
    }
}
exports.default = new CreditorUtil();
//# sourceMappingURL=creditor.util.js.map