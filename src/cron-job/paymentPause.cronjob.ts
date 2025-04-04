import cron from 'node-cron';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IPayment} from '../database/interfaces/payment.interface';
import paymentUtil from '../utils/payment.util';
import serviceFeeUtil from '../utils/serviceFee.util';
import {SettingsRepository} from '../api/repository/setting/settings.repository';
import {ISettings} from '../database/interfaces/settings.interface';
import {URLSearchParams} from 'url';
import commonUtil from '../utils/common.util';
import {v4 as uuidv4, v4} from 'uuid';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Payment} from '../database/repomodels/payment.repomodel';
import mongoose from 'mongoose';
import paynoteUtil from '../utils/paynote.util';
import emailUtil from '../utils/email.util';
import PaymentService from '../api/services/payment.service';
import {CaseRepository} from '../api/repository/case/case.repository';
import {ICase} from '../database/interfaces/case.interface';
import creditorUtil from '../utils/creditor.util';
import debtorUtil from '../utils/debtor.util';
import {ServiceFeeRepository} from '../api/repository/serviceFee/serviceFee.repository';
import {IFee} from '../database/interfaces/serviceFee.interface';
import lawsuitUtil from '../utils/lawsuit.util';
import {ILawsuit} from '../database/interfaces/lawsuit.interface';
import {LawsuitRepository} from '../api/repository/lawsuit/lawsuit.repository';

