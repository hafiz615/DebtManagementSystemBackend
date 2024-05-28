import cron from 'node-cron';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IPayment} from '../database/interfaces/payment.interface';
import paymentUtil from '../utils/payment.util';
console.log('i am here');

class CronJob {
  private paymentRepository: PaymentRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
  }
  startCronJob() {
    cron.schedule('* * * * *', async () => {
      console.log('Running a task every minute');
      const payments: any = await paymentUtil.getAllCronJobPayments();
    });
  }

  // getFilteredPayment(result: any) {
  // const {authorizationInterval} = settings.paymentsAuthorizations;

  // const pendingAuthorized = result[0].pendingAuthorized.filter(payment => {
  // const interval = authorizationInterval[payment.timePeriod.toLowerCase()];
  //   return this.shouldAuthorize(interval.unit, interval.value, payment);
  // });

  // const pendingCaptured = result[0].pendingCaptured.filter(payment => {
  // const interval =
  //   authorizationInterval[
  //     payment.timePeriod.toLowerCase()
  //   ];
  //     return this.shouldAuthorize(interval.unit, interval.value, payment);
  //   });

  //   const failedAuthorized = result[0].failedAuthorized.filter(payment => {
  //     const interval =
  //       authorizationInterval[
  //         payment.timePeriod.toLowerCase() as keyof AuthorizationInterval
  //       ];
  //     return shouldAuthorize(interval.unit, interval.value, payment);
  //   });

  //   const failedCaptured = result[0].failedCaptured.filter(payment => {
  //     const interval =
  //       authorizationInterval[
  //         payment.timePeriod.toLowerCase() as keyof AuthorizationInterval
  //       ];
  //     return this.shouldAuthorize(interval.unit, interval.value, payment);
  //   });
  // }
  shouldAuthorize(unit: string, value: number, payment: IPayment): boolean {
    const dueDate = new Date(payment.dueDate);
    const currentDate = new Date();

    let thresholdDate = new Date(dueDate);
    switch (unit) {
      case 'hours':
        thresholdDate.setHours(dueDate.getHours() - value);
        break;
      case 'days':
        thresholdDate.setDate(dueDate.getDate() - value);
        break;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }

    return currentDate >= thresholdDate;
  }

  defaultAuthInterval() {
    const authorizationInterval = {
      custom: {unit: 'hours', value: 3},
      daily: {unit: 'hours', value: 5},
      weekly: {unit: 'days', value: 3},
      fortnightly: {unit: 'days', value: 2},
      monthly: {unit: 'days', value: 1},
    };
  }
}

export default new CronJob();
