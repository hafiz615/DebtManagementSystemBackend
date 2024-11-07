"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const case_repository_1 = require("../api/repository/case/case.repository");
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const case_util_1 = __importDefault(require("./case.util"));
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
        let strategy3Budget = body[strategy3Key];
        if (strategy3Key === 'strategy3Profit') {
            strategy3Budget = strategy3Budget;
        }
        else {
            strategy3Budget = strategy3Budget * 0.8;
        }
        const filter = {
            weeklyBudgetKeyStrategy1: strategy1Key,
            weeklyBudgetKeyStrategy3: strategy3Key,
            weeklyBudgetStrategy1: strategy1Budget,
            weeklyBudgetStrategy3: strategy3Budget,
            updatedAt: common_util_1.default.getCurrentDate(),
        };
        // if (strategy1Key === 'strategy1Profit') {
        //   filter['weeklyCommission'] = caseTemp.debtor.trueProfit * 0.2;
        // } else {
        //   filter['weeklyCommission'] = strategy1Budget * 0.2;
        // }
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
    async percentageChangeEmail(debtorCompanyName, debtorId, totalStatements, debtorName, caseId) {
        const token = await moneyThumb_util_1.default.authenticateUser();
        const moneyThumbApp = await moneyThumb_util_1.default.createNewApp(token, await this.normalizeCompanyName(debtorCompanyName));
        if (moneyThumbApp['totalstatements'] > totalStatements) {
            const scoreCard = await moneyThumb_util_1.default.getScoreCard(token, moneyThumbApp['appid']);
            const accounts = scoreCard['accountslist'];
            if (accounts.data.length > 1) {
                const len = accounts.data.length;
                const previous = new Date(`${totalStatements - 1}`.split('-')[1]);
                const latest = new Date(`${len - 1}`.split('-')[1]);
                const convertedPrevious = new Date(Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), 1));
                const convertedLatest = new Date(Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth(), 1));
                const curr = new Date(common_util_1.default.getCurrentDate());
                curr.setUTCHours(0, 0, 0, 0);
                if (convertedLatest.getSeconds() > convertedPrevious.getSeconds() &&
                    convertedLatest.getSeconds() < curr.getSeconds()) {
                    await this.debtorRepository.updateById(debtorId, {
                        totalStatements: len,
                        percentageChange: true,
                        percentageChangeDate: curr.setDate(1),
                    });
                    const percentageChange = await common_util_1.default.calculatePercentageChange(parseFloat(accounts.data[len - 2]['true_credits']), parseFloat(accounts.data[len - 1]['true_credits']));
                    let incDec = '', posNeg = '';
                    if (percentageChange > 1) {
                        incDec = 'Increase';
                        posNeg = 'positive';
                    }
                    if (percentageChange < -1) {
                        incDec = 'Decrease';
                        posNeg = 'negative';
                    }
                    const previousMonth = accounts.data[len - 2]['statement_month'];
                    const previousYear = accounts.data[len - 2]['statement_year'];
                    const currentMonth = accounts.data[len - 1]['statement_month'];
                    const currentYear = accounts.data[len - 1]['statement_year'];
                    const creditors = await creditor_util_1.default.getCreditorsEmailForDebtor(debtorId);
                    console.log(incDec, posNeg, previousMonth, previousYear, currentMonth, currentYear, creditors, debtorName, accounts.data[len - 2]['true_credits'], accounts.data[len - 1]['true_credits'], percentageChange);
                    email_util_1.default.percentageChangeEmail(incDec, posNeg, previousMonth, previousYear, currentMonth, currentYear, creditors, debtorName, accounts.data[len - 2]['true_credits'], accounts.data[len - 1]['true_credits'], percentageChange, caseId);
                }
            }
        }
    }
    async updateDebtorTotalCommission(debtor) {
        const cases = await this.caseRepository.getAllWithoutPagination({
            debtor: debtor._id,
            isDeleted: false,
        });
        let debt = 0;
        for (const caseTemp of cases) {
            debt += caseTemp.remaining;
        }
        const amount = debt * (debtor.commissionPercentage / 100);
        console.log(amount, 'amountttt');
        await this.debtorRepository.updateById(debtor._id, {
            totalCommission: Math.round(amount * 100) / 100,
        });
    }
    async generateVideoWithGenAi(debtor) {
        try {
            //login : This endpoint can be used for login. The response contains an access token and a refresh token which need to be used in the Authorization header in the future API calls.
            let getAccessKeys = await axiosInstanceInterceptor_1.default.post(process.env.ganAiLoginUrl, {
                email: process.env.ganAiEmail,
                password: process.env.ganAiPassword,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // const getDynamicToken = await axiosInstance.post(
            //   process.env.generateTokenUrl,
            //   {
            //     expiry_time: {days: 1, hours: 24, minutes: 1440},
            //     token_name: `${debtor?._id?.toString()} - ${
            //       debtor.basicInformation.fullName
            //     }`,
            //   },
            //   {
            //     headers: {
            //       Authorization: `Bearer ${getAccessKeys?.data?.access_token}`,
            //       'Content-Type': 'application/json',
            //     },
            //   }
            // );
            const getProject = await axiosInstanceInterceptor_1.default.get(process.env.getGanAiProjectEndpoint, {
                headers: {
                    Authorization: `Bearer ${getAccessKeys?.data?.access_token}`,
                    'Content-Type': 'application/json',
                },
            });
            const response = await axiosInstanceInterceptor_1.default.post(process.env.createDynamicVideoUrl, [
                {
                    name: debtor.basicInformation.fullName,
                    unique_id: debtor._id.toString(),
                },
            ], {
                headers: {
                    Authorization: `Bearer ${getAccessKeys?.data?.access_token}`,
                    'Content-Type': 'application/json',
                },
                params: {
                    project_id: getProject?.data?.data[0]?.project_id,
                },
            });
            console.log(response.data);
            return response.data;
        }
        catch (error) {
            console.log(error);
            return error.message;
        }
    }
    async getPaidAmountOfCreditors(debtor) {
        const lastLenderOccurrences = {};
        // const token = await moneyThumbUtil.authenticateUser();
        // const moneyThumbApp = await moneyThumbUtil.createNewApp(
        //   token,
        //   debtorCompanyName
        // );
        // const scoreCard = await moneyThumbUtil.getScoreCard(
        //   token,
        //   moneyThumbApp['appid']
        // );
        const moneyThumb = await this.getScoreCard(debtor);
        const scoreCard = moneyThumb.scoreCard;
        if (scoreCard['mcacompanies']) {
            const mcaCompanies = scoreCard['mcacompanies'];
            if (mcaCompanies.data && mcaCompanies.data.length) {
                const data = mcaCompanies.data;
                for (let i = 0; i < data.length; i++) {
                    if (data[i].month === 'Totals') {
                        lastLenderOccurrences[data[i].lender] = {
                            withdrawal_total: Math.abs(parseFloat(data[i].withdrawal_total)),
                        };
                    }
                }
            }
        }
        return lastLenderOccurrences;
    }
    async mapDebtor(data) {
        const missingFieldsBasic = [];
        const missingFieldsBusiness = [];
        const basicInformation = {};
        const businessInformation = {};
        //weekly budget calculate
        const basicInformationKeys = {
            "Debtor's Name": 'fullName',
            "Debtor's Email address": 'email',
            "Debtor's SSN": 'SSID',
            "Debtor's State Name": 'state',
            "Debtor's City Name": 'city',
            "Debtor's Zip code": 'zipCode',
            "Debtor's Phone Number": 'phone',
            "Debtor's Address": 'address',
        };
        const businessInformationKeys = {
            'Business Legal Name': 'companyName',
            'Business EIN Number': 'EIN',
            'Business Category': 'businessCategory',
            'Business State Name': 'state',
            'Business City Name': 'city',
            'Business Zip code': 'zipCode',
            'Business Phone Number': 'phone',
            'Business Street Address': 'address',
        };
        const firstObj = data[0];
        for (const key in basicInformationKeys) {
            let value = firstObj.debtor_info[key];
            if (key === "Debtor's Email address" && value)
                value = value.toLowerCase();
            if (key === "Debtor's SSN" && value)
                value = await common_util_1.default.removeDashesAndRoundBrackets(value);
            if (key === "Debtor's Phone Number" && value)
                value = await common_util_1.default.cleanPhoneNumber(value);
            basicInformation[basicInformationKeys[key]] = value;
            if (!value)
                missingFieldsBasic.push(key);
        }
        for (const key in businessInformationKeys) {
            let value = firstObj.bussiness_info[key];
            if (key === 'Business EIN Number' && value)
                value = await common_util_1.default.removeDashesAndRoundBrackets(value);
            if (key === 'Business Phone Number' && value)
                value = await common_util_1.default.cleanPhoneNumber(value);
            businessInformation[businessInformationKeys[key]] = value;
            if (!value)
                missingFieldsBusiness.push(key);
        }
        if (data.length > 1 &&
            (missingFieldsBasic.length || missingFieldsBusiness.length)) {
            data.shift();
            for (const key of missingFieldsBasic) {
                for (const extractedData of data) {
                    let value = extractedData.debtor_info[key];
                    if (key === "Debtor's Email address" && value)
                        value = value.toLowerCase();
                    if (key === "Debtor's SSN" && value)
                        value = await common_util_1.default.removeDashesAndRoundBrackets(value);
                    if (key === "Debtor's Phone Number" && value)
                        value = await common_util_1.default.cleanPhoneNumber(value);
                    basicInformation[basicInformationKeys[key]] = value;
                    if (value)
                        break;
                }
            }
            for (const key of missingFieldsBusiness) {
                for (const extractedData of data) {
                    let value = extractedData.bussiness_info[key];
                    if (key === 'Business EIN Number' && value)
                        value = await common_util_1.default.removeDashesAndRoundBrackets(value);
                    if (key === 'Business Phone Number' && value)
                        value = await common_util_1.default.cleanPhoneNumber(value);
                    businessInformation[businessInformationKeys[key]] = value;
                    if (value)
                        break;
                }
            }
        }
        return { basicInformation, businessInformation, platform: true };
    }
    async getYearlySales(accounts) {
        const yearlyResults = {};
        const result = [];
        for (const account of accounts) {
            if (!yearlyResults[account.statement_month + ' ' + account.statement_year]) {
                yearlyResults[account.statement_month + ' ' + account.statement_year] =
                    parseFloat(account.true_credits);
                continue;
            }
            yearlyResults[account.statement_month + ' ' + account.statement_year] +=
                parseFloat(account.true_credits);
        }
        const sortedResult = await this.sortByMonthAndYear(yearlyResults);
        for (const [key, value] of Object.entries(sortedResult)) {
            const obj = {};
            obj[key] = value;
            result.push(obj);
        }
        return result;
    }
    async getYearlyProfitMargin(scoreCard) {
        const mcaCompanies = scoreCard['mcacompanies']['data'];
        const metricData = scoreCard['metrics']['metricdata'];
        const result = await moneyThumb_util_1.default.getMonthlyProfitAndTrueRevenue(metricData);
        const yearlyResults = {};
        const profitArray = [];
        for (const mca of mcaCompanies) {
            if (mca.month === 'Totals')
                continue;
            const month = mca.month;
            if (!yearlyResults[month]) {
                const creditorProfitMargin = (Math.abs(parseFloat(mca.withdrawal_total)) + result.profit) /
                    result.trueRevenue;
                const inPercentage = (Math.round(creditorProfitMargin * 100) / 100) * 100;
                yearlyResults[month] = inPercentage;
                continue;
            }
            const creditorProfitMargin = (Math.abs(parseFloat(mca.withdrawal_total)) + result.profit) /
                result.trueRevenue;
            const inPercentage = (Math.round(creditorProfitMargin * 100) / 100) * 100;
            yearlyResults[month] = yearlyResults[month] + inPercentage;
        }
        const sortedResult = await this.sortByMonthAndYear(yearlyResults);
        for (const [key, value] of Object.entries(sortedResult)) {
            const obj = {};
            obj[key] = value;
            profitArray.push(obj);
        }
        return Object.values(profitArray);
    }
    async getScoreCard(debtor) {
        const token = await moneyThumb_util_1.default.authenticateUser();
        let appid = 0;
        if (debtor.appid)
            appid = debtor.appid;
        if (!debtor.appid) {
            const moneyThumbApp = await moneyThumb_util_1.default.createNewApp(token, await this.normalizeCompanyName(debtor.businessInformation.companyName));
            appid = moneyThumbApp['appid'];
        }
        const scoreCard = await moneyThumb_util_1.default.getScoreCard(token, appid);
        return { scoreCard, appid };
    }
    async getCreditorsMapping(debtor) {
        let creditors = await case_util_1.default.getAllCreditorsOfDebtor(debtor);
        creditors = Array.from(new Map(creditors.map(creditor => [creditor.creditorAccountTitle, creditor])).values());
        return creditors;
    }
    async normalizeCompanyName(name) {
        const words = name.split(' ');
        return words.slice(0, 2).join(' ').toLowerCase().replace(/,$/, '');
    }
    async getBenefits(plans, scoreCard, debtor, creditors, totalRemaining) {
        const weeklyBudget = await moneyThumb_util_1.default.getTotalWeeklyBudget(scoreCard['mcacompanies'], debtor);
        const weeklyProfitAndTrueRevenue = await moneyThumb_util_1.default.getweeklyProfitAndTrueRevenue(scoreCard['metrics']['metricdata']);
        const benefits = {};
        const weeklyPayment = await this.helperBenefits(weeklyBudget, plans.weeklyPayment, weeklyProfitAndTrueRevenue);
        let weeksToBeFree = 0;
        for (const creditor of creditors) {
            weeksToBeFree += Math.round(creditor.remaining / creditor.maxProfitAmount);
        }
        weeklyPayment['weeksToBeFree'] = weeksToBeFree;
        const totalPercentageAmount = creditors.reduce((sum, obj) => sum + obj.percentageReceivableAmount, 0);
        const percentageShare = await this.helperBenefits(weeklyBudget, totalPercentageAmount, weeklyProfitAndTrueRevenue);
        weeksToBeFree = 0;
        for (const creditor of creditors) {
            weeksToBeFree += Math.round(creditor.remaining / creditor.percentageReceivableAmount);
        }
        percentageShare['weeksToBeFree'] = weeksToBeFree;
        const anuallyProfitAndTrueRevenue = await moneyThumb_util_1.default.getAnuallyProfitAndTrueRevenue(scoreCard['metrics']['metricdata']);
        const maximum = await this.helperBenefits(totalRemaining, plans.maximum, anuallyProfitAndTrueRevenue);
        maximum['weeksToBeFree'] = 1;
        benefits['weeklyPayment'] = weeklyPayment;
        benefits['percentageShare'] = percentageShare;
        benefits['maximum'] = maximum;
        return benefits;
    }
    async helperBenefits(weeklyBudget, payment, weeklyProfitAndTrueRevenue) {
        const benefit = {};
        if (!weeklyBudget) {
            benefit['cashFlow'] = 0;
            benefit['savings'] = 0;
            benefit['estimatedProfit'] = parseFloat((weeklyProfitAndTrueRevenue.profit + 0).toFixed(2));
            return benefit;
        }
        const cashFlow = weeklyBudget - payment;
        benefit['cashFlow'] = parseFloat(cashFlow.toFixed(2));
        const savingsPercentage = parseFloat(((cashFlow / weeklyBudget) * 100).toFixed(2));
        benefit['savings'] = savingsPercentage;
        benefit['estimatedProfit'] = parseFloat((weeklyProfitAndTrueRevenue.profit + cashFlow).toFixed(2));
        return benefit;
    }
    async sortByMonthAndYear(obj) {
        const monthOrder = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        // Convert object entries to an array and sort it
        const sortedEntries = Object.entries(obj).sort(([aKey], [bKey]) => {
            const [aMonth, aYear] = aKey.split(' ');
            const [bMonth, bYear] = bKey.split(' ');
            // Sort by year first
            const yearDifference = parseInt(aYear) - parseInt(bYear);
            if (yearDifference !== 0)
                return yearDifference;
            // If years are the same, sort by month
            return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
        });
        // Convert sorted array back into an object
        return Object.fromEntries(sortedEntries);
    }
}
exports.default = new DebtorUtil();
//# sourceMappingURL=debtor.util.js.map