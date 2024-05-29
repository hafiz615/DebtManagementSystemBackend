import cron from 'node-cron';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IPayment} from '../database/interfaces/payment.interface';
import paymentUtil from '../utils/payment.util';
import {SettingsRepository} from '../api/repository/setting/settings.repository';
import {ISettings} from '../database/interfaces/settings.interface';
import PaymentService from '../api/services/payment.service';
import {URLSearchParams} from 'url';
import {PaymentLoggingRepository} from '../api/repository/paymentLogging/paymentLogging.repository';
import {PaymentLogging} from '../database/repomodels/paymentLogging.repomodel';
import commonUtil from '../utils/common.util';
import {v4 as uuidv4} from 'uuid';
console.log('i am here');

class CronJob {
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private settingsRepository: SettingsRepository;
  private paymentLoggingRepository: PaymentLoggingRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.settingsRepository = new SettingsRepository();
    this.paymentService = new PaymentService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
  }
  startCronJob() {
    cron.schedule('* * * * *', async () => {
      console.log('Running a task every minute');
      const payments: any = await paymentUtil.getAllCronJobPayments();
      // await this.getFilteredPayment(payments);
    });
  }

  async getFilteredPayment() {
    const payments: any = await paymentUtil.getAllCronJobPayments();
    // await this.getFilteredPayment(payments);
    const settings = await this.settingsRepository.getAll<ISettings>();
    // await this.paymentRepository.updateMany<IPayment>(
    //   {},
    //   {timePeriod: 'Weekly'}
    // );
    const cronId = uuidv4();
    await this.pendingAuthorized(settings, payments, cronId);
    // const pendingCaptured = payments[0].pendingCaptured.filter(
    //   (payment: IPayment) => {
    //     const interval =
    //       authorizationInterval[payment.timePeriod.toLowerCase()];
    //     return this.shouldAuthorize(interval.unit, interval.value, payment);
    //   }
    // );
    // console.log(pendingCaptured, 'pendingCaptured');

    // const failedAuthorized = payments[0].failedAuthorized.filter(
    //   (payment: IPayment) => {
    //     const interval =
    //       authorizationInterval[payment.timePeriod.toLowerCase()];
    //     return this.shouldAuthorize(interval.unit, interval.value, payment);
    //   }
    // );
    // console.log(failedAuthorized, 'failedAuthorized');

    // const failedCaptured = payments[0].failedCaptured.filter(
    //   (payment: IPayment) => {
    //     const interval =
    //       authorizationInterval[payment.timePeriod.toLowerCase()];
    //     return this.shouldAuthorize(interval.unit, interval.value, payment);
    //   }
    // );
    // console.log(failedCaptured, 'failedCaptured');
  }
  shouldAuthorize(unit: string, value: number = 2, payment: IPayment): boolean {
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
    const paymentsAuthorizations = {
      authorizationInterval: {
        custom: {unit: 'hours', value: 2},
        daily: {unit: 'hours', value: 2},
        weekly: {unit: 'days', value: 2},
        fortnightly: {unit: 'days', value: 2},
        monthly: {unit: 'days', value: 2},
      },
    };
    return paymentsAuthorizations;
  }
  async pendingAuthorized(
    settings: ISettings[],
    payments: any,
    cronId: string
  ) {
    const {authorizationInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultAuthInterval();

    console.log(authorizationInterval, 'authorizationInterval');
    console.log(
      payments[0].pendingAuthorized.length,
      'payments[0].pendingAuthorized'
    );
    const pendingAuthorized = payments[0].pendingAuthorized.filter(
      (payment: IPayment) => {
        const interval =
          authorizationInterval[payment.timePeriod.toLowerCase()];
        return this.shouldAuthorize(interval.unit, interval.value, payment);
      }
    );
    console.log(pendingAuthorized, 'pendingAuthorizedd');
    const paymentType = 'Credit Card';
    for (const payment of pendingAuthorized) {
      console.log('calculation');
      if (paymentType === 'Credit Card') {
        console.log(payment.amount, 'payment.amount');
        const response = await this.paymentService.authorizeCreditCard(
          payment.amount,
          ''
        );
        // const transactionId = new URLSearchParams(response).get(
        //   'transactionid'
        // );
        // console.log(transactionId, 'transactionId');
        // await this.paymentRepository.updateById<IPayment>(payment._id, {
        //   transactionId: transactionId,
        // });
        // const responseText = new URLSearchParams(response).get('responsetext');
        // const paymentLogging = new PaymentLogging();
        // paymentLogging.caseId = String(payment.caseId);
        // paymentLogging.createdAt = commonUtil.getCurrentDate();
        // paymentLogging.paymentId = String(payment._id);
        // paymentLogging.cronId = cronId;
        // paymentLogging.successReason = responseText;
        // paymentLogging.transactionId = transactionId;
        // paymentLogging.paymentType = 'Credit Auth';
        // paymentLogging.debtor = String(payment.caseDetails.debtor);
        // await this.paymentLoggingRepository.create(paymentLogging as any);
      }
      break;
    }
  }
}

export default new CronJob();
