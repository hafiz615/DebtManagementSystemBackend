import {CaseRepository} from '../api/repository/case/case.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {ICase} from '../database/interfaces/case.interface';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Debtor} from '../database/repomodels/debtor.repomodel';
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
    debtorName: string
  ) {
    const token = await moneyThumbUtil.authenticateUser();
    const moneyThumbApp = await moneyThumbUtil.createNewApp(
      token,
      debtorCompanyName
    );
    if (moneyThumbApp['totalstatements'] > totalStatements) {
      const scoreCard = await moneyThumbUtil.getScoreCard(
        token,
        moneyThumbApp['appid']
      );
      const accounts = scoreCard['accountslist'];
      if (accounts.data.length > 1) {
        const len = accounts.data.length;
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
        if (percentageChange > -1) {
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
          percentageChange
        );
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

  async getPaidAmountOfCreditors(debtorCompanyName: string) {
    const lastLenderOccurrences = {};
    const token = await moneyThumbUtil.authenticateUser();
    const moneyThumbApp = await moneyThumbUtil.createNewApp(
      token,
      debtorCompanyName
    );
    const scoreCard = await moneyThumbUtil.getScoreCard(
      token,
      moneyThumbApp['appid']
    );
    if (scoreCard['mcacompanies']) {
      const mcaCompanies = scoreCard['mcacompanies'];
      const data = mcaCompanies.data;
      for (let i = 0; i < data.length; i++) {
        if (data[i].month === 'Totals') {
          lastLenderOccurrences[data[i].lender] = {
            withdrawal_total: Math.abs(parseFloat(data[i].withdrawal_total)),
          };
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
    const yearlyResults = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };
    for (const account of accounts) {
      yearlyResults[account.statement_month] =
        yearlyResults[account.statement_month] +
        parseFloat(account.true_credits);
    }
    return Object.values(yearlyResults);
  }

  async getYearlyProfitMargin(scoreCard: any) {
    const mcaCompanies = scoreCard['mcacompanies']['data'];
    const metricData = scoreCard['metrics']['metricdata'];
    const result =
      await moneyThumbUtil.getweeklyProfitAndTrueRevenue(metricData);
    const yearlyResults = {
      January: 0,
      February: 0,
      March: 0,
      April: 0,
      May: 0,
      June: 0,
      July: 0,
      August: 0,
      September: 0,
      October: 0,
      November: 0,
      December: 0,
    };
    for (const mca of mcaCompanies) {
      if (mca.month === 'Totals') continue;
      const month = mca.month.split(' ')[0];
      const creditorProfitMargin =
        (Math.abs(parseFloat(mca.withdrawal_total)) + result.weeklyProfit) /
        result.weeklyTrueRevenue;
      const inPercentage = (Math.round(creditorProfitMargin * 100) / 100) * 100;
      console.log(inPercentage, 'inPercentageeeeee');
      yearlyResults[month] = yearlyResults[month] + inPercentage;
    }
    return Object.values(yearlyResults);
  }

  async getScoreCard(debtor: IDebtor) {
    const token = await moneyThumbUtil.authenticateUser();
    let appid = 0;
    if (debtor.appid) appid = debtor.appid;
    if (!debtor.appid) {
      const moneyThumbApp = await moneyThumbUtil.createNewApp(
        token,
        debtor.businessInformation.companyName
      );
      appid = moneyThumbApp['appid'];
    }
    const scoreCard = await moneyThumbUtil.getScoreCard(token, appid);
    return {scoreCard, appid};
  }
}
export default new DebtorUtil();
