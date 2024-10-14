import {CaseRepository} from '../api/repository/case/case.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {ICase} from '../database/interfaces/case.interface';
import {IDebtor} from '../database/interfaces/debtor.interface';
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
    const strategy3Budget = body[strategy3Key];

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
    debtorId: string,
    totalStatements: number,
    debtorName: string
  ) {
    const token = await moneyThumbUtil.authenticateUser();
    const moneyThumbApp = await moneyThumbUtil.createNewApp(token, debtorId);
    if (moneyThumbApp['totalstatements'] > totalStatements) {
      const scoreCard = await moneyThumbUtil.getScoreCard(
        token,
        moneyThumbApp['appid']
      );
      const accounts = scoreCard['accountslist'];
      if (accounts.length > 1) {
        const len = accounts.length;
        const percentageChange = await commonUtil.calculatePercentageChange(
          parseFloat(accounts[len - 2]['true_credits']),
          parseFloat(accounts[len - 1]['true_credits'])
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
        const previousMonth = accounts[len - 2]['statement_month'];
        const previousYear = accounts[len - 2]['statement_year'];
        const currentMonth = accounts[len - 1]['statement_month'];
        const currentYear = accounts[len - 1]['statement_year'];
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
          accounts[len - 2]['true_credits'],
          accounts[len - 1]['true_credits'],
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
          accounts[len - 2]['true_credits'],
          accounts[len - 1]['true_credits'],
          percentageChange
        );
      }
    }
  }
}
export default new DebtorUtil();
