import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {CheckRepository} from '../api/repository/check/check.repository';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import commonUtil from './common.util';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {parseStringPromise} from 'xml2js';
import {SyncPaymentMethodRepository} from '../api/repository/ISyncPaymentMethod/syncPaymentMethod.repository';
import {Constants} from 'authorizenet';
dotenv.config();

class EasypayUtil {
  private creditorRepository: CreditorRepository;
  private checkRepository: CheckRepository;
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;
  private syncPaymentMethodRepository: SyncPaymentMethodRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.checkRepository = new CheckRepository();
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
    this.syncPaymentMethodRepository = new SyncPaymentMethodRepository();
  }

  async getEasyPayCustomers(platform: string) {
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
      !json.nm_response?.customer_vault?.customer &&
      !json.nm_response?.customer_vault?.customer.length
    )
      return [false, 'Unable To Find Data'];

    const customers = json.nm_response.customer_vault.customer;
    console.log(customers.length, 'customers.length');
    // console.log(debtor, 'klklklk');
    return customers;
  }

  async convertXmlToJson(xmlData: string) {
    return await parseStringPromise(xmlData, {explicitArray: false});
  }

  async checkClientExist(
    users: any,
    debtorEmail: string,
    platform: string,
    _id: string,
    existingDebtor: any,
  ) {
    let update = {easyPayUserId: ''};

    const easyPayEmails = users.map(user => {
      return user.email.toLowerCase();
    });
    
    // const index = easyPayEmails.indexOf(debtorEmail);

    // if (index === -1) return [false, `Could Not Found the User in ${platform}`];
    const indices = easyPayEmails.reduce((acc, email, index) => {
      if (email === debtorEmail) {
        acc.push(index);
      }
      return acc;
    }, []);

    if (indices.length === 0) {
      return [false, `Could not find the user in ${platform}`];
    }

    const userIds: string[] = []; 

    for(const index of indices){
      
      const email = users[index].email.toLowerCase();

      let paymentType = '';

      if (users[index].cc_number) paymentType = 'cc';
      if (users[index].check_account) paymentType = 'ck';
      console.log(email, 'user.email');
      console.log(paymentType, 'paymentType');
      console.log(users[index].customer_vault_id, 'user.customer_vault_id');
      console.log(platform, 'platform');

      const customerVaultExists = existingDebtor.accounts?.some(
        (account) => account.customerVaultId === users[index].customer_vault_id
      );

      if(customerVaultExists) {userIds.push(users[index].customer_vault_id); continue;}

      await this.debtorRepository.updateById<IDebtor>(_id, {
        $push: {
          accounts: {
            $each: [
              {
                paymentType: paymentType,
                customerVaultId: users[index].customer_vault_id,
                platform: platform,
              },
            ],
          },
        },
        updatedAt: commonUtil.getCurrentDate(),
      });
      userIds.push(users[index].customer_vault_id);
    }
    update['userIds'] = userIds;
    return [true, update];
  }

  async upsertDebtorEasyPayEmail(
    debtorId: string,
    email: string,
    platform: string,
    customerVaultIds: string
  ) {
    for(const customerVaultId of customerVaultIds){
      await this.syncPaymentMethodRepository.upsert(
        {syncId: debtorId,platform: platform},
        {
          email: email,
          updatedAt: commonUtil.getCurrentDate(),
        }
      );
    }
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