class CronJob {
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private settingsRepository: SettingsRepository;
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;
  private serviceFeeRepository: ServiceFeeRepository;
  private lawsuitRepository: LawsuitRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.settingsRepository = new SettingsRepository();
    this.paymentService = new PaymentService();
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
    this.serviceFeeRepository = new ServiceFeeRepository();
    this.lawsuitRepository = new LawsuitRepository();
  }
  async testCron() {
    let dbconfig =
      'mongodb+srv://mohsin123:1732544m@cluster0.fyxwu.mongodb.net/debt-settlement?retryWrites=true&w=majority';
    const options = {
      retryWrites: true,
      autoIndex: true, // build indexes true or false
    };
    const conn = mongoose.createConnection(dbconfig, options);
    console.log(conn.readyState, 'kjkjk');
    conn.on('connected', () => {
      console.log('Mongoose connection is open');
      // Check if the connection is established
      const isConnected = conn.readyState === 1;
      console.log('Is connected:', isConnected);
    });
    setTimeout(async () => {
      await conn.close(true);
      console.log('done');
      console.log(conn.readyState);
    }, 10000);

    console.log(conn.readyState);
  }

  async testPaynote() {
    // const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
    //   {creditorPaymentsProceed: true},
    //   '_id'
    // );
    // const caseIds = cases.map(caseTemp => {
    //   return String(caseTemp._id);
    // });
    // const pendingPayments =
    //   await this.paymentRepository.getAllWithoutPagination<IPayment>(
    //     {
    //       caseId: {$in: caseIds},
    //       captured: 'Success',
    //       sendViaPaynote: 'Pending',
    //       isDeleted: false,
    //       attorneyId: null,
    //     },
    //     undefined,
    //     undefined,
    //     undefined,
    //     {
    //       path: 'caseId',
    //       select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
    //       populate: [
    //         {
    //           path: 'creditor',
    //           select: [
    //             'paynoteSourceId',
    //             'paynoteUserId',
    //             'basicInformation.fullName',
    //             'businessInformation.companyName',
    //           ],
    //         },
    //         {
    //           path: 'debtor',
    //           select: [
    //             '_id',
    //             'basicInformation.fullName',
    //             'businessInformation.companyName',
    //           ],
    //         },
    //       ],
    //     }
    //   );
    // await this.paynotePending(pendingPayments, true);

    // const failedPayments =
    //   await this.paymentRepository.getAllWithoutPagination<IPayment>(
    //     {
    //       captured: 'Success',
    //       sendViaPaynote: 'Failed',
    //       caseId: {$ne: null},
    //       isDeleted: false,
    //     },
    //     undefined,
    //     undefined,
    //     undefined,
    //     {
    //       path: 'caseId',
    //       select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
    //       populate: [
    //         {
    //           path: 'creditor',
    //           select: [
    //             'paynoteSourceId',
    //             'paynoteUserId',
    //             'basicInformation.fullName',
    //             'businessInformation.companyName',
    //           ],
    //         },
    //         {
    //           path: 'debtor',
    //           select: [
    //             '_id',
    //             'basicInformation.fullName',
    //             'businessInformation.companyName',
    //           ],
    //         },
    //       ],
    //     }
    //   );

    // await this.paynoteFailed(failedPayments, true);

    const lawsuits: ILawsuit[] =
      await this.lawsuitRepository.getAllWithoutPagination<ILawsuit>({
        paymentsProceed: true,
      });
    const debtorIds = lawsuits.map(lawsuit => {
      return String(lawsuit.debtorId);
    });
    const pendingAttorneyPayments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          debtorId: {$in: debtorIds},
          captured: 'Success',
          sendViaPaynote: 'Pending',
          isDeleted: false,
        },
        undefined,
        undefined,
        undefined,
        [
          {
            path: 'caseId',
            select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
            populate: [
              {
                path: 'debtor',
                select: [
                  '_id',
                  'basicInformation.fullName',
                  'businessInformation.companyName',
                ],
              },
            ],
          },
          {
            path: 'lawsuitId',
            populate: 'lawfirmId',
          },
        ]
      );
    await this.paynotePending(pendingAttorneyPayments, false);

    const failedAttorneyPayments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          captured: 'Success',
          sendViaPaynote: 'Failed',
          caseId: {$ne: null},
          isDeleted: false,
          lawsuitId: {$ne: null},
        },
        undefined,
        undefined,
        undefined,
        [
          {
            path: 'caseId',
            select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
            populate: [
              {
                path: 'debtor',
                select: [
                  '_id',
                  'basicInformation.fullName',
                  'businessInformation.companyName',
                ],
              },
            ],
          },
          {
            path: 'lawsuitId',
            populate: 'lawfirmId',
          },
        ]
      );

    await this.paynoteFailed(failedAttorneyPayments, false);
  }
  startCronJob() {
    cron.schedule(
      '0 4 * * *',
      async () => {
        console.log('Running a task in a day for 4am (UTC)');
        this.processCommissionPayments();
        this.processPayments();
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '0 * * * *',
      async () => {
        console.log('Running a task every zero of an hour');
        this.processCommissionRetryPayments();
        this.processRetryPayments();
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '0 15 * * *',
      async () => {
        const cases = await this.caseRepository.getAllWithoutPagination<ICase>(
          {creditorPaymentsProceed: true},
          '_id'
        );
        const caseIds = cases.map(caseTemp => {
          return String(caseTemp._id);
        });
        const pendingPayments =
          await this.paymentRepository.getAllWithoutPagination<IPayment>(
            {
              caseId: {$in: caseIds},
              captured: 'Success',
              sendViaPaynote: 'Pending',
              isDeleted: false,
              attorneyId: null,
            },
            undefined,
            undefined,
            undefined,
            {
              path: 'caseId',
              select: [
                '_id',
                'caseCode',
                'remaining',
                'creditorPaymentsProceed',
              ],
              populate: [
                {
                  path: 'creditor',
                  select: [
                    'paynoteSourceId',
                    'paynoteUserId',
                    'basicInformation.fullName',
                    'businessInformation.companyName',
                  ],
                },
                {
                  path: 'debtor',
                  select: [
                    '_id',
                    'basicInformation.fullName',
                    'businessInformation.companyName',
                  ],
                },
              ],
            }
          );
        await this.paynotePending(pendingPayments, true);

        const failedPayments =
          await this.paymentRepository.getAllWithoutPagination<IPayment>(
            {
              captured: 'Success',
              sendViaPaynote: 'Failed',
              caseId: {$ne: null},
              isDeleted: false,
            },
            undefined,
            undefined,
            undefined,
            {
              path: 'caseId',
              select: [
                '_id',
                'caseCode',
                'remaining',
                'creditorPaymentsProceed',
              ],
              populate: [
                {
                  path: 'creditor',
                  select: [
                    'paynoteSourceId',
                    'paynoteUserId',
                    'basicInformation.fullName',
                    'businessInformation.companyName',
                  ],
                },
                {
                  path: 'debtor',
                  select: [
                    '_id',
                    'basicInformation.fullName',
                    'businessInformation.companyName',
                  ],
                },
              ],
            }
          );

        await this.paynoteFailed(failedPayments, true);

        const lawsuits: ILawsuit[] =
          await this.lawsuitRepository.getAllWithoutPagination<ILawsuit>({
            paymentsProceed: true,
          });
        const debtorIds = lawsuits.map(lawsuit => {
          return String(lawsuit.debtorId);
        });
        const pendingAttorneyPayments =
          await this.paymentRepository.getAllWithoutPagination<IPayment>(
            {
              debtorId: {$in: debtorIds},
              captured: 'Success',
              sendViaPaynote: 'Pending',
              isDeleted: false,
            },
            undefined,
            undefined,
            undefined,
            [
              {
                path: 'caseId',
                select: [
                  '_id',
                  'caseCode',
                  'remaining',
                  'creditorPaymentsProceed',
                ],
                populate: [
                  {
                    path: 'debtor',
                    select: [
                      '_id',
                      'basicInformation.fullName',
                      'businessInformation.companyName',
                    ],
                  },
                ],
              },
              {
                path: 'lawsuitId',
                populate: 'lawfirmId',
              },
            ]
          );
        await this.paynotePending(pendingAttorneyPayments, false);

        const failedAttorneyPayments =
          await this.paymentRepository.getAllWithoutPagination<IPayment>(
            {
              captured: 'Success',
              sendViaPaynote: 'Failed',
              caseId: {$ne: null},
              isDeleted: false,
              lawsuitId: {$ne: null},
            },
            undefined,
            undefined,
            undefined,
            [
              {
                path: 'caseId',
                select: [
                  '_id',
                  'caseCode',
                  'remaining',
                  'creditorPaymentsProceed',
                ],
                populate: [
                  {
                    path: 'debtor',
                    select: [
                      '_id',
                      'basicInformation.fullName',
                      'businessInformation.companyName',
                    ],
                  },
                ],
              },
              {
                path: 'lawsuitId',
                populate: 'lawfirmId',
              },
            ]
          );

        await this.paynoteFailed(failedAttorneyPayments, false);
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '0 21 * * *',
      async () => {
        const today = new Date(commonUtil.getCurrentDate());
        const targetDate = new Date(commonUtil.getCurrentDate());
        targetDate.setDate(today.getDate() + 2); // Add 2 days to the current date

        // Set the targetDate to the start of the day (00:00:00) for comparison
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const payments: IPayment[] =
          await this.paymentRepository.getAllWithoutPagination<IPayment>({
            status: 'Upcoming',
            caseId: {$ne: null},
            dueDate: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
            transactionType: {$nin: ['Wire', 'Check']},
          });

        for (const payment of payments) {
          emailUtil.sendEmailOrSmsByEvent(
            'upcoming_payment',
            '',
            payment._id,
            ''
          );
        }
      },
      {
        timezone: 'America/New_York',
      }
    );
  }

  async paynotePending(payments: any, creditor: boolean) {
    const retryPaynoteInterval = {
      unit: 'days',
      value: 1,
      maxRetry: 2,
    };

    creditor
      ? await this.processPaynotePayments(payments, false, retryPaynoteInterval)
      : await this.processPaynoteAttorneyPayments(
          payments,
          false,
          retryPaynoteInterval
        );
  }

  async paynoteFailed(payments: any, creditor: boolean) {
    const retryPaynoteInterval = {
      unit: 'days',
      value: 1,
      maxRetry: 2,
    };
    const filterPaymentWithRetries = payments.filter((payment: IPayment) => {
      return payment.retriesPaynote != retryPaynoteInterval.maxRetry;
    });
    const failedPaynote = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        return this.retry(payment.rescheduled);
      }
    );
    creditor
      ? await this.processPaynotePayments(
          failedPaynote,
          true,
          retryPaynoteInterval
        )
      : await this.processPaynoteAttorneyPayments(
          failedPaynote,
          true,
          retryPaynoteInterval
        );
  }

  private async processPaynotePayments(
    payments: any,
    retryPlus: boolean,
    interval: any
  ) {
    for (const payment of payments as any) {
      if (!payment?.caseId?.creditorPaymentsProceed) {
        continue;
      }
      if (payment.caseId.creditor.paynoteUserId) {
        // const paynoteCustomer = await paynoteUtil.getCustomer(
        //   payment.caseId.creditor
        // );
        // console.log(paynoteCustomer);
        // if (paynoteCustomer.error) continue;
        // if (paynoteCustomer.user.status === 'unverified') continue;
        const paymentResult = await paynoteUtil.sendPayment(payment);
        if (paymentResult?.message === 'Server Error') break;
        console.log(paymentResult);
        if (paymentResult.error) {
          console.log('Send Email');
          let message = '';
          if (paymentResult?.messages) {
            message = paymentResult.messages[0];
          } else {
            message = paymentResult.message;
          }
          console.log(message, 'message');
          const retry = payment.retriesAuth + 1;
          const value = interval.value * retry;
          const retryDate = this.getRetryDate(
            interval.unit,
            value,
            commonUtil.getCurrentDate()
          );
          let retries = payment.retriesAuth;
          if (retryPlus) retries += 1;
          await this.paymentRepository.updateById<IPayment>(payment._id, {
            sendViaPaynote: 'Failed',
            rescheduled: retryDate,
            retriesPaynote: retries,
            failedReasonPaynote: message,
          });
          emailUtil.sendEmailOrSmsByEvent(
            'failed_payment',
            '',
            payment._id,
            ''
          );
          continue;
        }

        emailUtil.sendEmailOrSmsByEvent(
          'successful_payment',
          '',
          payment._id,
          ''
        );
        await this.paymentRepository.updateById<IPayment>(payment._id, {
          paynoteCheckId: paymentResult.check.check_id,
          sendViaPaynote: 'Success',
          status: 'Success',
        });
        const updatedCase = await this.caseRepository.updateById<ICase>(
          payment.caseId._id,
          {$inc: {remainingAmountPaid: payment.amount}}
        );
        if (updatedCase.remaining === updatedCase.remainingAmountPaid) {
          const creditors = await creditorUtil.getCreditorsEmailForDebtor(
            String(payment.caseId.debtor._id),
            String(payment.caseId.creditor._id)
          );
          emailUtil.sendEmailIfDebtorPaysDebt(
            payment.caseId,
            payment.caseId.debtor,
            creditors
          );
        }
      }
    }
  }

  private async processPaynoteAttorneyPayments(
    payments: any,
    retryPlus: boolean,
    interval: any
  ) {
    for (const payment of payments as any) {
      if (payment.lawsuitId?.lawfirmId?.paynoteUserId) {
        // const paynoteCustomer = await paynoteUtil.getCustomer(
        //   payment.caseId.creditor
        // );
        // console.log(paynoteCustomer);
        // if (paynoteCustomer.error) continue;
        // if (paynoteCustomer.user.status === 'unverified') continue;
        const paymentResult = await paynoteUtil.sendPayment(payment);
        if (paymentResult?.message === 'Server Error') break;
        console.log(paymentResult);
        if (paymentResult.error) {
          console.log('Send Email');
          let message = '';
          if (paymentResult?.messages) {
            message = paymentResult.messages[0];
          } else {
            message = paymentResult.message;
          }
          console.log(message, 'message');
          const retry = payment.retriesAuth + 1;
          const value = interval.value * retry;
          const retryDate = this.getRetryDate(
            interval.unit,
            value,
            commonUtil.getCurrentDate()
          );
          let retries = payment.retriesAuth;
          if (retryPlus) retries += 1;
          await this.paymentRepository.updateById<IPayment>(payment._id, {
            sendViaPaynote: 'Failed',
            rescheduled: retryDate,
            retriesPaynote: retries,
            failedReasonPaynote: message,
          });
          emailUtil.sendEmailOrSmsByEvent(
            'failed_payment',
            '',
            payment._id,
            ''
          );
          continue;
        }

        emailUtil.sendEmailOrSmsByEvent(
          'successful_payment',
          '',
          payment._id,
          ''
        );
        await this.paymentRepository.updateById<IPayment>(payment._id, {
          paynoteCheckId: paymentResult.check.check_id,
          sendViaPaynote: 'Success',
          status: 'Success',
        });
      }
    }
  }

  async processPayments() {
    const settings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const cronId = uuidv4();
    const paymentsPendingAuthorized = await paymentUtil.getPendingAuthorized();
    const pendingAuthDocs = await this.pendingAuthorized(
      settings,
      paymentsPendingAuthorized,
      cronId
    );
    await this.processAuthorized(pendingAuthDocs, cronId, false, settings);
    // const paymentsPendingCaptured = await paymentUtil.getPendingCaptured();
    // const pendingCaptureDocs = await this.pendingCaptured(
    //   paymentsPendingCaptured,
    //   cronId,
    //   settings
    // );
    // await this.processCapture(pendingCaptureDocs, cronId, false, settings);
  }

  async processRetryPayments() {
    const settings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const cronId = uuidv4();
    const paymentsFailedAuthorized = await paymentUtil.getFailedAuthorized();
    const pendingFailedAuthDocs = await this.failedAuthorized(
      paymentsFailedAuthorized,
      cronId,
      settings
    );
    await this.processAuthorized(pendingFailedAuthDocs, cronId, true, settings);
    const paymentsFailedCaptured = await paymentUtil.getFailedCaptured();
    const paymentsFailedCaptureorized = await this.failedCaptured(
      paymentsFailedCaptured,
      cronId,
      settings
    );
    await this.processCapture(
      paymentsFailedCaptureorized,
      cronId,
      true,
      settings
    );
  }

  async processCommissionPayments() {
    // const payments: any = await paymentUtil.getAllCronJobPayments();
    const settings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const cronId = uuidv4();
    const paymentsPendingAuthorized =
      await paymentUtil.getPendingCommissionAuthorized();
    const pendingAuthDocs = await this.pendingAuthorized(
      settings,
      paymentsPendingAuthorized,
      cronId
    );
    await this.processCommissionAuthorized(
      pendingAuthDocs,
      cronId,
      false,
      settings
    );
    // const paymentsPendingCaptured =
    //   await paymentUtil.getPendingCommissionCaptured();
    // const pendingCaptureDocs = await this.pendingCaptured(
    //   paymentsPendingCaptured,
    //   cronId,
    //   settings
    // );
    // console.log(pendingCaptureDocs, 'pendingCaptureDocs');
    // await this.processCommissionCapture(
    //   pendingCaptureDocs,
    //   cronId,
    //   false,
    //   settings
    // );
  }

  async processCommissionRetryPayments() {
    // const payments: any = await paymentUtil.getAllCronJobPayments();
    const settings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const cronId = uuidv4();
    const paymentsFailedAuthorized =
      await paymentUtil.getFailedCommissionAuthorized();
    console.log(paymentsFailedAuthorized, 'paymentsFailedAuthorized');
    // const pendingFailedAuthDocs = await this.failedAuthorized(
    //   paymentsFailedAuthorized,
    //   cronId,
    //   settings
    // );
    // console.log(pendingFailedAuthDocs, 'pendingFailedAuthDocs');

    await this.processCommissionAuthorized(
      paymentsFailedAuthorized,
      cronId,
      true,
      settings
    );
    const paymentsFailedCaptured =
      await paymentUtil.getFailedCommissionCaptured();
    const pendingFailedCaptureDocs = await this.failedCaptured(
      paymentsFailedCaptured,
      cronId,
      settings
    );
    await this.processCommissionCapture(
      pendingFailedCaptureDocs,
      cronId,
      true,
      settings
    );
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
          maxRetry: 2,
        },
        failedPayment: {
          unit: 'days',
          value: 2,
          maxRetry: 2,
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
    const pendingAuthorized = payments.filter((payment: IPayment) => {
      if (payment.timePeriod) {
        const interval =
          authorizationInterval[payment.timePeriod.toLowerCase()];
        return this.shouldAuthorize(interval.unit, interval.value, payment);
      }
      return false;
    });
    return pendingAuthorized;
  }

  async pendingCaptured(payments: any, cronId: string, settings: ISettings[]) {
    const currentDate = new Date(commonUtil.getCurrentDate());
    const pendingCaptured = payments.filter((payment: IPayment) => {
      return currentDate.getTime() >= new Date(payment.dueDate).getTime();
    });
    return pendingCaptured;
  }

  getRetryDate(unit: string, value: number, dueDate: string) {
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
    const filterPaymentWithRetries = payments.filter((payment: IPayment) => {
      return payment.retriesAuth != retryInterval.failedAuthorization.maxRetry;
    });
    const failedAuthorized = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        return this.retry(payment.rescheduled);
      }
    );
    return failedAuthorized;
  }

  async processAuthorized(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    for (const payment of payments) {
      const accounts = payment.caseId.debtor.accounts;
      const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
      const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
      // const getCommission = await debtorUtil.getCommissionAmount(payment);
      // const sum = getCommission + payment.amount;
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.authorizeCreditCard(
            payment.amount + serviceFeeAmount + legalFeeAmount,
            account.customerVaultId,
            account.platform
          );
          const result = await this.processAuthorizedResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            // getCommission,
            account.platform,
            serviceFeeAmount,
            legalFeeAmount
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          await this.paymentRepository.updateById<IPayment>(payment._id, {
            authorized: 'Success',
          });
          // const response = await this.paymentService.achCredit(
          //   account.customerVaultId,
          //   payment.amount,
          //   account.platform
          // );
          // const result = await this.processCaptureResponse(
          //   payment,
          //   response,
          //   retryPlus,
          //   cronId,
          //   settings,
          //   'ck',
          //   account.platform
          //   // getCommission
          // );
          // if (retryPlus) retryPlus = false;
          // if (result) break;
          break;
        }
      }
    }
  }

  async processCommissionAuthorized(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    for (const payment of payments) {
      const otherPayments: IPayment[] = retryPlus
        ? await paymentUtil.getPaymentReferenceDocuments(
            payment.paymentReference
          )
        : await paymentUtil.getOtherPayments(payment);
      const totalLegalFeeAmount =
        await lawsuitUtil.getTotalLegalFee(otherPayments);
      const totalServiceFeeAmount =
        await lawsuitUtil.getTotalServiceFee(otherPayments);
      const totalAmount = otherPayments.reduce(
        (sum, obj) => sum + obj.amount,
        0
      );
      const remainingAmount =
        payment.amount -
        totalAmount +
        totalServiceFeeAmount +
        totalLegalFeeAmount;

      if (remainingAmount <= 0) {
        emailUtil.sendEmailOrSmsByEvent(
          'failed_authorization',
          '',
          payment._id,
          ''
        );
        return;
      }
      const concatedPayments = otherPayments.concat(payment);
      const debtor = await this.debtorRepository.getById<IDebtor>(
        payment.debtorId
      );
      const accounts = debtor.accounts;
      let retryOriginalValue = retryPlus;
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.authorizeCreditCard(
            payment.amount,
            account.customerVaultId,
            account.platform
          );
          const result = await this.processCommissionAuthorizedResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            account.platform
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          for (const payment of concatedPayments) {
            await this.paymentRepository.updateById<IPayment>(payment._id, {
              authorized: 'Success',
              paymentReference: v4(),
              paymentReferenceBool: true,
            });
          }
          // const response = await this.paymentService.achCredit(
          //   account.customerVaultId,
          //   totalAmount,
          //   account.platform
          // );
          // const result = await this.processCaptureCommissionResponse(
          //   payment,
          //   concatedPayments,
          //   response,
          //   retryPlus,
          //   cronId,
          //   settings,
          //   'ck',
          //   totalAmount
          // );
          // if (retryPlus) retryPlus = false;
          // if (result) break;
        }
      }
      retryPlus = retryOriginalValue;
    }
  }

  async processAuthorizedResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    // commission: number,
    platform: string,
    serviceFee: number,
    legalFee: number
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    updateObjPayment['transactionType'] = 'CC';
    updateObjPayment['paymentGateway'] = platform;
    let authorizedDate = new Date(commonUtil.getCurrentDate()).setUTCHours(
      0,
      0,
      0,
      0
    );
    updateObjPayment['authorizedDate'] = authorizedDate;
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['serviceFee'] = serviceFee;
      updateObjPayment['legalFee'] = legalFee;
      // updateObjPayment['commission'] = commission;
      // updateObjPayment['status'] = 'Pending';
      result = true;
      emailUtil.sendEmailOrSmsByEvent(
        'successful_authorization',
        '',
        payment._id,
        ''
      );
    } else {
      updateObjPayment['authorized'] = 'Failed';
      updateObjPayment['failedReasonAuthorization'] = responseText;
      // updateObjPayment['status'] = 'Pending';
      const interval = retryInterval.failedAuthorization;
      const retry = payment.retriesAuth + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        commonUtil.getCurrentDate()
      );
      updateObjPayment['rescheduled'] = retryDate;
      emailUtil.sendEmailOrSmsByEvent(
        'failed_authorization',
        '',
        payment._id,
        ''
      );
    }
    if (retryPlus) updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;

    if (Object.keys(updateObjPayment).length) {
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
    }
    return result;
  }

  async processCommissionAuthorizedResponse(
    payment: any,
    payments: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    platform: string
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    updateObjPayment['transactionType'] = 'CC';
    updateObjPayment['paymentGateway'] = platform;
    let authorizedDate = new Date(commonUtil.getCurrentDate()).setUTCHours(
      0,
      0,
      0,
      0
    );
    updateObjPayment['authorizedDate'] = authorizedDate;
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      lawsuitUtil.updateFee(payments);
      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      // updateObjPayment['serviceFee'] = serviceFee;
      // updateObjPayment['status'] = 'Pending';
      result = true;
      // emailUtil.sendEmailOrSmsByEvent(
      //   'successful_authorization',
      //   '',
      //   payment._id,
      //   ''
      // );
    } else {
      updateObjPayment['authorized'] = 'Failed';
      updateObjPayment['failedReasonAuthorization'] = responseText;
      // updateObjPayment['status'] = 'Pending';
      const interval = retryInterval.failedAuthorization;
      const retry = payment.retriesAuth + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        commonUtil.getCurrentDate()
      );
      updateObjPayment['rescheduled'] = retryDate;
      // emailUtil.sendEmailOrSmsByEvent(
      //   'failed_authorization',
      //   '',
      //   payment._id,
      //   ''
      // );
    }
    updateObjPayment['dueDate'] = payment.dueDate;
    if (retryPlus) updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;

    if (Object.keys(updateObjPayment).length) {
      if (!retryPlus) {
        updateObjPayment['paymentReference'] = v4();
        updateObjPayment['paymentReferenceBool'] = true;
      }
      for (const payment of payments) {
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
      }
    }
    return result;
  }

  async failedCaptured(payments: any, cronId: string, settings: ISettings[]) {
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();

    const filterPaymentWithRetries = payments.filter((payment: IPayment) => {
      return payment.retriesCapture != retryInterval.failedPayment.maxRetry;
    });
    const failedCaptured = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        return this.retry(payment.rescheduled);
      }
    );
    return failedCaptured;
    await this.processCapture(failedCaptured, cronId, true, settings);
  }

  async processCapture(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    for (const payment of payments) {
      const accounts = payment.caseId.debtor.accounts;
      const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
      const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.captureCreditCard(
            account.customerVaultId,
            payment.debtorTransId,
            account.platform
          );
          const result = await this.processCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            'cc',
            account.platform
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.customerVaultId,
            payment.amount + serviceFeeAmount + legalFeeAmount,
            account.platform
          );
          const result = await this.processCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            'ck',
            account.platform,
            serviceFeeAmount,
            legalFeeAmount
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
      }
    }
  }

  async processCommissionCapture(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    for (const payment of payments) {
      const otherPayments: IPayment[] =
        await paymentUtil.getPaymentReferenceDocuments(
          payment.paymentReference
        );
      // const totalLegalFeeAmount =
      //   await lawsuitUtil.getTotalLegalFee(otherPayments);
      // const totalServiceFeeAmount =
      //   await lawsuitUtil.getTotalServiceFee(otherPayments);
      const totalAmount = otherPayments.reduce(
        (sum, obj) => sum + obj.amount,
        0
      );
      // const remainingAmount =
      //   payment.amount -
      //   totalAmount +
      //   totalServiceFeeAmount +
      //   totalLegalFeeAmount;

      // if (remainingAmount <= 0) {
      //   emailUtil.sendEmailOrSmsByEvent('failed_capture', '', payment._id, '');
      //   return;
      // }
      const concatedPayments = otherPayments.concat(payment);
      const debtor = await this.debtorRepository.getById<IDebtor>(
        payment.debtorId
      );
      console.log(concatedPayments, 'concatedPayments');
      const accounts = debtor.accounts;
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.captureCreditCard(
            account.customerVaultId,
            payment.debtorTransId,
            account.platform
          );
          const result = await this.processCaptureCommissionResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            'cc',
            totalAmount,
            account.platform
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.customerVaultId,
            payment.amount,
            account.platform
          );
          const result = await this.processCaptureCommissionResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            'ck',
            totalAmount,
            account.platform
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
      }
    }
  }

  async processCaptureResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    type: string,
    platform: string,
    serviceFee?: number,
    legalFee?: number
    // commision?: number
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    updateObjPayment['paymentGateway'] = platform;
    updateObjPayment['transactionType'] = type === 'cc' ? 'CC' : 'ACH';
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      lawsuitUtil.updatePaymentLawsuit([payment]);
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        updateObjPayment['debtorTransId'] = transactionId;
        updateObjPayment['serviceFee'] = serviceFee;
        updateObjPayment['legalFee'] = legalFee;
        // updateObjPayment['commission'] = commision;
      }
      result = true;
      emailUtil.sendEmailOrSmsByEvent(
        'successful_capture',
        '',
        payment._id,
        ''
      );
    } else {
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        // updateObjPayment['status'] = 'Pending';
      }
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = responseText;
      const interval = retryInterval.failedPayment;
      const retry = payment.retriesCapture + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        commonUtil.getCurrentDate()
      );
      updateObjPayment['rescheduled'] = retryDate;

      emailUtil.sendEmailOrSmsByEvent('failed_capture', '', payment._id, '');
    }
    if (retryPlus)
      updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
    if (Object.keys(updateObjPayment).length) {
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
    }
    return result;
  }

  async processCaptureCommissionResponse(
    payment: any,
    payments: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    type: string,
    amount: number,
    platform: string
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    updateObjPayment['paymentGateway'] = platform;
    updateObjPayment['transactionType'] = type === 'cc' ? 'CC' : 'ACH';
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      lawsuitUtil.updatePaymentLawsuit(payments);
      if (type === 'ck') {
        lawsuitUtil.updateFee(payments);
        updateObjPayment['authorized'] = 'Success';
        updateObjPayment['debtorTransId'] = transactionId;
      }
      result = true;
      emailUtil.sendEmailOrSmsByEvent(
        'successful_capture',
        '',
        payment._id,
        ''
      );
      if (amount) {
        const commissionAmount = payment.amount - amount;
        // await this.paymentRepository.updateById<IPayment>(payment._id, {
        //   amount: commissionAmount,
        // });
        await this.debtorRepository.updateById(payment.debtorId, {
          $inc: {commissionPaid: commissionAmount},
        });
      }
      if (!amount) {
        await this.debtorRepository.updateById(payment.debtorId, {
          $inc: {commissionPaid: payment.amount},
        });
      }
    } else {
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        // updateObjPayment['status'] = 'Pending';
      }
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = responseText;
      const interval = retryInterval.failedPayment;
      const retry = payment.retriesCapture + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        commonUtil.getCurrentDate()
      );
      updateObjPayment['rescheduled'] = retryDate;

      emailUtil.sendEmailOrSmsByEvent('failed_capture', '', payment._id, '');
    }
    if (retryPlus)
      updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
    if (Object.keys(updateObjPayment).length) {
      for (const payment of payments) {
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
      }
    }
    return result;
  }
}

export default new CronJob();
