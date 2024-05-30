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
    await this.pendingCaptured(payments, cronId);
    await this.failedAuthorized(payments, cronId, settings);
    await this.failedCaptured(payments, cronId, settings);
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
  shouldAuthorize(unit: string, value: number, payment: IPayment): boolean {
    const dueDate = new Date(payment.dueDate);
    const currentDate = new Date(commonUtil.getCurrentDate());

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
  defaultRetryInterval() {
    const paymentsAuthorizations = {
      retryInterval: {
        failedAuthorization: {
          unit: 'hours',
          value: 2,
          maxRetry: 1,
        },
        failedPayment: {
          unit: 'days',
          value: 2,
          maxRetry: 1,
        },
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
    await this.processAuthorized(pendingAuthorized, cronId, false);
    // const paymentType = 'Credit Card';
    // for (const payment of pendingAuthorized) {
    //   console.log('calculation');
    //   if (paymentType === 'Credit Card') {
    //     console.log(payment.amount, 'payment.amount');
    //     const response = await this.paymentService.authorizeCreditCard(
    //       payment.amount,
    //       ''
    //     );
    //     const responseNum = new URLSearchParams(response).get('response');
    //     const responseText = new URLSearchParams(response).get('responsetext');
    //     const paymentLogging = new PaymentLogging();

    //     if (responseNum === '1') {
    //       const transactionId = new URLSearchParams(response).get(
    //         'transactionid'
    //       );
    //       console.log(transactionId, 'transactionId');
    //       await this.paymentRepository.updateById<IPayment>(payment._id, {
    //         transactionId: transactionId,
    //         authorized: 'Success',
    //         status: 'Pending',
    //       });

    //       paymentLogging.successReason = responseText;
    //       paymentLogging.transactionId = transactionId;
    //     } else {
    //       await this.paymentRepository.updateById<IPayment>(payment._id, {
    //         authorized: 'Failed',
    //         status: 'Pending',
    //       });
    //       const responseText = new URLSearchParams(response).get(
    //         'responsetext'
    //       );
    //       paymentLogging.failReason = responseText;
    //     }
    //     paymentLogging.caseId = String(payment.caseId);
    //     paymentLogging.createdAt = commonUtil.getCurrentDate();
    //     paymentLogging.paymentId = String(payment._id);
    //     paymentLogging.cronId = cronId;
    //     paymentLogging.paymentType = 'Credit Auth';
    //     paymentLogging.debtor = String(payment.caseDetails.debtor);
    //     await this.paymentLoggingRepository.create(paymentLogging as any);
    //   }
    // }
  }

  async pendingCaptured(payments: any, cronId: string) {
    const currentDate = new Date(commonUtil.getCurrentDate());
    const pendingCaptured = payments[0].pendingAuthorized.filter(
      (payment: IPayment) => {
        return currentDate.getTime() <= new Date(payment.dueDate).getTime();
      }
    );
    await this.processCapture(pendingCaptured, cronId, false);
    // const paymentType = 'Credit Card';
    // for (const payment of pendingCaptured) {
    //   if (paymentType === 'Credit Card') {
    //     const response = await this.paymentService.captureCreditCard(
    //       '',
    //       payment.transactionId
    //     );
    //     const responseNum = new URLSearchParams(response).get('response');
    //     const responseText = new URLSearchParams(response).get('responsetext');
    //     const paymentLogging = new PaymentLogging();

    //     if (responseNum === '1') {
    //       const transactionId = new URLSearchParams(response).get(
    //         'transactionid'
    //       );
    //       console.log(transactionId, 'transactionId');
    //       await this.paymentRepository.updateById<IPayment>(payment._id, {
    //         captured: 'Success',
    //         status: 'Success',
    //       });

    //       paymentLogging.successReason = responseText;
    //       paymentLogging.transactionId = transactionId;
    //     } else {
    //       await this.paymentRepository.updateById<IPayment>(payment._id, {
    //         captured: 'Failed',
    //       });
    //       const responseText = new URLSearchParams(response).get(
    //         'responsetext'
    //       );
    //       paymentLogging.failReason = responseText;
    //     }
    //     paymentLogging.caseId = String(payment.caseId);
    //     paymentLogging.createdAt = commonUtil.getCurrentDate();
    //     paymentLogging.paymentId = String(payment._id);
    //     paymentLogging.cronId = cronId;
    //     paymentLogging.paymentType = 'Credit Capture';
    //     paymentLogging.debtor = String(payment.caseDetails.debtor);
    //     await this.paymentLoggingRepository.create(paymentLogging as any);
    //   }
    // }
  }

  retry(unit: string, value: number, payment: IPayment): boolean {
    const dueDate = new Date(payment.dueDate);
    const currentDate = new Date(commonUtil.getCurrentDate());

    let thresholdDate = new Date(dueDate);
    switch (unit) {
      case 'hours':
        thresholdDate.setHours(dueDate.getHours() + value);
        break;
      case 'days':
        thresholdDate.setDate(dueDate.getDate() + value);
        break;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }

    // Compare year, month, and date
    return (
      currentDate.getUTCFullYear() === thresholdDate.getUTCFullYear() &&
      currentDate.getUTCMonth() === thresholdDate.getUTCMonth() &&
      currentDate.getUTCDate() === thresholdDate.getUTCDate()
    );
  }

  async failedAuthorized(payments: any, cronId: string, settings: ISettings[]) {
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();

    const filterPaymentWithRetries = payments[0].failedAuthorized.filter(
      (payment: IPayment) => {
        return (
          payment.retriesAuth != retryInterval.failedAuthorization.maxRetry
        );
      }
    );
    const failedAuthorized = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        const interval = retryInterval.failedAuthorization;
        const retry = payment.retriesAuth + 1;
        const value = interval.value * retry;
        return this.retry(interval.unit, value, payment);
      }
    );

    await this.processAuthorized(failedAuthorized, cronId, true);
    console.log(failedAuthorized, 'failedAuthorized');
  }

  async processAuthorized(payments: any, cronId: string, retryPlus: boolean) {
    const paymentType = 'Credit Card';
    for (const payment of payments) {
      console.log('calculation');
      if (paymentType === 'Credit Card') {
        console.log(payment.amount, 'payment.amount');
        const response = await this.paymentService.authorizeCreditCard(
          payment.amount,
          ''
        );
        const responseNum = new URLSearchParams(response).get('response');
        const responseText = new URLSearchParams(response).get('responsetext');
        const paymentLogging = new PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
          const transactionId = new URLSearchParams(response).get(
            'transactionid'
          );
          console.log(transactionId, 'transactionId');
          updateObjPayment['transactionId'] = transactionId;
          updateObjPayment['authorized'] = 'Success';
          updateObjPayment['status'] = 'Pending';
          // await this.paymentRepository.updateById<IPayment>(payment._id, {
          //   transactionId: transactionId,
          //   authorized: 'Success',
          //   status: 'Pending',
          // });

          paymentLogging.successReason = responseText;
          paymentLogging.transactionId = transactionId;
        } else {
          updateObjPayment['authorized'] = 'Failed';
          updateObjPayment['status'] = 'Pending';
          updateObjPayment['failedReasonAuthorization'] = responseText;
          // await this.paymentRepository.updateById<IPayment>(payment._id, {
          //   authorized: 'Failed',
          //   status: 'Pending',
          // });
          paymentLogging.failReason = responseText;
        }
        if (retryPlus)
          updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;

        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
        paymentLogging.caseId = String(payment.caseId);
        paymentLogging.createdAt = commonUtil.getCurrentDate();
        paymentLogging.paymentId = String(payment._id);
        paymentLogging.cronId = cronId;
        paymentLogging.paymentType = 'Credit Auth';
        paymentLogging.debtor = String(payment.caseDetails.debtor);
        await this.paymentLoggingRepository.create(paymentLogging as any);
      }
    }
  }

  async failedCaptured(payments: any, cronId: string, settings: ISettings[]) {
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();

    const filterPaymentWithRetries = payments[0].failedAuthorized.filter(
      (payment: IPayment) => {
        return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
      }
    );
    const failedAuthorized = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        const interval = retryInterval.failedPayment;
        const retry = payment.retriesCapture + 1;
        const value = interval.value * retry;
        return this.retry(interval.unit, value, payment);
      }
    );

    await this.processCapture(failedAuthorized, cronId, true);
    console.log(failedAuthorized, 'failedAuthorized');
  }

  async processCapture(payments: any, cronId: string, retryPlus: boolean) {
    const paymentType = 'Credit Card';
    for (const payment of payments) {
      if (paymentType === 'Credit Card') {
        const response = await this.paymentService.captureCreditCard(
          '',
          payment.transactionId
        );
        const responseNum = new URLSearchParams(response).get('response');
        const responseText = new URLSearchParams(response).get('responsetext');
        const paymentLogging = new PaymentLogging();
        const updateObjPayment = {};
        if (responseNum === '1') {
          const transactionId = new URLSearchParams(response).get(
            'transactionid'
          );
          console.log(transactionId, 'transactionId');
          updateObjPayment['captured'] = 'Success';
          updateObjPayment['status'] = 'Success';
          // await this.paymentRepository.updateById<IPayment>(payment._id, {
          //   captured: 'Success',
          //   status: 'Success',
          // });
          paymentLogging.successReason = responseText;
          paymentLogging.transactionId = transactionId;
        } else {
          updateObjPayment['captured'] = 'Failed';
          updateObjPayment['failedReasonCaptured'] = responseText;
          // await this.paymentRepository.updateById<IPayment>(payment._id, {
          //   captured: 'Failed',
          // });
          paymentLogging.failReason = responseText;
        }
        if (retryPlus)
          updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
        paymentLogging.caseId = String(payment.caseId);
        paymentLogging.createdAt = commonUtil.getCurrentDate();
        paymentLogging.paymentId = String(payment._id);
        paymentLogging.cronId = cronId;
        paymentLogging.paymentType = 'Credit Capture';
        paymentLogging.debtor = String(payment.caseDetails.debtor);
        await this.paymentLoggingRepository.create(paymentLogging as any);
      }
    }
  }
}

export default new CronJob();
