import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {IPayment} from '../database/interfaces/payment.interface';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import constantsUtil from './constants.util';
import {SyncPaymentMethodRepository} from '../api/repository/ISyncPaymentMethod/syncPaymentMethod.repository';
import commonUtil from './common.util';
import seemlesschexUtil from './seemlesschex.util';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {CheckRepository} from '../api/repository/check/check.repository';
import {ICheck} from '../database/interfaces/check.interface';
dotenv.config();

class PaynoteUtil {
  private creditorRepository: CreditorRepository;
  private syncPaymentMethodRepository: SyncPaymentMethodRepository;
  private debtorRepository: DebtorRepository;
  private paymentRepository: PaymentRepository;
  private checkRepository: CheckRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.syncPaymentMethodRepository = new SyncPaymentMethodRepository();
    this.debtorRepository = new DebtorRepository();
    this.paymentRepository = new PaymentRepository();
    this.checkRepository = new CheckRepository();
  }
  async createCustomer(
    id: string,
    name: string,
    email: string,
    modelRepository: any,
    addAccount?: boolean
  ) {
    if (!name)
      return {
        error: true,
        message: constantsUtil.notFoundMessage('name'),
      };
    const userNames = name.split(' ');
    if (!email)
      return {
        error: true,
        message: constantsUtil.notFoundMessage('email'),
      };
    let lastName = '';
    if (!userNames[1]) {
      lastName = userNames[0];
    } else {
      lastName = userNames.slice(1).join(' ');
    }
    const apiUrl = `${process.env.paynoteUrl}/user`;
    var data = {
      firstName: userNames[0],
      lastName: lastName,
      email: email,
    };
    console.log('I am in createCustomer');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      if (response.data?.success && !addAccount) {
        await modelRepository.updateById(id, {
          paynoteUserId: response.data?.user?.user_id,
          paynoteUserFound: true,
        });
      } else {
        await modelRepository.updateById(id, {
          $addToSet: {
            paynoteUserIds: response.data?.user?.user_id,
          },
        });
      }
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async getCustomer(creditor: ICreditor) {
    const apiUrl = `${process.env.paynoteUrl}/user/:${creditor.paynoteUserId}`;
    console.log('I am in getCustomer');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.get(apiUrl, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async updateCustomer(creditor: ICreditor) {
    const creditorNames = creditor.basicInformation.fullName.split(' ');
    let lastName = '';
    if (!creditorNames[1]) {
      lastName = creditorNames[0];
    } else {
      lastName = creditorNames.slice(1).join(' ');
    }

    var data = {
      firstName: creditorNames[0],
      lastName: lastName,
    };

    const apiUrl = `${process.env.paynoteUrl}/user/${creditor.paynoteUserId}/update`;
    console.log('I am in updateCustomer');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async sendPayment(payment: any) {
    const apiUrl = `${process.env.paynoteUrl}/check/send`;
    const companyName = payment.caseId?.debtor?.businessInformation.companyName;
    const creditorName =
      payment.caseId?.creditor?.basicInformation.fullName ||
      payment.lawsuitId?.lawfirmId?.lawfirmCompanyName;
    const desc = companyName + ' - ' + creditorName;
    var data = {
      recipient:
        payment.caseId?.creditor?.paynoteUserId ||
        payment.lawsuitId?.lawfirmId?.paynoteUserId,
      name: creditorName,
      amount: payment.amount,
      description: desc,
    };
    console.log('I am in sendPayment');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async getPayment(payment: any) {
    const apiUrl = `${process.env.paynoteUrl}/check/:${payment.checkId}`;
    console.log('I am in getCustomer');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.get(apiUrl, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async addFundingSource(data: any, userId: string) {
    const apiUrl = `${process.env.paynoteUrl}/on-demand/funding-source`;
    data['user_id'] = userId;
    console.log('I am in addFundingSource');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async initiateFundingSourceVerifcation(sourceId: string, userId: string) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/initiate/verification`;
    const data = {
      user_id: userId,
      source_id: sourceId,
    };
    console.log('I am in initiateFundingSourceVerifcation');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async verifyFundingSource(sourceId: string) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/verify`;
    const data = {
      source_id: sourceId,
      amount1: 0.01,
      amount2: 0.02,
    };
    console.log('I am in verifyFundingSource');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async updateFundingSource(data: any, user: any) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/update`;
    data['user_id'] = user.obj.paynoteUserId;
    data['source_id'] = user.obj.paynoteSourceId; // ADD BACK THIS LINE
    console.log('I am in updateFundingSource');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      await user.model.updateById(user.obj._id, {
        paynoteSourceId: response.data?.funding_source?.source_id,
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async removeFundingSource(sourceId: string, userId: string) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/remove`;
    const data = {
      user_id: userId,
      source_id: sourceId,
    };
    console.log('I am in removeFundingSource');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error;
    }
  }

  async getFundingSource(sourceId: any) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/:${sourceId}`;
    console.log('I am in getFundingSource');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: process.env.paynoteSecretKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return error.message;
    }
  }

  async getCustomerFundingSources(userId: any) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/user/:${userId}`;
    console.log('I am in getCustomerFundingSources');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: process.env.paynoteSecretKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      return error.message;
    }
  }

  async getAllCustomerDetails(page: number, limit: number) {
    const apiUrl = `${process.env.paynoteUrl}/user?page=${page}&limit=${limit}`;
    console.log('I am in getAllCustomerDetails');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response: any = await axiosInstance.get(apiUrl, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.log(error, 'erorr');
      return error.response.data;
    }
  }

  async syncUsersPaynote() {
    console.log('i am going to run syncUsersPaynote');
    let page = 1;
    let limit = 100;
    const allCreditors: ICreditor[] =
      await this.creditorRepository.getAllWithoutPagination<ICreditor>();
    const creditorEmails = allCreditors
      .filter(creditor => creditor.basicInformation.email) // Filter creditors with an email
      .map(creditor => creditor.basicInformation.email.toLowerCase());
    const result = await this.getAllCustomerDetails(page, limit);
    if (result?.error) {
      return;
    }
    await this.processAllUsersResult(result.list.data, creditorEmails);
    const lastPage = result.list.last_page;
    if (lastPage > page) {
      for (let i = page + 1; i <= lastPage; i++) {
        const result = await this.getAllCustomerDetails(i, limit);
        if (result?.error) {
          break;
        }
        await this.processAllUsersResult(result.list.data, creditorEmails);
      }
    }
  }

  async processAllUsersResult(users: any, creditorEmails: string[]) {
    let update = {};
    for (const user of users) {
      update = {paynoteUserId: ''};
      const email = user.email.toLowerCase();
      if (creditorEmails.includes(email)) {
        update['paynoteUserFound'] = true;
        update['paynoteUserId'] = user.user_id;
        // let sourceVerified = false;
        // for (const source of user.sources) {
        //   if (source.status === 'verified') {
        //     sourceVerified = true;
        //     update['paynoteSourceId'] = source.source_id;
        //     break;
        //   }
        // }
        // update['paynoteSourceVerified'] = sourceVerified;
      }
      if (!creditorEmails.includes(email)) {
        update['paynoteUserFound'] = false;
        // update['paynoteSourceVerified'] = false;
      }
      this.creditorRepository.updateByOne(
        {'basicInformation.email': email},
        update
      );
      update = {};
    }
  }

  async getPaynoteErrorMessage(result: any) {
    let message = '';
    if (result?.messages) {
      message = result.messages[0];
    } else {
      message = result.message;
    }
    return message;
  }

  async processSyncCreditorPaynote(users: any, creditorEmail: string) {
    let update = {paynoteUserId: ''};
    const paynoteEmails = users.map(user => {
      return user.email.toLowerCase();
    });
    const index = paynoteEmails.indexOf(creditorEmail);
    if (index === -1) {
      update['paynoteUserFound'] = false;
      return [false, update];
    }
    update['paynoteUserFound'] = true;
    update['paynoteUserId'] = users[index].user_id;
    update['paynoteSourceIds'] = users[index].sources;

    return [true, update];
  }

  async selectPreferredPaynoteSource(paynoteSources: any[]) {
    if (!Array.isArray(paynoteSources) || !paynoteSources.length) return null;

    const primaryVerified = paynoteSources.find(
      src => src.is_primary === true && src.status === 'verified'
    );
    if (primaryVerified) return primaryVerified;

    const nonPrimaryVerified = paynoteSources.find(
      src => src.is_primary === false && src.status === 'verified'
    );
    if (nonPrimaryVerified) return nonPrimaryVerified;

    return paynoteSources[0];
  }

  async updateSyncObject(data: any, creditorId: string, modelRepository: any) {
    const {paynoteSourceIds, ...rest} = data;
    await modelRepository.updateById(creditorId, rest);
  }

  async upsertPaynoteEmail(id: string, email: string) {
    await this.syncPaymentMethodRepository.upsert(
      {syncId: id},
      {
        email: email,
        platform: 'Paynote',
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
  }

  async addPaynoteAccount(
    id: string,
    paynoteUserId: string,
    paynoteSourceId: string
  ) {
    return await this.debtorRepository.updateById<IDebtor>(id, {
      $addToSet: {
        accounts: {
          $each: [
            {
              paymentType: 'ACH',
              paynoteUserId: paynoteUserId,
              paynoteSourceId: paynoteSourceId,
              platform: 'Paynote',
            },
          ],
        },
        paynoteSourceIds: {$each: [paynoteSourceId]},
      },
      updatedAt: commonUtil.getCurrentDate(),
    });
  }
  async directDebit(id: string, payment: any, debtor: IDebtor) {
    const apiUrl = `${process.env.paynoteUrl}/ach-debit`;
    const companyName = debtor?.businessInformation.companyName;
    const debtorName = debtor?.basicInformation.fullName;
    const data = {
      sender: id,
      name: debtorName,
      amount: payment.amount,
      description: companyName,
    };
    console.log('I am in directDebit');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.paynoteSecretKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async paynoteWebhook(response: any) {
    if (response?.event) {
      const checkId = response.check.check_id;
      const updateObj = {
        status: 'Pending',
        updatedAt: commonUtil.getCurrentDate(),
      };
      if (response.check.status !== 'processed') {
        updateObj['captured'] = 'Failed';
        updateObj['failedReasonCaptured'] =
          response.check.error_explanation ||
          response.check.error_description ||
          constantsUtil.Messages.CHECK_VOIDED;
      }
      switch (response.event) {
        case 'transaction.status':
          switch (response.check.status) {
            case 'processed':
              updateObj['captured'] = 'Success';
              updateObj['checkStatus'] = 'Completed';
              await this.updateCheckAndPayment(
                checkId,
                updateObj,
                response.check.status
              );
              break;
            case 'cancelled':
              await this.updateCheckAndPayment(
                checkId,
                updateObj,
                response.check.status
              );
              break;
            case 'declined':
              await this.updateCheckAndPayment(
                checkId,
                updateObj,
                response.check.status
              );
              break;
            case 'failed':
              await this.updateCheckAndPayment(
                checkId,
                updateObj,
                response.check.status
              );
              break;
            case 'expired':
              await this.updateCheckAndPayment(
                checkId,
                updateObj,
                response.check.status
              );
              break;
          }
          break;
      }
    }
    return [true, ''];
  }

  async updateCheckAndPayment(
    checkId: string,
    updatePaymentObj: any,
    status: string
  ) {
    const payment = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: checkId,
    });
    if (!payment) return [true, ''];
    await this.checkRepository.updateByOne<ICheck>(
      {checkId: checkId, isDeleted: false},
      {status: status}
    );
    await this.paymentRepository.updateMany<IPayment>(
      {debtorTransId: checkId},
      updatePaymentObj
    );
    return [true, ''];
  }
}

export default new PaynoteUtil();
