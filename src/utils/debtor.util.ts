import {CaseRepository} from '../api/repository/case/case.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import easyPayDirectSeamlessUtil from './easyPayDirectSeamless';
import {ICase} from '../database/interfaces/case.interface';
import {IDebtor} from '../database/interfaces/debtor.interface';
import axiosInstance from './axiosInstanceInterceptor';
import {Debtor} from '../database/repomodels/debtor.repomodel';
import caseUtil from './case.util';
import commonUtil from './common.util';
import creditorUtil from './creditor.util';
import emailUtil from './email.util';
import moneyThumbUtil from './moneyThumb.util';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IPayment} from '../database/interfaces/payment.interface';
import seemlesschexUtil from './seemlesschex.util';
import paymentUtil from './payment.util';
import constantsUtil from './constants.util';
import {IAccount} from '../database/interfaces/account.interface';
import {AccountRepository} from '../api/repository/account/account.repository';
import {Account} from '../database/repomodels/account.repomodel';
import {v4} from 'uuid';

class DebtorUtil {
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;
  private paymentRepository: PaymentRepository;
  private accountRepository: AccountRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
    this.paymentRepository = new PaymentRepository();
    this.accountRepository = new AccountRepository();
  }
  async saveWeeklyBudget(caseTemp: any, body: any) {
    const strategy1Key = body.strategy1Choosen;
    const strategy3Key = body.strategy3Choosen;
    const strategy1Budget = body[strategy1Key];
    let strategy3Budget = body[strategy3Key];
    const strategy3BudgetTemp = body[strategy3Key];
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

    if (strategy1Key === 'strategy1Custom') {
      filter['strategy1BudgetCustom'] = strategy1Budget;
      if (!caseTemp?.debtor?.basicInformation?.weeklyBudget)
        filter['basicInformation.weeklyBudget'] = strategy1Budget;
    }
    if (strategy3Key === 'strategy3Custom') {
      filter['strategy3BudgetCustom'] = strategy3BudgetTemp;
      // if (!caseTemp?.debtor?.profitMargin)
      //   filter['profitMargin'] = strategy3Budget;
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
    return await this.debtorRepository.updateById<IDebtor>(debtor._id, {
      totalCommission: Math.round(amount * 100) / 100,
      commissionPercentage: debtor.commissionPercentage,
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

  getAccountDetails = accountList => {
    return accountList.reduce((acc, curr) => {
      if (!acc[curr.account]) {
        acc[curr.account] = [];
      }
      acc[curr.account].push({
        bankName: curr.bank_name,
        statementMonth: curr.statement_month,
        startingBalance: curr.starting_balance,
        totalCredits: curr.total_credits,
        credits: curr['#_credits'],
        trueCredits: curr.true_credits,
        trueCredits1: curr['#_true_credits'],
        totalDebits: curr.total_debits,
        debits: curr['#_debits'],
        endingBalance: curr.ending_balance,
        avgBalance: curr.avg_balance,
        avgTrueBalance: curr.avg_true_balance,
        daysNeg: curr.days_neg,
        ods: curr["#_od's"],
        nsfs: curr["#_nsf's"],
        lowDays: curr.low_days,
        mcas: curr["#_mca's"],
        mcaWithholdPercent: curr.mca_withhold_percent,
      });
      return acc;
    }, {});
  };

  getSortedAccountDetails = (data: any) => {
    return Object.values(data)
      .map((value: any) => {
        const {count, ...rest} = value;
        return rest;
      })
      .sort(
        (a, b) =>
          new Date(a.statementMonthAndYear).getTime() -
          new Date(b.statementMonthAndYear).getTime()
      );
  };

  withdrawalSumsByMonth = (data: any) => {
    return data.reduce((acc: any, row: any) => {
      const month = row.month;
      const withdrawalTotal = parseFloat(row.withdrawal_total || 0);
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += withdrawalTotal;
      return acc;
    }, {});
  };

  processAccountData = (data: any) => {
    return data.reduce((acc: any, curr: any) => {
      const key = `${curr.statement_month} ${curr.statement_year}`;
      if (!acc[key]) {
        acc[key] = {
          statementMonthAndYear: key,
          startingBalance: 0,
          trueCredits: 0,
          totalDebits: 0,
          endingBalance: 0,
          mca: 0,
          mcaWithholdPercent: 0,
          withdrawalTotal: 0,
          pf: 0,
          count: 0,
        };
      }

      acc[key].startingBalance = (
        parseFloat(acc[key].startingBalance) +
        (parseFloat(curr.starting_balance) || 0)
      ).toFixed(2);

      acc[key].trueCredits = (
        parseFloat(acc[key].trueCredits) + (parseFloat(curr.true_credits) || 0)
      ).toFixed(2);
      acc[key].totalDebits = (
        parseFloat(acc[key].totalDebits) + (parseFloat(curr.total_debits) || 0)
      ).toFixed(2);
      acc[key].endingBalance = (
        parseFloat(acc[key].endingBalance) +
        (parseFloat(curr.ending_balance) || 0)
      ).toFixed(2);
      acc[key].mca += parseFloat(curr["#_mca's"]) || 0;
      acc[key].mcaWithholdPercent +=
        parseFloat(curr.mca_withhold_percent.replace('%', '')) || 0;
      acc[key].withdrawalTotal = (
        parseFloat(acc[key].withdrawalTotal) +
        (parseFloat(curr.total_atm_withdrawals) || 0)
      ).toFixed(2);

      acc[key].count += 1;

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

  async createPaymentLinkOrNot(
    debtorId: string,
    amount: number,
    debtorName?: string
  ) {
    const doc = await this.paymentRepository.getOne<IPayment>({
      debtorId,
      caseId: {$eq: null},
      paymentMode: 'Link',
      isDeleted: {$ne: true},
      status: {$ne: 'Success'},
    });
    if (doc && doc.status === 'Pending' && doc.amount === amount) {
      return [
        true,
        {
          checkout_token: doc.debtorTransId,
          link: doc.paymentLink,
          amount: doc.amount,
        },
      ];
    }
    if (
      (doc &&
        (doc.status === 'Pending' || doc.status === 'Failed') &&
        doc.amount !== amount) ||
      (doc && doc.status === 'Failed' && doc.amount === amount)
    ) {
      await seemlesschexUtil.deletePaymentLink(doc.debtorTransId);
      await this.paymentRepository.updateById<IPayment>(doc._id, {
        isDeleted: true,
      });
    }
    const response = await seemlesschexUtil.createPaymentLink(amount);
    if (response?.error) return [false, response.message];
    await paymentUtil.createPaymentDoc(
      amount,
      response.checkout_link.checkout_token,
      'Seamlesschex',
      debtorId,
      debtorName,
      response.checkout_link.link
    );
    return [
      true,
      {
        checkout_token: response.checkout_link.checkout_token,
        link: response.checkout_link.link,
        amount: response.checkout_link.amount,
      },
    ];
  }

  async createPaymentInvoice(
    platform: string,
    debtorId: string,
    amount: number,
    email: string,
    debtorName?: string
  ) {
    const doc = await this.paymentRepository.getOne<IPayment>({
      debtorId,
      caseId: {$eq: null},
      paymentMode: 'Invoice',
      isDeleted: {$ne: true},
      status: {$ne: 'Success'},
    });
    if (doc && doc.status === 'Pending' && doc.amount === amount) {
      await easyPayDirectSeamlessUtil.sendInvoice(platform, doc.debtorTransId);
      return [
        true,
        {
          invoiceId: doc.debtorTransId,
          amount: doc.amount,
        },
      ];
    }
    if (
      (doc &&
        (doc.status === 'Pending' || doc.status === 'Failed') &&
        doc.amount !== amount) ||
      (doc && doc.status === 'Failed' && doc.amount === amount)
    ) {
      await easyPayDirectSeamlessUtil.closeInvoice(platform, doc.debtorTransId);
      await this.paymentRepository.updateById<IPayment>(doc._id, {
        isDeleted: true,
      });
    }

    const customerInvoiceResponse = await easyPayDirectSeamlessUtil.addInvoice(
      platform,
      amount,
      email
    );
    if (!customerInvoiceResponse[0]) return customerInvoiceResponse;

    await paymentUtil.createPaymentDoc(
      amount,
      customerInvoiceResponse[1],
      platform,
      debtorId,
      debtorName
    );
    return [
      true,
      {
        invoiceId: customerInvoiceResponse[1],
        amount: amount,
      },
    ];
  }

  async getStatementsSummary(id: string) {
    const debtor = await this.debtorRepository.getById<IDebtor>(id);
    if (!debtor) return [false, constantsUtil.notFoundMessage('debtor')];
    const {scoreCard} = await this.getScoreCard(debtor);
    const accountDetails = this.getAccountDetails(
      scoreCard['accountslist'].data
    );
    return [true, accountDetails];
  }

  async getStatmentsSummaryWithPF(id: string) {
    const debtor = await this.debtorRepository.getById<IDebtor>(id);
    if (!debtor) return [false, constantsUtil.notFoundMessage('debtor')];

    const {scoreCard} = await this.getScoreCard(debtor);

    const accountDetails = await this.processAccountData(
      scoreCard['accountslist'].data
    );

    const withdrawalSumsByMonth = await this.withdrawalSumsByMonth(
      scoreCard['monthlymca'].data
    );
    Object.keys(accountDetails).forEach(month => {
      const entry = accountDetails[month];
      const ans = entry.trueCredits - entry.totalDebits;
      const withdrawalTotal = Math.abs(withdrawalSumsByMonth[month] || 0);
      entry.profitMargin = (ans + withdrawalTotal).toFixed(2);
      entry.mcaWithholdPercent =
        Math.round(entry.mcaWithholdPercent / entry.count) + '%';
    });

    const result = this.getSortedAccountDetails(accountDetails);

    return [true, result];
  }

  async updateDebtorPausePayment(debtorId: string, amountCheck?: boolean) {
    const updatePayload = amountCheck
      ? {
          $inc: {paymentAmountCount: 1},
          $set: {
            lastPaymentAmountDate: commonUtil.getCurrentDate(),
            additionalCharge: false,
          },
        }
      : {
          $inc: {paymentPauseCount: 1},
          $set: {
            lastPaymentPauseDate: commonUtil.getCurrentDate(),
            additionalCharge: false,
          },
        };

    return this.debtorRepository.updateById<IDebtor>(debtorId, updatePayload);
  }

  async getDebtorAccounts(debtorId: string) {
    const debtorAccounts: IAccount[] =
      await this.accountRepository.getAll<IAccount>({
        debtorId: debtorId,
        isDeleted: {$ne: true},
      });
    return debtorAccounts.sort((a, b) => {
      const getRank = account => {
        if (
          account.platform === 'Easypay direct' &&
          account.paymentType === 'cc'
        )
          return 1;
        if (
          account.platform === 'Seamlesschex merchant' &&
          account.paymentType === 'cc'
        )
          return 2;
        if (account.platform === 'Paynote') return 3;
        if (account.platform === 'Seamlesschex') return 4;
        if (
          account.platform === 'Easypay direct' &&
          account.paymentType === 'ck'
        )
          return 5;
        if (
          account.platform === 'Seamlesschex merchant' &&
          account.paymentType === 'ck'
        )
          return 6;
        return 99;
      };

      return getRank(a) - getRank(b);
    });
  }

  async getACHAccounts(debtorId: string) {
    let debtorAccounts: IAccount[] =
      await this.accountRepository.getAll<IAccount>({
        debtorId: debtorId,
        isDeleted: {$ne: true},
      });
    let achAccounts = debtorAccounts.filter(
      account => account.platform === 'Paynote'
    );
    // return achAccounts.sort((a, b) => {
    //   const getRank = account => {
    //     if (account.platform === 'Paynote') return 1;
    //     if (account.platform === 'Seamlesschex') return 2;
    //     return 99;
    //   };

    //   return getRank(a) - getRank(b);
    // });
    return achAccounts;
  }

  async getSeamlesschexAccounts(debtorId: string) {
    let debtorAccounts: IAccount[] =
      await this.accountRepository.getAll<IAccount>({
        debtorId: debtorId,
        isDeleted: {$ne: true},
      });
    let achAccounts = debtorAccounts.filter(
      account => account.platform === 'Seamlesschex'
    );
    return achAccounts;
  }

  async getCCAccounts(debtorId: string) {
    let debtorAccounts: IAccount[] =
      await this.accountRepository.getAll<IAccount>({
        debtorId: debtorId,
        isDeleted: {$ne: true},
      });
    let ccAccounts = debtorAccounts.filter(
      account => account.paymentType === 'cc'
    );
    return ccAccounts;
  }

  async ifCCPresent(accounts: IAccount[]) {
    const present = accounts.some(account => account.paymentType === 'cc');
    return present;
  }

  async ifACHPresent(accounts: IAccount[]) {
    const findPaynoteOrSeamlesschex = accounts.some(
      account => account.paymentType === 'ACH'
    );
    return findPaynoteOrSeamlesschex;
  }

  async createAccount(
    id: string,
    paymentType: string,
    platform: string,
    vault: string,
    paynoteSourceId = ''
  ) {
    let validAccount = new Account();
    validAccount.debtorId = id;
    validAccount.paymentType = paymentType;
    validAccount.platform = platform;
    validAccount.logTrackingId = v4();
    validAccount.vault = vault;
    validAccount.paynoteSourceId = paynoteSourceId;

    return await this.accountRepository.create<IAccount>(validAccount as any);
  }
}

export default new DebtorUtil();
