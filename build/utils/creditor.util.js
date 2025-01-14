"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const case_repository_1 = require("../api/repository/case/case.repository");
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const common_util_1 = __importDefault(require("./common.util"));
const case_util_1 = __importDefault(require("./case.util"));
const moneyThumb_util_1 = __importDefault(require("./moneyThumb.util"));
const strategy_repository_1 = require("../api/repository/strategy/strategy.repository");
class CreditorUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.strategyRepository = new strategy_repository_1.StrategyRepository();
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
            const contractDetails = creditor.contractDetails;
            let amount = 0;
            if (contractDetails?.funded_amount) {
                amount = case_util_1.default.getCleanAmount(contractDetails?.funded_amount);
            }
            else if (contractDetails?.loan_amount) {
                amount = case_util_1.default.getCleanAmount(contractDetails?.loan_amount);
            }
            const paidBack = creditor.previousAmountPaid;
            const currentBalance = creditor.totalDebt - paidBack;
            let breakEven = amount * 1.2 - paidBack;
            if (breakEven <= 0)
                breakEven = currentBalance * 0.3;
            if (breakEven < 0)
                breakEven = 0;
            creditor['breakEven'] = parseFloat(breakEven.toFixed(2));
        }
    }
    async addCreditorPercentagesAndGetPercentageCommission(creditors, debtor, scoreCard) {
        const accounts = scoreCard['accountslist'];
        let trueCredit = 0;
        if (accounts.data.length) {
            trueCredit = await moneyThumb_util_1.default.getWeeklyTrueCredit(accounts);
        }
        let totalRemaining = creditors.reduce((sum, item) => sum + item.remaining, 0);
        const weeklyBudgetStrategy3 = debtor?.weeklyBudgetStrategy3
            ? debtor.weeklyBudgetStrategy3
            : 0;
        let popup1Value = 0;
        if (debtor.weeklyBudgetKeyStrategy1 === 'strategy1Profit') {
            popup1Value = debtor.weeklyBudgetStrategy1;
        }
        else {
            const percent80 = debtor.weeklyBudgetStrategy1 * 0.8;
            popup1Value = percent80;
        }
        const aggressionData = await this.getCreditorWithAggression(creditors);
        for (const creditor of creditors) {
            const creditorPer = creditor.remaining / totalRemaining;
            creditor.maxProfitAmount =
                Math.round(creditorPer * popup1Value * 100) / 100;
            const percentage = creditorPer * weeklyBudgetStrategy3;
            creditor.percentageReceivable = Math.round(percentage * 100) / 100;
            creditor.percentageReceivableAmount = parseFloat(((creditor.percentageReceivable / 100) * trueCredit).toFixed(2));
        }
        if (Object.keys(aggressionData).length) {
            await this.aggressionAdjustment(creditors, aggressionData, popup1Value);
        }
        let maxProfitCommission = 0;
        if (debtor.weeklyBudgetKeyStrategy1 === 'strategy1Profit') {
            maxProfitCommission = debtor.trueProfit * 0.2;
        }
        else {
            maxProfitCommission = debtor.weeklyBudgetStrategy1 * 0.2;
        }
        let receivableCommission = 0;
        if (debtor.weeklyBudgetKeyStrategy3 === 'strategy3Profit') {
            receivableCommission = debtor.trueProfit * 0.2;
        }
        else {
            const factor = ((debtor.weeklyBudgetStrategy3 / 0.8) * 0.2) / 100;
            receivableCommission = debtor.trueProfit * factor;
        }
        return [
            20,
            parseFloat(maxProfitCommission.toFixed(2)),
            parseFloat(receivableCommission.toFixed(2)),
        ];
    }
    async getCreditorWithAggression(creditors) {
        let data = {};
        if (creditors.length > 1) {
            for (const creditor of creditors) {
                if (creditor.aggression > 5)
                    switch (creditor.aggression) {
                        case 6:
                            data['creditorAccountTitle'] = creditor.creditorAccountTitle;
                            data['value'] = 0.05;
                            break;
                        case 7:
                            data['creditorAccountTitle'] = creditor.creditorAccountTitle;
                            data['value'] = 0.1;
                            break;
                        case 8:
                            data['creditorAccountTitle'] = creditor.creditorAccountTitle;
                            data['value'] = 0.15;
                            break;
                        case 9:
                            data['creditorAccountTitle'] = creditor.creditorAccountTitle;
                            data['value'] = 0.2;
                            break;
                        case 10:
                            data['creditorAccountTitle'] = creditor.creditorAccountTitle;
                            data['value'] = 0.25;
                            break;
                    }
            }
        }
        return data;
    }
    async aggressionAdjustment(creditors, data, value) {
        const amountToBeAdded = parseFloat((value * data.value).toFixed(2));
        const amountToBeSubtracted = parseFloat((amountToBeAdded / (creditors.length - 1)).toFixed(2));
        for (const creditor of creditors) {
            if (creditor.creditorAccountTitle === data.creditorAccountTitle) {
                creditor.maxProfitAmount += amountToBeAdded;
            }
            else {
                creditor.maxProfitAmount -= amountToBeSubtracted;
            }
        }
    }
    async addWeeklyTrueAmount(creditors, settlementRange) {
        if (settlementRange.percentage_settlement_over_weekly_true_revenue) {
            const settlementWeeklyRevenue = settlementRange.percentage_settlement_over_weekly_true_revenue;
            for (const creditor of creditors) {
                if (settlementWeeklyRevenue[creditor.creditorAccountTitle]) {
                    const recommendations = settlementWeeklyRevenue[creditor.creditorAccountTitle];
                    const recommendation1 = recommendations['recommendation 1'];
                    const amount = (recommendation1.max / 100) * settlementRange.weekly_true_revenue;
                    creditor.weeklyTrueRevenueAmount = Math.round(amount * 100) / 100;
                }
                else {
                    creditor.weeklyTrueRevenueAmount = 0;
                }
            }
        }
    }
    async replaceSettlementRangeAndWeeksTillPaid(creditors, settlementRange, caseId, save) {
        let newWeeks = [];
        let newAmount = 0;
        let newWeeksMin = [];
        let newAmountMin = 0;
        for (const creditor of creditors) {
            if (settlementRange.settlement_range &&
                settlementRange.settlement_range[creditor.creditorAccountTitle]) {
                settlementRange.settlement_range[creditor.creditorAccountTitle]['recommendation 1'].max = creditor.maxProfitAmount;
                let minAmount = parseFloat((creditor.maxProfitAmount - creditor.maxProfitAmount * 0.2).toFixed(2));
                settlementRange.settlement_range[creditor.creditorAccountTitle]['recommendation 1'].min = minAmount;
                newAmount += creditor.maxProfitAmount;
                newAmountMin += minAmount;
            }
            if (settlementRange.weeks_till_paid &&
                settlementRange.weeks_till_paid[creditor.creditorAccountTitle]) {
                const weeks = Math.ceil(creditor.remaining / creditor.maxProfitAmount);
                settlementRange.weeks_till_paid[creditor.creditorAccountTitle]['Weeks remaining based on recommendation 1'].max = weeks;
                let minWeaks = Math.ceil(weeks + weeks * 0.2);
                settlementRange.weeks_till_paid[creditor.creditorAccountTitle]['Weeks remaining based on recommendation 1'].min = minWeaks;
                newWeeks.push(weeks);
                newWeeksMin.push(minWeaks);
            }
        }
        if (newAmount) {
            settlementRange.settlement_range.Summary['recommendation 1'].max =
                newAmount;
        }
        if (newAmountMin) {
            settlementRange.settlement_range.Summary['recommendation 1'].min =
                newAmountMin;
        }
        if (newWeeks) {
            settlementRange.weeks_till_paid.Summary['Weeks remaining based on recommendation 1'].max = Math.max(...newWeeks);
        }
        if (newWeeksMin) {
            settlementRange.weeks_till_paid.Summary['Weeks remaining based on recommendation 1'].min = Math.max(...newWeeksMin);
        }
        if (save) {
            await this.strategyRepository.upsert({ caseId: caseId, name: 'strategy_one' }, {
                'data.settlementRange': settlementRange,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
    }
}
exports.default = new CreditorUtil();
//# sourceMappingURL=creditor.util.js.map