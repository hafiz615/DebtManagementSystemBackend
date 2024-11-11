"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
const upload_util_1 = __importDefault(require("./upload.util"));
const creditor_util_1 = __importDefault(require("./creditor.util"));
const debtor_util_1 = __importDefault(require("./debtor.util"));
dotenv_1.default.config();
class MoneyThumbUtil {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.uploadUtil = new upload_util_1.default();
    }
    async run(debtor, companyName) {
        try {
            // const debtor = await this.debtorRepository.getById<IDebtor>(debtorId);
            let appid = debtor.moneyThumbAppId;
            const token = await this.authenticateUser();
            if (!appid) {
                const app = await this.createNewApp(token, companyName);
                appid = app['appid'];
            }
            await this.convertPdf(token, debtor._id, appid);
            const scoreCard = await this.getScoreCard(token, appid);
            await this.saveData(appid, scoreCard, debtor);
        }
        catch (error) {
            console.log(error.message);
        }
    }
    async authenticateUser() {
        let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/authenticate`;
        const data = {
            product: process.env.moneyThumbProduct,
            username: process.env.moneyThumbUsername,
            password: process.env.moneyThumbPassword,
        };
        try {
            console.log('I am in authenticateUser moneythumb');
            console.log('URL: ', url);
            console.log('Payload: ', {});
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            console.log('Response Data', response.data);
            return response.data;
        }
        catch (error) {
            console.log(error.message);
            return error.message;
        }
    }
    async createNewApp(token, appNumber) {
        let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/new`;
        // Response Data {
        //     appnumber: 'test',
        //     appid: 3314502,
        //     naccounts: 14,
        //     owner: 'COMMERCIAL ACCOUNT MANAGEMENT',
        //     totalstatements: 0,
        //     totalstatements_reconciled: 0,
        //     totaltaxforms: 0,
        //     totaltaxreturns: 0,
        //     address1: 'Standard Monthly Service Charge',
        //     address2: '',
        //     citystate: '  ',
        //     expfactor: '50',
        //     accountlist: []
        //   }
        const data = {
            token: token,
            product: process.env.moneyThumbProduct,
            appnumber: appNumber,
        };
        try {
            console.log('I am in createNewApp moneythumb');
            console.log('URL: ', url);
            console.log('Payload: ', data);
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Response Data', response.data);
            return response.data;
        }
        catch (error) {
            console.log(error.message);
            return error.message;
        }
    }
    async convertPdf(token, debtorId, appId) {
        const debtor = await this.debtorRepository.getById(debtorId);
        const documents = debtor.documents;
        let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/makecsv`;
        try {
            for (const document of documents) {
                const bytes = await this.uploadUtil.getPdfBytesFromS3(document.key);
                if (typeof bytes === 'string')
                    continue;
                const stringData = Buffer.from(bytes);
                const data = {
                    token: token,
                    product: process.env.moneyThumbProduct,
                    appid: appId,
                    'pdf-filename': stringData,
                };
                console.log('I am in convertPdf moneythumb');
                console.log('URL: ', url);
                // console.log('Payload: ', data);
                const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log('Response Data', response.data);
            }
            //   return response.data;
        }
        catch (error) {
            console.log(error);
            return error.message;
        }
    }
    async getScoreCard(token, appId) {
        let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/scorecard`;
        const data = {
            token: token,
            product: process.env.moneyThumbProduct,
            appid: appId,
        };
        try {
            console.log('I am in getScoreCard moneythumb');
            console.log('URL: ', url);
            console.log('Payload: ', data);
            const response = await axiosInstanceInterceptor_1.default.post(url, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Response Data', response.data['mcacompanies'].data);
            return response.data;
        }
        catch (error) {
            console.log(error);
            return error.message;
        }
    }
    async saveData(appid, scoreCard, debtor) {
        try {
            let weeklyProfit = 0;
            let trueProfit = 0, weeklyTrueRevenue = 0;
            const filter = { appid: appid };
            if (scoreCard['metrics']['metricdata']) {
                const metricData = scoreCard['metrics']['metricdata'];
                // if (metricData?.length) {
                //   const profitArray = metricData.find(row => row[0] === 'Profit');
                //   const trueRevenueArray = metricData.find(
                //     row => row[0] === 'True Revenue'
                //   );
                //   if (profitArray.length && trueRevenueArray.length) {
                //     weeklyProfit = (parseFloat(profitArray[1]) / 22) * 5;
                //     weeklyTrueRevenue = (parseFloat(trueRevenueArray[1]) / 22) * 5;
                //   }
                // }
                const weeklyProfitAndTrueRevenue = await this.getweeklyProfitAndTrueRevenue(metricData);
                weeklyProfit = weeklyProfitAndTrueRevenue.profit;
                weeklyTrueRevenue = weeklyProfitAndTrueRevenue.trueRevenue;
            }
            let trueProfitPer = 0;
            if (scoreCard['mcacompanies']) {
                const mcaCompanies = scoreCard['mcacompanies'];
                let totalWithdrawl = await this.getTotalWeeklyBudget(mcaCompanies, debtor);
                if (!debtor.weeklyBudgetStrategy1) {
                    filter['weeklyBudgetStrategy1'] = totalWithdrawl;
                }
                console.log(totalWithdrawl, 'totalWithdrawl');
                console.log(weeklyProfit, 'weeklyProfit');
                trueProfit = totalWithdrawl + weeklyProfit;
                if (trueProfit > 0) {
                    filter['trueProfit'] = Math.round(trueProfit * 100) / 100;
                    trueProfitPer = trueProfit * 0.67;
                    filter['strategy1MaxProfit'] = Math.round(trueProfitPer * 100) / 100;
                    if (!debtor.weeklyBudgetStrategy1) {
                        filter['weeklyBudgetStrategy1'] =
                            Math.round(trueProfitPer * 100) / 100;
                    }
                }
                else {
                    filter['trueProfit'] = 0;
                    filter['strategy1MaxProfit'] = 0;
                    if (debtor.weeklyBudgetStrategy1 <= 0) {
                        filter['weeklyBudgetStrategy1'] = 0;
                    }
                }
            }
            filter['strategy3MaxProfit'] = 0;
            let weeklyTrueCredit = 0;
            const accounts = scoreCard['accountslist'];
            if (accounts.data.length) {
                weeklyTrueCredit = await this.getWeeklyTrueCredit(accounts);
            }
            if (weeklyTrueCredit && trueProfitPer) {
                console.log(weeklyTrueCredit, 'weeklyTrueCredit)');
                console.log(trueProfitPer, 'trueProfitPer)');
                console.log(trueProfitPer / weeklyTrueCredit, '(trueProfitPer / weeklyTrueCredit)');
                const profitability = (trueProfitPer / weeklyTrueCredit) * 100;
                console.log(profitability, 'profitability');
                filter['strategy3MaxProfit'] = Math.round(profitability * 100) / 100;
                if (!debtor.weeklyBudgetStrategy3)
                    filter['weeklyBudgetStrategy3'] =
                        Math.round(profitability * 100) / 100;
            }
            else {
                filter['strategy3MaxProfit'] = 0;
                if (debtor.weeklyBudgetStrategy3 <= 0)
                    filter['weeklyBudgetStrategy3'] = 0;
            }
            console.log(filter);
            await this.debtorRepository.updateById(debtor._id, filter);
        }
        catch (error) {
            console.log(error.message);
        }
    }
    async getDays(data) {
        const regex = /-\s([A-Za-z]+)\s(\d+),\s(\d{4})/;
        const match = data.match(regex);
        const month = match[1];
        const year = parseInt(match[3]);
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        const date = new Date(year, monthIndex + 1, 0);
        return date.getDate();
    }
    async getTotalWeeklyBudget(mcaCompanies, debtor) {
        const data = mcaCompanies.data;
        const lastLenderOccurrences = {};
        let weeklyBudget = 0;
        let totalWithdrawl = 0;
        let creditors = await debtor_util_1.default.getCreditorsMapping(debtor);
        const creditorsAccTitleArray = creditors.map(creditor => {
            return creditor.creditorAccountTitle;
        });
        console.log(creditorsAccTitleArray, 'creditorsAccTitleArray');
        for (let i = 0; i < data.length; i++) {
            if (data[i].month === 'Totals') {
                if (!creditorsAccTitleArray.includes(data[i - 1].lender))
                    continue;
                const withdrawal_frequency = data[i - 1].withdrawal_frequency;
                const withdrawal_count = Number(data[i - 1].withdrawal_count);
                const withdrawal_total = parseFloat(data[i - 1].withdrawal_total);
                console.log(data[i - 1].lender);
                switch (withdrawal_frequency) {
                    case 'Every Other Day':
                        if (withdrawal_count)
                            weeklyBudget = (withdrawal_total / withdrawal_count) * 3;
                        break;
                    case 'Daily':
                        if (withdrawal_count)
                            weeklyBudget = (withdrawal_total / withdrawal_count) * 5;
                        break;
                    case 'Monthly':
                        if (withdrawal_count)
                            weeklyBudget = (withdrawal_total / withdrawal_count / 22) * 5;
                        break;
                    case 'Weekly':
                    case '':
                        if (withdrawal_count)
                            weeklyBudget = withdrawal_total / withdrawal_count;
                        break;
                }
                // lastLenderOccurrences[data[i - 1].lender] = {
                //   withdrawal_total: Math.round(weeklyBudget * 100) / 100,
                // };
                console.log(weeklyBudget, 'uyiuyuyiui');
                totalWithdrawl += weeklyBudget;
            }
        }
        // for (let lender of Object.values(lastLenderOccurrences as any)) {
        //   const temp: any = lender;
        //   totalWithdrawl += temp.withdrawal_total;
        // }
        return Math.abs(Math.round(totalWithdrawl * 100) / 100);
    }
    async getweeklyProfitAndTrueRevenue(metricData) {
        let profit = 0, trueRevenue = 0;
        if (metricData?.length) {
            const profitArray = metricData.find(row => row[0] === 'Profit');
            const trueRevenueArray = metricData.find(row => row[0] === 'True Revenue');
            if (profitArray.length && trueRevenueArray.length) {
                profit = (parseFloat(profitArray[1]) / 22) * 5;
                trueRevenue = (parseFloat(trueRevenueArray[1]) / 22) * 5;
            }
        }
        return { profit, trueRevenue };
    }
    async getMonthlyProfitAndTrueRevenue(metricData) {
        let profit = 0, trueRevenue = 0;
        if (metricData?.length) {
            const profitArray = metricData.find(row => row[0] === 'Profit');
            const trueRevenueArray = metricData.find(row => row[0] === 'True Revenue');
            if (profitArray.length && trueRevenueArray.length) {
                profit = parseFloat(profitArray[1]);
                trueRevenue = parseFloat(trueRevenueArray[1]);
            }
        }
        return { profit, trueRevenue };
    }
    async getAnuallyProfitAndTrueRevenue(metricData) {
        let profit = 0, trueRevenue = 0;
        if (metricData?.length) {
            const profitArray = metricData.find(row => row[0] === 'Profit');
            const trueRevenueArray = metricData.find(row => row[0] === 'True Revenue');
            if (profitArray.length && trueRevenueArray.length) {
                profit = parseFloat(profitArray[2]);
                trueRevenue = parseFloat(trueRevenueArray[2]);
            }
        }
        return { profit, trueRevenue };
    }
    async getTotalBudget(mcaCompanies) {
        const data = mcaCompanies.data;
        let totalWithdrawl = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].month === 'Totals') {
                const withdrawal_total = parseFloat(data[i].withdrawal_total);
                totalWithdrawl += withdrawal_total;
            }
        }
        return Math.abs(Math.round(totalWithdrawl * 100) / 100);
    }
    async getWeeklyTrueCredit(accounts) {
        const len = accounts.data.length;
        const lastMonth = accounts.data[len - 1]['statement_month'];
        let totalCreditMonth = 0;
        for (const account of accounts.data) {
            if (account['statement_month'] === lastMonth) {
                totalCreditMonth += parseFloat(account['true_credits']);
            }
        }
        // const trueCredit = parseFloat(accounts.data[len - 1]['true_credits']);
        console.log(totalCreditMonth, 'totalCreditMonth');
        const weekly = (totalCreditMonth / 22) * 5;
        console.log(weekly, 'weekly');
        return Math.round(weekly * 100) / 100;
    }
    async getSettlementValues(debtor, creditors, scoreCard, caseId) {
        const metricData = scoreCard['metrics']['metricdata'];
        const weeklyProfitAndTrueRevenue = await this.getweeklyProfitAndTrueRevenue(metricData);
        const true_profit = debtor.weeklyBudgetStrategy1 + weeklyProfitAndTrueRevenue.profit;
        const profitability = (true_profit / weeklyProfitAndTrueRevenue.trueRevenue) * 100;
        const profitability_without_creditor_payments = (weeklyProfitAndTrueRevenue.profit /
            weeklyProfitAndTrueRevenue.trueRevenue) *
            100;
        const settlement_range = {}, weeks_till_paid = {}, option_2_stats = null;
        for (const creditor of creditors) {
            settlement_range[creditor.creditorAccountTitle] = {
                'recommendation 1': { max: 0, min: 0 },
            };
            weeks_till_paid[creditor.creditorAccountTitle] = {
                'Weeks remaining based on recommendation 1': { max: 0, min: 0 },
            };
        }
        settlement_range['Summary'] = {
            'recommendation 1': { max: 0, min: 0 },
        };
        weeks_till_paid['Summary'] = {
            'Weeks remaining based on recommendation 1': { max: 0, min: 0 },
        };
        const settlementRange = {
            profitability: parseFloat(profitability.toFixed(2)),
            true_profit: parseFloat(true_profit.toFixed(2)),
            profitability_without_creditor_payments: parseFloat(profitability_without_creditor_payments.toFixed(2)),
            weekly_true_revenue: parseFloat(weeklyProfitAndTrueRevenue.trueRevenue.toFixed(2)),
            weekly_profit: parseFloat(weeklyProfitAndTrueRevenue.profit.toFixed(2)),
            settlement_range,
            weeks_till_paid,
            option_2_stats,
        };
        await creditor_util_1.default.replaceSettlementRangeAndWeeksTillPaid(creditors, settlementRange, caseId);
        return settlementRange;
    }
}
exports.default = new MoneyThumbUtil();
//# sourceMappingURL=moneyThumb.util.js.map