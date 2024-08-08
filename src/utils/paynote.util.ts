import {ICreditor} from '../database/interfaces/creditor.interface';
import {IPayment} from '../database/interfaces/payment.interface';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
dotenv.config();

class PaynoteUtil {
  async createCustomer(creditor: ICreditor) {
    const creditorNames = creditor.basicInformation.fullName.split(' ');
    let lastName = '';
    if (!creditorNames[1]) {
      lastName = creditorNames[0];
    }
    const apiUrl = `${process.env.paynoteSandboxUrl}/user`;
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
      return response.data;
    } catch (error) {
      return error.message;
    }
  }

  async getCustomer(creditor: ICreditor) {
    const apiUrl = `${process.env.paynoteSandboxUrl}/user/${creditor.paynoteUserId}`;
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
      return error.message;
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

    const apiUrl = `${process.env.paynoteSandboxUrl}/user/${creditor.paynoteUserId}/update`;
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
      return error.message;
    }
  }

  async sendPayment(creditor: ICreditor, payment: IPayment) {
    const apiUrl = `${process.env.paynoteSandboxUrl}/check/send`;
    var data = {
      recipient: creditor.paynoteSourceId,
      name: creditor.basicInformation.fullName,
      amount: payment.amount,
      description: 'Sending payment to creditor',
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
      return error.message;
    }
  }
}

export default new PaynoteUtil();
