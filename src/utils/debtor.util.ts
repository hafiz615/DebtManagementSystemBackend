import {CaseRepository} from '../api/repository/case/case.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {ICase} from '../database/interfaces/case.interface';
import {IDebtor} from '../database/interfaces/debtor.interface';
import axiosInstance from './axiosInstanceInterceptor';
import {Debtor} from '../database/repomodels/debtor.repomodel';
import caseUtil from './case.util';
import commonUtil from './common.util';
import creditorUtil from './creditor.util';
import emailUtil from './email.util';
import moneyThumbUtil from './moneyThumb.util';

class DebtorUtil {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
  }
  async saveWeeklyBudget(caseTemp: any, body: any) {
    const strategy1Key = body.strategy1Choosen;
    const strategy3Key = body.strategy3Choosen;
    const strategy1Budget = body[strategy1Key];
    let strategy3Budget = body[strategy3Key];
    if (strategy3Key === 'strategy3Profit') {
      strategy3Budget = strategy3Budget;
    } else {
      strategy3Budget = strategy3Budget * 0.8;
    }
    const filter = {
      weeklyBudgetKeyStrategy1: strategy1Key,
      weeklyBudgetKeyStrategy3: strategy3Key,
      weeklyBudgetStrategy1: strategy1Budget,
      weeklyBudgetStrategy3: strategy3Budget,
      updatedAt: commonUtil.getCurrentDate(),
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
    await this.caseRepository.updateById<ICase>(caseTemp._id, {
      settlementRange: true,
      updatedAt: commonUtil.getCurrentDate(),
    });
    return await this.debtorRepository.updateById<IDebtor>(
      String(caseTemp.debtor._id),
      filter
    );
  }

  async percentageChangeEmail(
    debtorCompanyName: string,
    debtorId: string,
    totalStatements: number,
    debtorName: string,
    caseId: string
  ) {
    const token = await moneyThumbUtil.authenticateUser();
    const moneyThumbApp = await moneyThumbUtil.createNewApp(
      token,
      await this.normalizeCompanyName(debtorCompanyName)
    );
    if (moneyThumbApp['totalstatements'] > totalStatements) {
      const scoreCard = await moneyThumbUtil.getScoreCard(
        token,
        moneyThumbApp['appid']
      );
      const accounts = scoreCard['accountslist'];
      if (accounts.data.length > 1) {
        const len = accounts.data.length;
        const previous = new Date(`${totalStatements - 1}`.split('-')[1]);
        const latest = new Date(`${len - 1}`.split('-')[1]);
        const convertedPrevious = new Date(
          Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), 1)
        );
        const convertedLatest = new Date(
          Date.UTC(latest.getUTCFullYear(), latest.getUTCMonth(), 1)
        );

        const curr = new Date(commonUtil.getCurrentDate());
        curr.setUTCHours(0, 0, 0, 0);
        if (
          convertedLatest.getSeconds() > convertedPrevious.getSeconds() &&
          convertedLatest.getSeconds() < curr.getSeconds()
        ) {
          await this.debtorRepository.updateById(debtorId, {
            totalStatements: len,
            percentageChange: true,
            percentageChangeDate: curr.setDate(1),
          });
          const percentageChange = await commonUtil.calculatePercentageChange(
            parseFloat(accounts.data[len - 2]['true_credits']),
            parseFloat(accounts.data[len - 1]['true_credits'])
          );
          let incDec = '',
            posNeg = '';
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
          const creditors =
            await creditorUtil.getCreditorsEmailForDebtor(debtorId);
          console.log(
            incDec,
            posNeg,
            previousMonth,
            previousYear,
            currentMonth,
            currentYear,
            creditors,
            debtorName,
            accounts.data[len - 2]['true_credits'],
            accounts.data[len - 1]['true_credits'],
            percentageChange
          );
          emailUtil.percentageChangeEmail(
            incDec,
            posNeg,
            previousMonth,
            previousYear,
            currentMonth,
            currentYear,
            creditors,
            debtorName,
            accounts.data[len - 2]['true_credits'],
            accounts.data[len - 1]['true_credits'],
            percentageChange,
            caseId
          );
        }
      }
    }
  }

  async updateDebtorTotalCommission(debtor: IDebtor) {
    const cases = await this.caseRepository.getAllWithoutPagination<ICase>({
      debtor: debtor._id,
      isDeleted: false,
    });
    let debt = 0;
    for (const caseTemp of cases) {
      debt += caseTemp.remaining;
    }
    const amount = debt * (debtor.commissionPercentage / 100);
    console.log(amount, 'amountttt');
    await this.debtorRepository.updateById<IDebtor>(debtor._id, {
      totalCommission: Math.round(amount * 100) / 100,
    });
  }

  async generateVideoWithGenAi(debtor: IDebtor) {
    try {
      //login : This endpoint can be used for login. The response contains an access token and a refresh token which need to be used in the Authorization header in the future API calls.

      let getAccessKeys = await axiosInstance.post(
        process.env.ganAiLoginUrl,
        {
          email: process.env.ganAiEmail,
          password: process.env.ganAiPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

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

      const getProject = await axiosInstance.get(
        process.env.getGanAiProjectEndpoint,
        {
          headers: {
            Authorization: `Bearer ${getAccessKeys?.data?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const response = await axiosInstance.post(
        process.env.createDynamicVideoUrl,
        [
          {
            name: debtor.basicInformation.fullName,
            unique_id: debtor._id.toString(),
          },
        ],
        {
          headers: {
            Authorization: `Bearer ${getAccessKeys?.data?.access_token}`,
            'Content-Type': 'application/json',
          },
          params: {
            project_id: getProject?.data?.data[0]?.project_id,
          },
        }
      );
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      console.log(error);
      return error.message;
    }
  }
  async getPaidAmountOfCreditors(debtor: IDebtor) {
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
              last_withdrawal_date: data[i].last_withdrawal_date,
            };
          }
        }
      }
    }
    return lastLenderOccurrences;
  }

  async mapDebtor(data: any) {
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
        value = await commonUtil.removeDashesAndRoundBrackets(value);
      if (key === "Debtor's Phone Number" && value)
        value = await commonUtil.cleanPhoneNumber(value);
      basicInformation[basicInformationKeys[key]] = value;
      if (!value) missingFieldsBasic.push(key);
    }
    for (const key in businessInformationKeys) {
      let value = firstObj.bussiness_info[key];
      if (key === 'Business EIN Number' && value)
        value = await commonUtil.removeDashesAndRoundBrackets(value);
      if (key === 'Business Phone Number' && value)
        value = await commonUtil.cleanPhoneNumber(value);
      businessInformation[businessInformationKeys[key]] = value;
      if (!value) missingFieldsBusiness.push(key);
    }
    if (
      data.length > 1 &&
      (missingFieldsBasic.length || missingFieldsBusiness.length)
    ) {
      data.shift();
      for (const key of missingFieldsBasic) {
        for (const extractedData of data) {
          let value = extractedData.debtor_info[key];
          if (key === "Debtor's Email address" && value)
            value = value.toLowerCase();
          if (key === "Debtor's SSN" && value)
            value = await commonUtil.removeDashesAndRoundBrackets(value);
          if (key === "Debtor's Phone Number" && value)
            value = await commonUtil.cleanPhoneNumber(value);
          basicInformation[basicInformationKeys[key]] = value;
          if (value) break;
        }
      }
      for (const key of missingFieldsBusiness) {
        for (const extractedData of data) {
          let value = extractedData.bussiness_info[key];
          if (key === 'Business EIN Number' && value)
            value = await commonUtil.removeDashesAndRoundBrackets(value);
          if (key === 'Business Phone Number' && value)
            value = await commonUtil.cleanPhoneNumber(value);
          businessInformation[businessInformationKeys[key]] = value;
          if (value) break;
        }
      }
    }
    return {basicInformation, businessInformation, platform: true};
  }

  async getYearlySales(accounts: any) {
    const yearlyResults = {};
    const result = [];
    for (const account of accounts) {
      if (
        !yearlyResults[account.statement_month + ' ' + account.statement_year]
      ) {
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

  async getYearlyProfitMargin(scoreCard: any) {
    const mcaCompanies = scoreCard['mcacompanies']['data'];
    const metricData = scoreCard['metrics']['metricdata'];
    const result =
      await moneyThumbUtil.getMonthlyProfitAndTrueRevenue(metricData);
    const yearlyResults = {};
    const profitArray = [];
    for (const mca of mcaCompanies) {
      if (mca.month === 'Totals') continue;
      const month = mca.month;
      if (!yearlyResults[month]) {
        const creditorProfitMargin =
          (Math.abs(parseFloat(mca.withdrawal_total)) + result.profit) /
          result.trueRevenue;
        const inPercentage =
          (Math.round(creditorProfitMargin * 100) / 100) * 100;
        yearlyResults[month] = inPercentage;
        continue;
      }
      const creditorProfitMargin =
        (Math.abs(parseFloat(mca.withdrawal_total)) + result.profit) /
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

  async getScoreCard(debtor: IDebtor) {
    const token = await moneyThumbUtil.authenticateUser();
    let appid = 0;
    if (debtor.appid) appid = debtor.appid;
    if (!debtor.appid) {
      const moneyThumbApp = await moneyThumbUtil.createNewApp(
        token,
        await this.normalizeCompanyName(debtor.businessInformation.companyName)
      );
      appid = moneyThumbApp['appid'];
    }
    const scoreCard = await moneyThumbUtil.getScoreCard(token, appid);
    return {scoreCard, appid};
  }

  async getCreditorsMapping(debtor: any) {
    let creditors = await caseUtil.getAllCreditorsOfDebtor(debtor);
    creditors = Array.from(
      new Map(
        creditors.map(creditor => [creditor.creditorAccountTitle, creditor])
      ).values()
    );
    return creditors;
  }

  async normalizeCompanyName(name: string) {
    const words = name.split(' ');
    return words.slice(0, 2).join(' ').toLowerCase().replace(/,$/, '');
  }

  async getBenefits(
    plans: any,
    scoreCard: any,
    debtor: IDebtor,
    creditors: any,
    totalRemaining: number
  ) {
    const weeklyBudget = await moneyThumbUtil.getTotalWeeklyBudget(
      scoreCard['mcacompanies'],
      debtor
    );
    const weeklyProfitAndTrueRevenue =
      await moneyThumbUtil.getweeklyProfitAndTrueRevenue(
        scoreCard['metrics']['metricdata']
      );
    const benefits = {};
    const weeklyPayment = await this.helperBenefits(
      weeklyBudget,
      plans.weeklyPayment,
      weeklyProfitAndTrueRevenue
    );
    let weeksToBeFree = 0;
    for (const creditor of creditors) {
      weeksToBeFree += Math.round(
        creditor.remaining / creditor.maxProfitAmount
      );
    }
    weeklyPayment['weeksToBeFree'] = weeksToBeFree;

    const totalPercentageAmount = creditors.reduce(
      (sum, obj) => sum + obj.percentageReceivableAmount,
      0
    );
    const percentageShare = await this.helperBenefits(
      weeklyBudget,
      totalPercentageAmount,
      weeklyProfitAndTrueRevenue
    );
    weeksToBeFree = 0;
    for (const creditor of creditors) {
      weeksToBeFree += Math.round(
        creditor.remaining / creditor.percentageReceivableAmount
      );
    }
    percentageShare['weeksToBeFree'] = weeksToBeFree;

    const anuallyProfitAndTrueRevenue =
      await moneyThumbUtil.getAnuallyProfitAndTrueRevenue(
        scoreCard['metrics']['metricdata']
      );
    const maximum = await this.helperBenefits(
      totalRemaining,
      plans.maximum,
      anuallyProfitAndTrueRevenue
    );
    maximum['weeksToBeFree'] = 1;

    benefits['weeklyPayment'] = weeklyPayment;
    benefits['percentageShare'] = percentageShare;
    benefits['maximum'] = maximum;
    return benefits;
  }

  async helperBenefits(
    weeklyBudget: number,
    payment: number,
    weeklyProfitAndTrueRevenue: {
      profit: number;
      trueRevenue: number;
    }
  ) {
    const benefit = {};
    if (!weeklyBudget) {
      benefit['cashFlow'] = 0;
      benefit['savings'] = 0;
      benefit['estimatedProfit'] = parseFloat(
        (weeklyProfitAndTrueRevenue.profit + 0).toFixed(2)
      );
      return benefit;
    }
    const cashFlow = weeklyBudget - payment;
    benefit['cashFlow'] = parseFloat(cashFlow.toFixed(2));
    const savingsPercentage = parseFloat(
      ((cashFlow / weeklyBudget) * 100).toFixed(2)
    );
    benefit['savings'] = savingsPercentage;
    benefit['estimatedProfit'] = parseFloat(
      (weeklyProfitAndTrueRevenue.profit + cashFlow).toFixed(2)
    );
    return benefit;
  }

  async sortByMonthAndYear(obj: any) {
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
      if (yearDifference !== 0) return yearDifference;

      // If years are the same, sort by month
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });

    // Convert sorted array back into an object
    return Object.fromEntries(sortedEntries);
  }

  getAccountDetails = (accountList: any) => {
    return accountList.reduce((acc, curr) => {
      if (!acc[curr.account]) {
        acc[curr.account] = [];
      }
      acc[curr.account].push({
        startingBalance: curr.starting_balance,
        endingBalance: curr.ending_balance,
        statement_month: curr.statement_month,
        trueCredits: curr.true_credits,
        mcaWithholdPercent: curr.mca_withhold_percent,
        mcaNumber: curr["#_mca's"],
      });
      return acc;
    }, {});
  };

  getWithDrawalTotalForMonth = (withDrawals: any) => {
    const withDrawalTotalForMonth = {};
    withDrawals.forEach(({account, month, withdrawal_total}) => {
      const cleanMonth = month.split(' ')[0];
      const withdrawalAmount = parseFloat(withdrawal_total) || 0;

      if (!withDrawalTotalForMonth[account]) {
        withDrawalTotalForMonth[account] = {};
      }

      if (!withDrawalTotalForMonth[account][cleanMonth]) {
        withDrawalTotalForMonth[account][cleanMonth] = 0;
      }

      withDrawalTotalForMonth[account][cleanMonth] += withdrawalAmount;
    });
    return withDrawalTotalForMonth;
  };

  getUpdatedAccountDetails = (
    accountDetails: any,
    withDrawalTotalForMonth: any
  ) => {
    Object.keys(accountDetails).forEach(account => {
      accountDetails[account].forEach(statement => {
        const month = statement.statement_month;
        const withdrawalTotal = withDrawalTotalForMonth[account]?.[month] || 0;
        statement.withdrawalTotal = Math.abs(withdrawalTotal).toFixed(2); // Add as a positive value
      });
    });

    return accountDetails;
  };

  async getCommissionAmount(payment: any) {
    if (!payment.caseId.debtor.weeklyCommission) return 0;
    if (
      payment.caseId.debtor.totalCommision ===
      payment.caseId.debtor.commissionPaid
    )
      return 0;
    const commissionPaid = payment.caseId.debtor.commissionPaid;
    const weeklyCommission = payment.caseId.debtor.weeklyCommission;
    const totalCommision = payment.caseId.debtor.totalCommision;
    let sumTotalPaidWeekly = commissionPaid + weeklyCommission;
    if (sumTotalPaidWeekly <= totalCommision) return weeklyCommission;
    let amountUp = sumTotalPaidWeekly - totalCommision;
    return weeklyCommission - amountUp;
  }

  getDailyCashFlowsLastDate = data => {
    return data.reduce((latest, item) => {
      const current = new Date(item.date);
      return current > latest ? current : latest;
    }, new Date(data[0].date));
  };

  getTrueCashFlows = (data, secondLastMonth) => {
    return data.filter(entry => {
      const entryDate = new Date(entry.date);
      const isInLastTwoMonths = entryDate > secondLastMonth;
      const hasTrueCashFlow = Object.keys(entry).some(
        key =>
          key.includes('true_cash_flow') &&
          entry[key] !== '' &&
          entry[key] !== '.00'
      );
      return isInLastTwoMonths && hasTrueCashFlow;
    });
  };

  getFlowsDaysWeightage = data => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return data.reduce(
      (acc, curr) => {
        const dayOfWeek = new Date(curr.date).getDay();
        acc[days[dayOfWeek]] += 1;
        return acc;
      },
      {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
      }
    );
  };

  getFlowsDaysPercentage = (data, total) => {
    return Object.entries(data).map(([day, value]) => {
      const percentage = parseFloat(((Number(value) / total) * 100).toFixed(2));
      return {day, percentage};
    });
  };
}

export default new DebtorUtil();
