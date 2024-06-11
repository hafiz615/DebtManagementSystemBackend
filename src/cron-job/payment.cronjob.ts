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
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Payment} from '../database/repomodels/payment.repomodel';
console.log('i am here');

class CronJob {
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private settingsRepository: SettingsRepository;
  private paymentLoggingRepository: PaymentLoggingRepository;
  private debtorRepository: DebtorRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.settingsRepository = new SettingsRepository();
    this.paymentService = new PaymentService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
    this.debtorRepository = new DebtorRepository();
  }
  startCronJob() {
    cron.schedule('* * * * *', async () => {
      console.log('Running a task every minute');
      // const payments: any = await paymentUtil.getAllCronJobPayments();
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
    // await this.pendingCaptured(payments, cronId, settings);
    // await this.failedAuthorized(payments, cronId, settings);
    // await this.failedCaptured(payments, cronId, settings);
    console.log('oh i was running');
    return;
    const debtors = await this.debtorRepository.getAll<IDebtor>();
    for (const debtor of debtors) {
      if (debtor.totalCommission === debtor.commissionPaid) {
        continue;
      }
      let payment: IPayment;
      if (debtor.commissionPaymentId) {
        payment = await this.paymentRepository.getById<IPayment>(
          debtor.commissionPaymentId
        );
      } else {
        payment = await this.getCommissionDocument(debtor._id);
      }
      if (
        debtor.weeklyCommissionPaid &&
        this.checkCommissionTimePeriod(payment.dueDate, 'weekly')
      ) {
        const paymentDoc = await this.getCommissionDocument(debtor._id);
        await this.debtorRepository.updateById<IDebtor>(debtor._id, {
          weeklyCommissionPaid: false,
          commissionPaymentId: paymentDoc.id,
        });
        continue;
      }
      if (
        debtor.weeklyCommissionPaid &&
        !this.checkCommissionTimePeriod(payment.dueDate, 'weekly')
      ) {
        continue;
      }
      if (!debtor.weeklyCommissionPaid) {
        if (payment.authorized === 'Pending') {
          const response = await this.paymentService.authorizeCreditCard(
            debtor.weeklyCommission,
            ''
          );
          await this.processCommissionAuthResponse(
            payment,
            response,
            false,
            cronId
          );
        }
        if (payment.authorized === 'Failed') {
          if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
            const response = await this.paymentService.authorizeCreditCard(
              debtor.weeklyCommission,
              ''
            );
            const result = await this.processCommissionAuthResponse(
              payment,
              response,
              true,
              cronId
            );
            if (result) {
              payment = await this.paymentRepository.getById<IPayment>(
                debtor.commissionPaymentId
              );
              const response = await this.paymentService.captureCreditCard(
                '',
                payment.debtorTransId
              );
              await this.processCommissionCaptureResponse(
                payment,
                response,
                false,
                cronId
              );
            }
          }
        }
        if (payment.authorized === 'Success') {
          if (payment.captured === 'Failed') {
            if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
              const response = await this.paymentService.captureCreditCard(
                '',
                payment.debtorTransId
              );
              await this.processCommissionCaptureResponse(
                payment,
                response,
                true,
                cronId
              );
            }
          }
        }
      }
    }
  }

  async getCommissionDocument(debtorId: string) {
    const payment = new Payment();
    payment.timePeriod = 'hours';
    payment.dueDate = commonUtil.getCurrentDate();
    payment.debtorId = debtorId;
    return await this.paymentRepository.create<IPayment>(payment as any);
  }

  async processCommissionAuthResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string
  ) {
    const retryCommissionInterval = {
      unit: 'hours',
      value: 8,
      maxRetry: 3,
    };
    let successAuth = false;
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      console.log(transactionId, 'transactionId');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['status'] = 'Pending';

      paymentLogging.successReason = responseText;
      successAuth = true;
    } else {
      updateObjPayment['authorized'] = 'Failed';
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['failedReasonAuthorization'] = responseText;
      if (retryPlus) {
        const retry = payment.retriesAuth + 1;
        const value = retryCommissionInterval.value * retry;
        const retryDate = this.getRetryDate(
          retryCommissionInterval.unit,
          value,
          payment.dueDate
        );
        updateObjPayment['rescheduled'] = retryDate;
      }
      paymentLogging.failReason = responseText;
      console.log('send email through template');
    }
    if (retryPlus) updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;

    await this.paymentRepository.updateById<IPayment>(
      payment._id,
      updateObjPayment
    );
    paymentLogging.caseId = String(payment.caseId);
    paymentLogging.createdAt = commonUtil.getCurrentDate();
    paymentLogging.paymentId = String(payment._id);
    paymentLogging.cronId = cronId;
    paymentLogging.paymentType = 'Credit commission auth';
    paymentLogging.debtor = String(payment.caseDetails.debtor);
    await this.paymentLoggingRepository.create(paymentLogging as any);
    return successAuth;
  }

  async processCommissionCaptureResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string
  ) {
    const retryCommissionInterval = {
      unit: 'hours',
      value: 8,
      maxRetry: 3,
    };
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      console.log(transactionId, 'transactionId');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Success';
      paymentLogging.successReason = responseText;
      await this.debtorRepository.updateById<IDebtor>(payment._id, {
        weeklyCommissionPaid: true,
      });
    } else {
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = responseText;
      if (retryPlus) {
        const retry = payment.retriesCapture + 1;
        const value = retryCommissionInterval.value * retry;
        const retryDate = this.getRetryDate(
          retryCommissionInterval.unit,
          value,
          payment.dueDate
        );
        updateObjPayment['rescheduled'] = retryDate;
      }
      paymentLogging.failReason = responseText;

      console.log('send email'); // add code
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
    paymentLogging.paymentType = 'Credit commission capture';
    paymentLogging.debtor = String(payment.caseDetails.debtor);
    await this.paymentLoggingRepository.create(paymentLogging as any);
  }

  checkCommissionTimePeriod(date: string, timePeriod: string) {
    const dateTemp = new Date(date);
    const currentDate = new Date(commonUtil.getCurrentDate());
    switch (timePeriod) {
      case 'weekly':
        dateTemp.setDate(dateTemp.getDate() + 7);
        break;
      case 'hours':
        dateTemp.setHours(dateTemp.getHours() + 8);
        break;

      default:
        break;
    }
    return dateTemp >= currentDate;
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
        if (payment.timePeriod) {
          const interval =
            authorizationInterval[payment.timePeriod.toLowerCase()];
          return this.shouldAuthorize(interval.unit, interval.value, payment);
        }
        return false;
      }
    );
    // console.log(pendingAuthorized, 'pendingAuthorizedd');
    // const groupedPayments = await this.groupPaymentsByDebtor(pendingAuthorized);
    // console.log(groupedPayments);
    await this.processAuthorized(pendingAuthorized, cronId, false, settings);
  }

  async groupPaymentsByDebtor(payments: any) {
    let resultObj = {};
    const seen = new Set();
    for (const payment of payments) {
      if (!seen.has(String(payment.caseDetails.debtor))) {
        seen.add(String(payment.caseDetails.debtor));
        resultObj[String(payment.caseDetails.debtor)] = [payment];
      } else {
        resultObj[String(payment.caseDetails.debtor)].push(payment);
      }
    }
    return resultObj;
  }

  async pendingCaptured(payments: any, cronId: string, settings: ISettings[]) {
    const currentDate = new Date(commonUtil.getCurrentDate());
    console.log(payments[0].pendingCaptured, 'payments[0].pendingCaptured');
    const pendingCaptured = payments[0].pendingCaptured.filter(
      (payment: IPayment) => {
        return currentDate.getTime() >= new Date(payment.dueDate).getTime();
      }
    );
    console.log(pendingCaptured, 'pendingCapturedddd');
    await this.processCapture(pendingCaptured, cronId, false, settings);
  }

  getRetryDate(unit: string, value: number, dueDate: string) {
    console.log(dueDate);
    console.log(unit);
    console.log(value);
    const dueDateTemp = new Date(dueDate);
    let thresholdDate = new Date(dueDateTemp);
    switch (unit) {
      case 'hours':
        thresholdDate.setHours(dueDateTemp.getHours() + value);
        break;
      case 'days':
        thresholdDate.setDate(dueDateTemp.getDate() + value);
        break;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
    console.log(thresholdDate);
    return thresholdDate.toUTCString();
  }

  retry(retryDate: string): boolean {
    const currentDate = new Date(commonUtil.getCurrentDate());

    let thresholdDate = new Date(retryDate);

    return thresholdDate <= currentDate;
  }

  async failedAuthorized(payments: any, cronId: string, settings: ISettings[]) {
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    console.log(retryInterval.failedAuthorization);
    const filterPaymentWithRetries = payments[0].failedAuthorized.filter(
      (payment: IPayment) => {
        return (
          payment.retriesAuth != retryInterval.failedAuthorization.maxRetry
        );
      }
    );
    console.log(filterPaymentWithRetries, 'filterrrrr');
    const failedAuthorized = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        return this.retry(payment.rescheduled);
      }
    );
    console.log(failedAuthorized, 'failedAuthorized');
    await this.processAuthorized(failedAuthorized, cronId, true, settings);
  }
  async processAuthorized(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    const paymentType = 'Credit Card';
    // const payment = payments[payments.length - 1];
    // const response = await this.paymentService.authorizeCreditCard(
    //   payment.amount,
    //   ''
    // );
    // await this.processAuthorizedResponse(
    //   payment,
    //   response,
    //   retryPlus,
    //   cronId,
    //   settings
    // );
    for (const payment of payments) {
      console.log('calculation');
      if (paymentType === 'Credit Card') {
        const response = await this.paymentService.authorizeCreditCard(
          payment.amount,
          ''
        );
        await this.processAuthorizedResponse(
          payment,
          response,
          retryPlus,
          cronId,
          settings
        );
        break;
      }
      if (paymentType === 'ACH') {
        const response = await this.paymentService.achCredit(
          '',
          payment.amount
        );
        await this.processCaptureResponse(
          payment,
          response,
          retryPlus,
          cronId,
          settings,
          'ach'
        );
        break;
      }
    }
  }

  async processAuthorizedResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[]
  ) {
    console.log(payment, 'opopopopop');
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      console.log(transactionId, 'transactionId');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      paymentLogging.successReason = responseText;
    } else {
      updateObjPayment['authorized'] = 'Failed';
      updateObjPayment['failedReasonAuthorization'] = responseText;
      const interval = retryInterval.failedAuthorization;
      const retry = payment.retriesAuth + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        payment.dueDate
      );
      updateObjPayment['rescheduled'] = retryDate;
      paymentLogging.failReason = responseText;
      console.log('send email through template');
    }
    if (retryPlus) updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;

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
    paymentLogging.creditor = String(payment.caseDetails.creditor);
    await this.paymentLoggingRepository.create(paymentLogging as any);
  }

  // async checkCommission(payment: any) {
  //   if (!payment.commission) return payment.commission;
  //   const totalCommision = payment.caseDetails.commissionCalculated;
  //   const commissionPaid = payment.caseDetails.commissionPaying;
  //   if ((totalCommision | 0) === ((commissionPaid + payment.commission) | 0))
  //     return 0;
  //   if ((totalCommision | 0) < ((commissionPaid + payment.commission) | 0)) {
  //     const temp = totalCommision - (commissionPaid + payment.commission);
  //     const remaining = payment.commission - temp;
  //     return remaining;
  //   }
  //   return payment.commision;
  // }

  async failedCaptured(payments: any, cronId: string, settings: ISettings[]) {
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();

    const filterPaymentWithRetries = payments[0].failedCaptured.filter(
      (payment: IPayment) => {
        return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
      }
    );
    console.log(filterPaymentWithRetries, 'filterrrrr');
    const failedCaptured = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        return this.retry(payment.rescheduled);
      }
    );
    console.log(failedCaptured, 'failedAuthorized');
    await this.processCapture(failedCaptured, cronId, true, settings);
  }

  async processCapture(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    // const payment = payments[payments.length - 1];
    // const response = await this.paymentService.captureCreditCard(
    //   '',
    //   payment.debtorTransId
    // );
    // await this.processCaptureResponse(
    //   payment,
    //   response,
    //   retryPlus,
    //   cronId,
    //   settings
    // );
    const paymentType = 'Credit Card';
    for (const payment of payments) {
      if (paymentType === 'Credit Card') {
        const response = await this.paymentService.captureCreditCard(
          '',
          payment.debtorTransId
        );
        await this.processCaptureResponse(
          payment,
          response,
          retryPlus,
          cronId,
          settings,
          'credit card'
        );
        break;
      }
      if (paymentType === 'ACH') {
        const response = await this.paymentService.achCredit(
          '',
          payment.amount
        );
        await this.processCaptureResponse(
          payment,
          response,
          retryPlus,
          cronId,
          settings,
          'ach'
        );
        break;
      }
    }
  }

  async processCaptureResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    type: string
  ) {
    console.log(payment, 'opopopopop');
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const paymentLogging = new PaymentLogging();
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      console.log(transactionId, 'transactionId');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Success';
      if (type === 'ach') updateObjPayment['authorized'] = 'Success';
      paymentLogging.successReason = responseText;
    } else {
      if (type === 'ach') updateObjPayment['authorized'] = 'Success';
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = responseText;
      const interval = retryInterval.failedPayment;
      const retry = payment.retriesCapture + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        payment.dueDate
      );
      updateObjPayment['rescheduled'] = retryDate;
      paymentLogging.failReason = responseText;

      console.log('send email'); // add code
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
    paymentLogging.creditor = String(payment.caseDetails.creditor);
    await this.paymentLoggingRepository.create(paymentLogging as any);
  }
}

export default new CronJob();
