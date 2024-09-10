import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import commonUtil from './common.util';

class CreditorUtil {
  private creditorRepository: CreditorRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
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
}
export default new CreditorUtil();
