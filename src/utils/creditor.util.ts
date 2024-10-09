import mongoose from 'mongoose';
import {CaseRepository} from '../api/repository/case/case.repository';
import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import commonUtil from './common.util';

class CreditorUtil {
  private creditorRepository: CreditorRepository;
  private caseRepository: CaseRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.caseRepository = new CaseRepository();
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
}
export default new CreditorUtil();
