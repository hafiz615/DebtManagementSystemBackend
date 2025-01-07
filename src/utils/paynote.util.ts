import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {IPayment} from '../database/interfaces/payment.interface';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import constantsUtil from './constants.util';
import {SyncCreditorRepository} from '../api/repository/syncCreditor/syncCreditor.repository';
import commonUtil from './common.util';
dotenv.config();

class PaynoteUtil {
  private creditorRepository: CreditorRepository;
  private syncCreditorRepository: SyncCreditorRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.syncCreditorRepository = new SyncCreditorRepository();
  }
  async createCustomer(creditor: ICreditor) {
    if (!creditor.basicInformation?.fullName)
      return {
        error: true,
        message: constantsUtil.notFoundMessage('creditor name'),
      };
    const creditorNames = creditor.basicInformation?.fullName?.split(' ');
    if (!creditor?.basicInformation?.email)
      return {
        error: true,
        message: constantsUtil.notFoundMessage('creditor email'),
      };
    let lastName = '';
    if (!creditorNames[1]) {
      lastName = creditorNames[0];
    } else {
      lastName = creditorNames.slice(1).join(' ');
    }
    const apiUrl = `${process.env.paynoteUrl}/user`;
    var data = {
      firstName: creditorNames[0],
      lastName: lastName,
      email: creditor.basicInformation.email,
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
      if (response.data?.success) {
        this.creditorRepository.updateById<ICreditor>(creditor._id, {
          paynoteUserId: response.data?.user?.user_id,
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
    const creditor = payment.caseId.creditor;
    console.log(payment.caseId.creditor.paynoteUserId);
    const desc = payment.caseId?.creditor?.businessInformation.companyName
      ? payment.caseId?.creditor?.businessInformation.companyName
      : payment.caseId?.creditor?.basicInformation.fullName;
    var data = {
      recipient: payment.caseId?.creditor?.paynoteUserId,
      name: creditor.basicInformation?.fullName,
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
      console.log(response, 'popopop');
      return response.data;
    } catch (error) {
      console.log(error?.response?.data, 'okokokoko');
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
      console.log(response.data);
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

  async updateFundingSource(data: any, userId: string) {
    const apiUrl = `${process.env.paynoteUrl}/funding-source/update`;
    data['user_id'] = userId;
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
      return response.data;
    } catch (error) {
      return error.message;
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
      return error.message;
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
      console.log(result?.error, 'result?.error 1');
      return;
    }
    await this.processAllUsersResult(result.list.data, creditorEmails);
    console.log(result.list.last_page, 'result.list.last_page');
    const lastPage = result.list.last_page;
    if (lastPage > page) {
      for (let i = page + 1; i <= lastPage; i++) {
        const result = await this.getAllCustomerDetails(i, limit);
        if (result?.error) {
          console.log(result?.error, 'result?.error processAllUsersResult 2');
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
      console.log(email, 'user.email');
      console.log(update, 'update');
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
      // update['paynoteSourceVerified'] = false;
      return [false, update];
    }
    update['paynoteUserFound'] = true;
    update['paynoteUserId'] = users[index].user_id;
    console.log(users[index], 'users[index]');
    // let sourceVerified = false;
    // for (const source of users[index].sources) {
    //   if (source.status === 'verified') {
    //     sourceVerified = true;
    //     update['paynoteSourceId'] = source.source_id;
    //     break;
    //   }
    // }
    // update['paynoteSourceVerified'] = sourceVerified;
    return [true, update];
  }

  async updateSyncCreditorObject(data: any, creditorId: string) {
    await this.creditorRepository.updateById(creditorId, data);
  }

  async upsertCreditorPaynoteEmail(creditorId: string, email: string) {
    await this.syncCreditorRepository.upsert(
      {creditorId: creditorId},
      {
        email: email,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
  }
}

export default new PaynoteUtil();
