import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {CheckRepository} from '../api/repository/check/check.repository';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import commonUtil from './common.util';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {parseStringPromise} from 'xml2js';
dotenv.config();

class EasypayUtil {
  private creditorRepository: CreditorRepository;
  private checkRepository: CheckRepository;
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.checkRepository = new CheckRepository();
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
  }

  async syncClients(platform: string) {
    const urlSecurityKey = await commonUtil.getUrlAndSecurityKeyQuery(platform);
    const url = urlSecurityKey.url;
    const params = {
      report_type: 'customer_vault',
      security_key: urlSecurityKey.securityKey,
    };
    console.log(url, 'urlllllll');
    const response = await axiosInstance.get(url, {params});
    const json = await this.convertXmlToJson(response.data);
    if (
      json.nm_response?.customer_vault?.customer &&
      json.nm_response?.customer_vault?.customer.length
    ) {
      const customers = json.nm_response.customer_vault.customer;
      console.log(customers.length, 'customers.length');
      const allDebtors: IDebtor[] =
        await this.debtorRepository.getAllWithoutPagination<IDebtor>();
      const debtorEmails = allDebtors
        .filter(debtor => debtor.basicInformation.email) // Filter creditors with an email
        .map(debtor => debtor.basicInformation.email.toLowerCase());
      console.log(debtorEmails, 'klklklk');
      await this.processAllUsersResults(customers, debtorEmails, platform);
    }
  }

  async convertXmlToJson(xmlData: string) {
    try {
      return await parseStringPromise(xmlData, {explicitArray: false});
    } catch (error) {
      console.error('Error parsing XML:', error);
    }
  }

  async processAllUsersResults(
    users: any,
    debtorEmails: string[],
    platform: string
  ) {
    for (const user of users) {
      const email = user.email.toLowerCase();
      let paymentType = '';
      if (debtorEmails.includes(email)) {
        if (user.cc_number) paymentType = 'cc';
        if (user.check_account) paymentType = 'ck';
        console.log(email, 'user.email');
        console.log(paymentType, 'paymentType');
        console.log(user.customer_vault_id, 'user.customer_vault_id');
        console.log(platform, 'platform');
        await this.debtorRepository.updateByOne<IDebtor>(
          {'basicInformation.email': email},
          {
            $push: {
              accounts: {
                $each: [
                  {
                    paymentType: paymentType,
                    customerVaultId: user.customer_vault_id,
                    platform: platform,
                  },
                ],
              },
            },
            updatedAt: commonUtil.getCurrentDate(),
          }
        );
      }
    }
  }
}

export default new EasypayUtil();
