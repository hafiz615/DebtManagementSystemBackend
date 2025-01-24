import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import constantsUtil from './constants.util';
import {SyncPaymentMethodRepository} from '../api/repository/ISyncPaymentMethod/syncPaymentMethod.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Check} from '../database/repomodels/check.repomodel';
import {CheckRepository} from '../api/repository/check/check.repository';
import {ICheck} from '../database/interfaces/check.interface';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IPayment} from '../database/interfaces/payment.interface';
import commonUtil from './common.util';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
dotenv.config();

class SeemlesschexUtil {
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
  async createCheck(
    debtor: IDebtor,
    amount: number,
    token: string,
    accountInfo: any
  ) {
    if (!debtor?.basicInformation?.email)
      return {
        error: true,
        message: constantsUtil.notFoundMessage('debtor email'),
      };
    if (!debtor?.basicInformation?.phone)
      return {
        error: true,
        message: constantsUtil.notFoundMessage('debtor phone'),
      };
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/create`;
    var data = {
      name: accountInfo.firstName + ' ' + accountInfo.lastName,
      email: debtor.basicInformation?.email,
      amount: amount,
      memo: `First Choice Debt Solutions`,
      token: token,
      store: 'firstchoice.com',
      verify_before_save: true,
      phone: debtor?.basicInformation?.phone,
    };
    console.log('I am in createCheck');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async getCheck(checkId: string) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/${checkId}`;
    console.log('I am in getCheck');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.get(apiUrl, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async checkBasicVerification(data: any) {
    const bv = data.check.basic_verification;
    switch (bv.pass_bv) {
      case 0:
        return {
          error: true,
          message: bv.description_bv,
        };
      case 1:
        return data;
    }
  }

  async checkFundsVerification(data: any) {
    const fc = data.check.funds_confirmation;
    switch (fc.pass_fc) {
      case 0:
        return {
          error: true,
          message: fc.description_fc,
        };
      case 1:
        return data;
    }
  }

  async createPaymentLink(amount: number) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/paymentlink/create`;
    var data = {
      amount: amount,
      basic_verification: true,
    };
    console.log('I am in createPaymentLink');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async updateCheck(
    debtor: IDebtor,
    token: string,
    checkId: string,
    accountInfo: any
  ) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/edit`;
    var data = {
      check_id: checkId,
      name: accountInfo.firstName + ' ' + accountInfo.lastName,
      email: debtor.basicInformation?.email,
      token: token,
      store: 'firstchoice.com',
      verify_before_save: true,
      fund_confirmation: true,
    };
    console.log('I am in updateCheck');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async voidCheck(checkId: string) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/check/${checkId}`;
    console.log('I am in voidCheck');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.delete(apiUrl, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async changePaymentLinkStatus(checkoutToken: string) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/paymentlink/changestatus/${checkoutToken}`;
    console.log('I am in changePaymentLinkStatus');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.post(apiUrl, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async deletePaymentLink(checkoutToken: string) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/paymentlink/${checkoutToken}`;
    console.log('I am in deletePaymentLink');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', {});
    try {
      const response = await axiosInstance.delete(apiUrl, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async saveCheckInfo(bv: any, fc: any, response: any, debtorId: string) {
    const newCheck = new Check();
    newCheck.checkId = response.check.check_id;
    newCheck.number = response.check.number;
    newCheck.status = response.check.status;
    newCheck.basicVerification = bv?.error ? 'Fail' : 'Pass';
    newCheck.fundsConfirmation = fc?.error ? 'Fail' : 'Pass';
    newCheck.bvReason = bv?.error ? bv.message : '';
    // newCheck.fcReason = fc?.error ? fc.message : '';
    newCheck.debtorId = debtorId;
    await this.checkRepository.create<ICheck>(newCheck);
  }

  async deleteCheckInfo(checkId: string, status: string) {
    const check = await this.checkRepository.updateByOne<ICheck>(
      {checkId: checkId},
      {isDeleted: true, status: status}
    );
  }

  async getCheckInfo(checkId: string) {
    return await this.checkRepository.getOne<ICheck>(
      {checkId: checkId},
      {isDeleted: false}
    );
  }

  async tokenization(accountInfoObject: any) {
    const apiUrl = `${process.env.seamlesschexUrl}/${process.env.seamlesschexVersion}/account/tokenization`;

    const data = {
      first_name: accountInfoObject.firstName,
      last_name: accountInfoObject.lastName,
      bank_routing: accountInfoObject.bankRouting,
      bank_account: accountInfoObject.bankAccount,
      store: 'firstchoice.com',
    };
    console.log('I am in tokenization');
    console.log('URL: ', apiUrl);
    console.log('Payload: ', data);
    try {
      const response = await axiosInstance.post(apiUrl, data, {
        headers: {
          Authorization: process.env.seamlesschexKey,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return error?.response?.data;
    }
  }

  async updateCheckInfo(bv: any, fc: any, response: any, checkId: string) {
    const data = {
      status: response.check.status,
      basicVerification: bv?.error ? 'Fail' : 'Pass',
      fundsConfirmation: fc?.error ? 'Fail' : 'Pass',
      bvReason: bv?.error ? bv.message : '',
      // fcReason: fc?.error ? fc.message : '',
    };

    await this.checkRepository.updateByOne<ICheck>({checkId: checkId}, data);
  }

  async updateIfCheckDeleted(checkId: string, status: string) {
    const foundCheck = await this.checkRepository.getOne<ICheck>({
      checkId: checkId,
      isDeleted: false,
    });
    if (!foundCheck) return [true, ''];
    await this.deleteCheckInfo(checkId, status);
    await this.paymentRepository.updateMany<IPayment>(
      {debtorTransId: checkId},
      {
        authorized: 'Pending',
        captured: 'Pending',
        status: 'Upcoming',
        debtorTransId: '',
        transactionType: '',
        paymentGateway: '',
        manualCommission: 0,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    return [true, ''];
  }

  async updateIfCheckDeposited(checkId: string, status: string) {
    const foundCheck = await this.checkRepository.getOne<ICheck>({
      checkId: checkId,
      isDeleted: false,
    });
    if (!foundCheck) return [true, ''];
    const payment = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: checkId,
    });
    await this.checkRepository.updateByOne<ICheck>(
      {checkId: checkId},
      {status: status}
    );
    await this.paymentRepository.updateMany<IPayment>(
      {debtorTransId: checkId},
      {
        authorized: 'Success',
        captured: 'Success',
        status: 'Pending',
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    await this.debtorRepository.updateById<IDebtor>(foundCheck.debtorId, {
      $inc: {commissionPaid: payment.manualCommission},
    });
    return [true, ''];
  }

  async updateIfCheckFailed(checkId: string, status: string) {
    const foundCheck = await this.checkRepository.getOne<ICheck>({
      checkId: checkId,
      isDeleted: false,
    });
    if (!foundCheck) return [true, ''];
    await this.checkRepository.updateByOne<ICheck>(
      {checkId: checkId},
      {status: status}
    );
    await this.paymentRepository.updateMany<IPayment>(
      {debtorTransId: checkId},
      {
        captured: 'Failed',
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    return [true, ''];
  }
}

export default new SeemlesschexUtil();
