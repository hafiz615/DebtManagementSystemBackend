import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {ICase} from '../database/interfaces/case.interface';
import {IPayment} from '../database/interfaces/payment.interface';
import commonUtil from './common.util';

class PaymentUtil {
  async getFilteredPayments(payments: any) {
    const transformedArray = payments.map(obj => ({
      fullName: obj.caseId.debtor.basicInformation.fullName,
      SSID: obj.caseId.debtor.basicInformation.SSID,
      authorized: obj.authorized,
      captured: obj.captured,
      amount: obj.amount,
      dueDate: obj.dueDate,
      failedReasonAuthorization: obj.failedReasonAuthorization,
      failedReasonCaptured: obj.failedReasonCaptured,
    }));
    const failedPayments = transformedArray.filter(
      payment => payment.captured === 'failed'
    );
    const successPayments = transformedArray.filter(
      payment => payment.captured === 'success'
    );
    const failedAuthorizations = transformedArray.filter(
      payment => payment.authorized === 'failed'
    );
    const successAuthorizations = transformedArray.filter(
      payment => payment.authorized === 'success'
    );

    return {
      failedPayments: failedPayments,
      successPayments: successPayments,
      failedAuthorizations: failedAuthorizations,
      successAuthorizations: successAuthorizations,
    };
  }

  async getFilteredUpcomingPayments(cases: ICase[], currentDate: string) {
    const upcomingPayments = [];
    const buildUpcomingPayment = {};
    for (const tempCase of cases) {
      tempCase.intervals.forEach(interval => {
        if (
          new Date(interval.startDate).getTime() >
          new Date(currentDate).getTime()
        ) {
          const debtor: any = tempCase.debtor;
          buildUpcomingPayment['amount'] = interval.amount;
          buildUpcomingPayment['dueDate'] = interval.startDate;
          buildUpcomingPayment['fullName'] = debtor.basicInformation.fullName;
          buildUpcomingPayment['SSID'] = debtor.basicInformation.SSID;
          upcomingPayments.push(buildUpcomingPayment);
        }
      });
    }
    return upcomingPayments;
  }

  async getFilteredUpcomingPaymentsCase(tempCase: ICase) {
    let currentDate = commonUtil.getCurrentDate();
    const upcomingPayments = [];
    const buildUpcomingPayment = {};
    tempCase.intervals.forEach(interval => {
      if (
        new Date(interval.startDate).getTime() > new Date(currentDate).getTime()
      ) {
        const debtor: any = tempCase.debtor;
        buildUpcomingPayment['amount'] = interval.amount;
        buildUpcomingPayment['dueDate'] = interval.startDate;
        buildUpcomingPayment['fullName'] = debtor.basicInformation.fullName;
        buildUpcomingPayment['SSID'] = debtor.basicInformation.SSID;
        upcomingPayments.push(buildUpcomingPayment);
      }
    });
    return upcomingPayments;
  }
}
export default new PaymentUtil();
