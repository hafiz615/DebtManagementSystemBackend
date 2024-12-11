import mongoose from 'mongoose';
import {CaseRepository} from '../api/repository/case/case.repository';
import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import commonUtil from './common.util';
import {IDebtor} from '../database/interfaces/debtor.interface';
import caseUtil from './case.util';
import moneyThumbUtil from './moneyThumb.util';
import {StrategyRepository} from '../api/repository/strategy/strategy.repository';

class CreditorUtil {
  private creditorRepository: CreditorRepository;
  private caseRepository: CaseRepository;
  private strategyRepository: StrategyRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.caseRepository = new CaseRepository();
    this.strategyRepository = new StrategyRepository();
  }
  async checkCreditorsMapping(creditorsArray: any) {
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
        await this.creditorRepository.updateById<ICreditor>(
          creditor.creditorId,
          {
            accountTitleMapping: accountTitles,
            updatedAt: commonUtil.getCurrentDate(),
          }
        );
      }
    }
    return creditorsArray;
  }

  async getCreditorsEmailForDebtor(debtorId: string, creditorId = '') {
    const match = {
      debtor: new mongoose.Types.ObjectId(debtorId),
    };
    if (creditorId) {
      match['creditor'] = {$ne: new mongoose.Types.ObjectId(creditorId)};
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

  async addBreakEven(creditors: any) {
    console.log(creditors, 'kjkjkjkjk');
    for (const creditor of creditors) {
      const contractDetails = creditor.contractDetails;
      let amount = 0;
      if (contractDetails?.funded_amount) {
        amount = caseUtil.getCleanAmount(contractDetails?.funded_amount);
      } else if (contractDetails?.loan_amount) {
        amount = caseUtil.getCleanAmount(contractDetails?.loan_amount);
      }
      const paidBack = creditor.previousAmountPaid;
      const currentBalance = creditor.totalDebt - paidBack;
      let breakEven = amount * 1.2 - paidBack;
      if (breakEven <= 0) breakEven = currentBalance * 0.3;
      if (breakEven < 0) breakEven = 0;
      console.log(breakEven, 'popopo');
      creditor['breakEven'] = parseFloat(breakEven.toFixed(2));
    }
  }

  async addCreditorPercentagesAndGetPercentageCommission(
    creditors: any,
    debtor: IDebtor,
    scoreCard: any
  ) {
    const accounts = scoreCard['accountslist'];
    console.log(accounts.data.length, 'accounttttt');
    let trueCredit = 0;
    if (accounts.data.length) {
      trueCredit = await moneyThumbUtil.getMonthlyTrueCredit(accounts);
    }
    console.log(trueCredit, 'trueCredit');
    let totalRemaining = creditors.reduce(
      (sum, item) => sum + item.remaining,
      0
    );
    console.log(totalRemaining, 'totalRemaining');

    const weeklyBudgetStrategy3 = debtor?.weeklyBudgetStrategy3
      ? debtor.weeklyBudgetStrategy3
      : 0;
    console.log(weeklyBudgetStrategy3, 'weeklyBudgetStrategy3');
    let popup1Value = 0;
    if (debtor.weeklyBudgetKeyStrategy1 === 'strategy1Profit') {
      popup1Value = debtor.weeklyBudgetStrategy1;
    } else {
      const percent80 = debtor.weeklyBudgetStrategy1 * 0.8;
      popup1Value = percent80;
    }
    console.log(popup1Value, 'popppp');
    const aggressionData = await this.getCreditorWithAggression(creditors);
    console.log(aggressionData, 'aggressionData');
    for (const creditor of creditors) {
      console.log(debtor.weeklyBudgetStrategy3, 'debtor.weeklyBudgetStrategy3');
      console.log(totalRemaining, 'totalRemaining');
      console.log(creditor.remaining, 'creditor.remaining');
      const creditorPer = creditor.remaining / totalRemaining;
      console.log(creditorPer, 'creditorPer');
      creditor.maxProfitAmount =
        Math.round(creditorPer * popup1Value * 100) / 100;
      const percentage = creditorPer * weeklyBudgetStrategy3;
      creditor.percentageReceivable = Math.round(percentage * 100) / 100;
      console.log(
        creditor.percentageReceivable,
        'creditor.percentageReceivable'
      );
      creditor.percentageReceivableAmount = parseFloat(
        ((creditor.percentageReceivable / 100) * trueCredit).toFixed(2)
      );
      console.log(
        creditor.percentageReceivableAmount,
        'creditor.percentageReceivableAmount'
      );
    }
    if (Object.keys(aggressionData).length) {
      await this.aggressionAdjustment(creditors, aggressionData, popup1Value);
    }
    let maxProfitCommission = 0;
    if (debtor.weeklyBudgetKeyStrategy1 === 'strategy1Profit') {
      maxProfitCommission = debtor.trueProfit * 0.2;
    } else {
      maxProfitCommission = debtor.weeklyBudgetStrategy1 * 0.2;
    }
    let receivableCommission = 0;
    if (debtor.weeklyBudgetKeyStrategy3 === 'strategy3Profit') {
      receivableCommission = debtor.trueProfit * 0.2;
    } else {
      const factor = ((debtor.weeklyBudgetStrategy3 / 0.8) * 0.2) / 100;
      receivableCommission = debtor.trueProfit * factor;
    }
    return [
      20,
      parseFloat(maxProfitCommission.toFixed(2)),
      parseFloat(receivableCommission.toFixed(2)),
    ];
  }

  async getCreditorWithAggression(creditors: any) {
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

  async aggressionAdjustment(creditors: any, data: any, value: number) {
    const amountToBeAdded = parseFloat((value * data.value).toFixed(2));
    const amountToBeSubtracted = parseFloat(
      (amountToBeAdded / (creditors.length - 1)).toFixed(2)
    );
    for (const creditor of creditors) {
      if (creditor.creditorAccountTitle === data.creditorAccountTitle) {
        creditor.maxProfitAmount += amountToBeAdded;
      } else {
        creditor.maxProfitAmount -= amountToBeSubtracted;
      }
    }
  }

  async addWeeklyTrueAmount(creditors: any, settlementRange: any) {
    if (settlementRange.percentage_settlement_over_weekly_true_revenue) {
      const settlementWeeklyRevenue =
        settlementRange.percentage_settlement_over_weekly_true_revenue;
      for (const creditor of creditors) {
        if (settlementWeeklyRevenue[creditor.creditorAccountTitle]) {
          console.log(
            settlementWeeklyRevenue[creditor.creditorAccountTitle],
            'settlementWeeklyRevenue[creditor.creditorAccountTitle]'
          );
          const recommendations =
            settlementWeeklyRevenue[creditor.creditorAccountTitle];
          const recommendation1 = recommendations['recommendation 1'];
          console.log(recommendation1, 'recommendation1');
          const amount =
            (recommendation1.max / 100) * settlementRange.weekly_true_revenue;
          console.log(amount, 'amounttttt');
          creditor.weeklyTrueRevenueAmount = Math.round(amount * 100) / 100;
        } else {
          creditor.weeklyTrueRevenueAmount = 0;
        }
      }
    }
  }

  async replaceSettlementRangeAndWeeksTillPaid(
    creditors: any,
    settlementRange: any,
    caseId: string
  ) {
    let newWeeks = [];
    let newAmount = 0;
    for (const creditor of creditors) {
      if (
        settlementRange.settlement_range &&
        settlementRange.settlement_range[creditor.creditorAccountTitle]
      ) {
        settlementRange.settlement_range[creditor.creditorAccountTitle][
          'recommendation 1'
        ].max = creditor.maxProfitAmount;
        newAmount += creditor.maxProfitAmount;
      }
      if (
        settlementRange.weeks_till_paid &&
        settlementRange.weeks_till_paid[creditor.creditorAccountTitle]
      ) {
        const weeks = Math.round(creditor.remaining / creditor.maxProfitAmount);
        settlementRange.weeks_till_paid[creditor.creditorAccountTitle][
          'Weeks remaining based on recommendation 1'
        ].max = weeks;
        newWeeks.push(weeks);
      }
    }
    if (newAmount) {
      settlementRange.settlement_range.Summary['recommendation 1'].max =
        newAmount;
    }
    if (newWeeks) {
      settlementRange.weeks_till_paid.Summary[
        'Weeks remaining based on recommendation 1'
      ].max = Math.max(...newWeeks);
    }
    await this.strategyRepository.upsert(
      {caseId: caseId, name: 'strategy_one'},
      {
        'data.settlementRange': settlementRange,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
  }
}
export default new CreditorUtil();
