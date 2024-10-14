"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const case_repository_1 = require("../api/repository/case/case.repository");
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const common_util_1 = __importDefault(require("./common.util"));
const creditor_util_1 = __importDefault(require("./creditor.util"));
const email_util_1 = __importDefault(require("./email.util"));
const moneyThumb_util_1 = __importDefault(require("./moneyThumb.util"));
class DebtorUtil {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
    }
    async saveWeeklyBudget(caseTemp, body) {
        const strategy1Key = body.strategy1Choosen;
        const strategy3Key = body.strategy3Choosen;
        const strategy1Budget = body[strategy1Key];
        const strategy3Budget = body[strategy3Key];
        const filter = {
            weeklyBudgetKeyStrategy1: strategy1Key,
            weeklyBudgetKeyStrategy3: strategy3Key,
            weeklyBudgetStrategy1: strategy1Budget,
            weeklyBudgetStrategy3: strategy3Budget,
            updatedAt: common_util_1.default.getCurrentDate(),
        };
        if (strategy1Key === 'strategy1Custom') {
            filter['strategy1BudgetCustom'] = strategy1Budget;
            if (!caseTemp?.debtor?.basicInformation?.weeklyBudget)
                filter['basicInformation.weeklyBudget'] = strategy1Budget;
        }
        if (strategy3Key === 'strategy3Custom') {
            filter['strategy3BudgetCustom'] = strategy3Budget;
            if (!caseTemp?.debtor?.profitMargin)
                filter['profitMargin'] = strategy3Budget;
        }
        await this.caseRepository.updateById(caseTemp._id, {
            settlementRange: true,
            updatedAt: common_util_1.default.getCurrentDate(),
        });
        return await this.debtorRepository.updateById(String(caseTemp.debtor._id), filter);
    }
    async percentageChangeEmail(debtorId, totalStatements, debtorName) {
        const token = await moneyThumb_util_1.default.authenticateUser();
        const moneyThumbApp = await moneyThumb_util_1.default.createNewApp(token, debtorId);
        if (moneyThumbApp['totalstatements'] > totalStatements) {
            const scoreCard = await moneyThumb_util_1.default.getScoreCard(token, moneyThumbApp['appid']);
            const accounts = scoreCard['accountslist'];
            if (accounts.length > 1) {
                const len = accounts.length;
                const percentageChange = await common_util_1.default.calculatePercentageChange(parseFloat(accounts[len - 2]['true_credits']), parseFloat(accounts[len - 1]['true_credits']));
                let incDec = '', posNeg = '';
                if (percentageChange > 1) {
                    incDec = 'Increase';
                    posNeg = 'positive';
                }
                if (percentageChange > -1) {
                    incDec = 'Decrease';
                    posNeg = 'negative';
                }
                const previousMonth = accounts[len - 2]['statement_month'];
                const previousYear = accounts[len - 2]['statement_year'];
                const currentMonth = accounts[len - 1]['statement_month'];
                const currentYear = accounts[len - 1]['statement_year'];
                const creditors = await creditor_util_1.default.getCreditorsEmailForDebtor(debtorId);
                console.log(incDec, posNeg, previousMonth, previousYear, currentMonth, currentYear, creditors, debtorName, accounts[len - 2]['true_credits'], accounts[len - 1]['true_credits'], percentageChange);
                email_util_1.default.percentageChangeEmail(incDec, posNeg, previousMonth, previousYear, currentMonth, currentYear, creditors, debtorName, accounts[len - 2]['true_credits'], accounts[len - 1]['true_credits'], percentageChange);
            }
        }
    }
}
exports.default = new DebtorUtil();
//# sourceMappingURL=debtor.util.js.map