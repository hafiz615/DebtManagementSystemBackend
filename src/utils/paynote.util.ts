import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {IPayment} from '../database/interfaces/payment.interface';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import constantsUtil from './constants.util';
dotenv.config();

class PaynoteUtil {
  private creditorRepository: CreditorRepository;
  constructor() {
    this.creditorRepository = new CreditorRepository();
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
    var data = {
      recipient: payment.caseId?.creditor?.paynoteUserId,
      name: creditor.basicInformation?.fullName,
      amount: payment.amount,
      description: `Payment: ${String(
        payment._id
      )} Sending payment to creditor for ${payment.caseId.caseCode}`,
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

  async getAllCustomerDetails() {
    const page = 1;
    const limit = 100;
    const apiUrl = `${process.env.paynoteUrl}/user?page=${page}&limit=${limit}`;
    console.log('I am in getAllCustomerDetails');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response: any = await axiosInstance.get(apiUrl, {
        headers: {
          Authorization: 'process.env.paynoteSecretKey',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.log(error, 'erorr');
      return error.response.data;
    }
  }

  async syncProdUsers() {
    const allCreditors: ICreditor[] =
      await this.creditorRepository.getAllWithoutPagination<ICreditor>();
    const creditorEmails = allCreditors
      .filter(creditor => creditor.basicInformation.email) // Filter creditors with an email
      .map(creditor => creditor.basicInformation.email);
    console.log(creditorEmails, 'kokoko');
    const result = await this.getAllCustomerDetails();
    if (result?.error) {
      let message = '';
      if (result?.messages) {
        message = result.messages[0];
      } else {
        message = result.message;
      }
    }
    const users = result.list.data;
    for (const user of users) {
      if (creditorEmails.includes(user.email)) {
        let sourceVerifiedMessage = false;
        for (const source of user.sources) {
          if (source.is_primary) {
            if (source.status === 'verified') sourceVerifiedMessage = true;
          }
        }
      }
    }
  }
}

export default new PaynoteUtil();
