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
import seemlesschexUtil from '../utils/seemlesschex.util';
import {WaterfallRepository} from '../api/repository/waterfall/waterfall.repository';
import {IWaterfall} from '../database/interfaces/waterfall.interface';
import waterfallUtil from '../utils/waterfall.util';
import {IAccount} from '../database/interfaces/account.interface';

class CronJob {
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private settingsRepository: SettingsRepository;
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;
  private serviceFeeRepository: ServiceFeeRepository;
  private lawsuitRepository: LawsuitRepository;
  private waterfallRepository: WaterfallRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.settingsRepository = new SettingsRepository();
    this.paymentService = new PaymentService();
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
    this.serviceFeeRepository = new ServiceFeeRepository();
    this.lawsuitRepository = new LawsuitRepository();
    this.waterfallRepository = new WaterfallRepository();
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
        console.log('Running a task in a day for 4am');
        this.processCommissionPayments();
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '15 4 * * *',
      async () => {
        console.log('Running a task in a day for 4:15am');
        this.processPayments();
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '25 * * * *',
      async () => {
        console.log('Running a task every 30 min of an hour');
        this.processCommissionRetryPayments();
        this.processRetryPayments();
        this.processWaterfallPayments();
        this.processWaterfallPaymentsACH();
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '40 * * * *',
      async () => {
        console.log('Running a task every 45 min of an hour');
        this.makePaymentsNonExecutable();
        const paymentsCommission: IPayment[] =
          await this.paymentRepository.getAllWithoutPagination<IPayment>({
            isDeleted: false,
            caseId: null,
            commission: {$gt: 0},
            $or: [{ccWaterfall: true}, {achWaterfall: true}],
          });
        for (const payment of paymentsCommission) {
          let payments: IPayment[] =
            await paymentUtil.getOtherPayments(payment);
          const result = payments.some(
            payment =>
              payment.captured === 'Failed' || payment.captured === 'Pending'
          );
          if (!result) {
            await this.paymentRepository.updateById<IPayment>(payment._id, {
              ccWaterfall: false,
              achWaterfall: false,
            });
          }
        }
      },
      {
        timezone: 'America/New_York',
      }
    );

    cron.schedule(
      '0 10 * * *',
      async () => {
        this.cronSeamlesschex();
        this.cronPaynote();
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
              paymentMode: {$nin: ['Additional Charge']},
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
              paymentMode: {$nin: ['Additional Charge']},
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
              lawsuitId: {$ne: null},
              debtorId: {$in: debtorIds},
              sendViaPaynote: 'Pending',
              isDeleted: false,
              dueDate: {
                $lte: new Date(
                  new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
                ),
              },
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
            paymentMode: {$nin: ['Wire', 'Check', 'Invoice', 'Cash']},
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

  async cronSeamlesschex() {
    const paymentsCommission: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        authorized: 'Success',
        captured: {$ne: 'Success'},
        paymentMode: {$eq: 'Direct Post'},
        isDeleted: false,
        paymentGateway: 'Seamlesschex',
        caseId: null,
        checkStatus: 'Pending',
        dueDate: {
          $lte: new Date(
            new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
          ),
        },
      });
    for (const payment of paymentsCommission) {
      if (payment.debtorTransId) {
        const checkResponse = await seemlesschexUtil.getCheck(
          payment.debtorTransId
        );
        if (checkResponse.success) {
          if (checkResponse.check.status !== 'in_process') {
            const data = {event: 'check.changed', data: checkResponse.check};
            await seemlesschexUtil.checkStatusWebhook(data);
          }
        }
      }
    }

    const payments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        authorized: 'Success',
        captured: {$ne: 'Success'},
        paymentMode: {$eq: 'Direct Post'},
        isDeleted: false,
        paymentGateway: 'Seamlesschex',
        caseId: {$ne: null},
        paymentReferenceBool: {$ne: true},
        $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
        checkStatus: 'Pending',
        dueDate: {
          $lte: new Date(
            new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
          ),
        },
      });

    for (const payment of payments) {
      if (payment.debtorTransId) {
        const checkResponse = await seemlesschexUtil.getCheck(
          payment.debtorTransId
        );
        if (checkResponse.success) {
          if (checkResponse.check.status !== 'in_process') {
            const data = {event: 'check.changed', data: checkResponse.check};
            await seemlesschexUtil.checkStatusWebhook(data);
          }
        }
      }
    }
  }

  async cronPaynote() {
    const paymentsCommission: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        authorized: 'Success',
        captured: {$ne: 'Success'},
        paymentMode: {$eq: 'Direct Post'},
        isDeleted: false,
        paymentGateway: 'Paynote',
        caseId: null,
        checkStatus: 'Pending',
        dueDate: {
          $lte: new Date(
            new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
          ),
        },
      });
    for (const payment of paymentsCommission) {
      if (payment.debtorTransId) {
        const checkResponse = await paynoteUtil.getCheck(payment.debtorTransId);
        if (checkResponse.success) {
          if (checkResponse.check.status !== 'pending') {
            await paynoteUtil.paynoteWebhook(checkResponse);
          }
        }
      }
    }

    const payments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        authorized: 'Success',
        captured: {$ne: 'Success'},
        paymentMode: {$eq: 'Direct Post'},
        isDeleted: false,
        paymentGateway: 'Paynote',
        caseId: {$ne: null},
        paymentReferenceBool: {$ne: true},
        $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
        checkStatus: 'Pending',
        dueDate: {
          $lte: new Date(
            new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
          ),
        },
      });
    for (const payment of payments) {
      if (payment.debtorTransId) {
        const checkResponse = await paynoteUtil.getCheck(payment.debtorTransId);
        if (checkResponse.success) {
          if (checkResponse.check.status !== 'pending') {
            await paynoteUtil.paynoteWebhook(checkResponse);
          }
        }
      }
    }
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
            status: 'Pending',
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
    const paymentsPendingCaptured = await paymentUtil.getPendingCaptured();
    const pendingCaptureDocs = await this.pendingCaptured(
      paymentsPendingCaptured,
      cronId,
      settings
    );
    await this.processCapture(pendingCaptureDocs, cronId, false, settings);
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
    try {
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
      const paymentsPendingCaptured =
        await paymentUtil.getPendingCommissionCaptured();
      const pendingCaptureDocs = await this.pendingCaptured(
        paymentsPendingCaptured,
        cronId,
        settings
      );
      await this.processCommissionCapture(
        pendingCaptureDocs,
        cronId,
        false,
        settings
      );
    } catch (error: any) {
      console.log(error);
    }
  }

  async processWaterfallPayments() {
    try {
      const settings =
        await this.settingsRepository.getAllWithoutPagination<ISettings>();
      const cronId = uuidv4();
      const waterfallPayments = await paymentUtil.getWaterfallPayments();
      const pendingWaterfallPayments = await this.failedAuthorized(
        waterfallPayments,
        cronId,
        settings
      );
      await this.startWaterfallCC(
        pendingWaterfallPayments,
        cronId,
        true,
        settings
      );
      await this.processWaterfallPaymentsCommission();
      await this.processWaterfallPaymentsCreditor();
    } catch (error: any) {
      console.log(error);
    }
  }

  async processWaterfallPaymentsCommission() {
    try {
      const settings =
        await this.settingsRepository.getAllWithoutPagination<ISettings>();
      const cronId = uuidv4();

      const paymentsPendingCaptured =
        await paymentUtil.getPendingCaptureWaterfallPaymentsCommission();
      const paymentsToCapture = await this.pendingCaptured(
        paymentsPendingCaptured,
        cronId,
        settings
      );
      await this.processCapture(paymentsToCapture, cronId, false, settings);

      const paymentsFailedCaptured =
        await paymentUtil.getFailedCaptureWaterfallPaymentsCommission();
      const paymentsCaptureDocs = await this.failedCaptured(
        paymentsFailedCaptured,
        cronId,
        settings
      );
      await this.processCapture(paymentsCaptureDocs, cronId, true, settings);
    } catch (error: any) {
      console.log(error);
    }
  }

  async processWaterfallPaymentsCreditor() {
    // const payments: any = await paymentUtil.getAllCronJobPayments();
    try {
      const settings =
        await this.settingsRepository.getAllWithoutPagination<ISettings>();
      const cronId = uuidv4();

      const paymentsPendingCaptured =
        await paymentUtil.getPendingCaptureWaterfallPayments();
      const paymentsToCapture = await this.pendingCaptured(
        paymentsPendingCaptured,
        cronId,
        settings
      );
      console.log(paymentsToCapture, 'paymentsToCapture');
      await this.processCapture(paymentsToCapture, cronId, false, settings);

      const paymentsFailedCaptured =
        await paymentUtil.getFailedCaptureWaterfallPayments();
      const paymentsCaptureDocs = await this.failedCaptured(
        paymentsFailedCaptured,
        cronId,
        settings
      );
      console.log(paymentsCaptureDocs, 'paymentsCaptureDocs');
      await this.processCapture(paymentsCaptureDocs, cronId, true, settings);
    } catch (error: any) {
      console.log(error);
    }
  }

  async processWaterfallPaymentsACH() {
    // const payments: any = await paymentUtil.getAllCronJobPayments();
    try {
      const settings =
        await this.settingsRepository.getAllWithoutPagination<ISettings>();
      const cronId = uuidv4();
      const waterfallPayments = await paymentUtil.getWaterfallPaymentsACH();
      const pendingWaterfallPayments = await this.failedCaptured(
        waterfallPayments,
        cronId,
        settings
      );
      console.log(pendingWaterfallPayments, 'pendingWaterfallPayments');
      await this.startWaterfallACH(
        pendingWaterfallPayments,
        cronId,
        true,
        settings
      );

      // const waterfallPaymentsFailed =
      //   await paymentUtil.getWaterfallPaymentsACHFailed();
      // const pendingWaterfallPaymentsFailed = await this.failedCaptured(
      //   waterfallPaymentsFailed,
      //   cronId,
      //   settings
      // );
      // await this.startWaterfallACH(
      //   pendingWaterfallPaymentsFailed,
      //   cronId,
      //   true,
      //   settings
      // );
    } catch (error: any) {
      console.log(error);
    }
  }

  async makePaymentsNonExecutable() {
    const settings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    await this.paymentRepository.updateMany<IPayment>(
      {
        authorized: {$ne: 'Success'},
        isDeleted: {$ne: true},
        retriesAuth: {$gte: retryInterval.failedAuthorization.maxRetry},
        nonExecutable: {$ne: true},
      },
      {nonExecutable: true, authorized: 'Failed', status: 'Pending'}
    );
    await this.paymentRepository.updateMany<IPayment>(
      {
        captured: {$ne: 'Success'},
        isDeleted: {$ne: true},
        retriesCapture: {$gte: retryInterval.failedPayment.maxRetry},
        nonExecutable: {$ne: true},
      },
      {nonExecutable: true, captured: 'Failed', status: 'Pending'}
    );
  }

  async processCommissionRetryPayments() {
    // const payments: any = await paymentUtil.getAllCronJobPayments();
    const settings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const cronId = uuidv4();
    const paymentsFailedAuthorized =
      await paymentUtil.getFailedCommissionAuthorized();
    const pendingFailedAuthDocs = await this.failedAuthorized(
      paymentsFailedAuthorized,
      cronId,
      settings
    );
    await this.processCommissionAuthorized(
      pendingFailedAuthDocs,
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
    let retryOriginalValue = retryPlus;
    for (const payment of payments) {
      // const accounts = payment.caseId.debtor.accounts;
      const accountsTemp = await debtorUtil.getDebtorAccounts(payment.debtorId);
      const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
      const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
      // const getCommission = await debtorUtil.getCommissionAmount(payment);
      // const sum = getCommission + payment.amount;
      for (const account of accountsTemp) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.authorizeCreditCard(
            // payment.amount,
            payment.amount + serviceFeeAmount + legalFeeAmount,
            account.vault,
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
            legalFeeAmount,
            account.vault
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (account.paymentType === 'ck' || account.paymentType === 'ACH') {
          // await this.paymentRepository.updateById<IPayment>(payment._id, {
          //   authorized: 'Success',
          //   paymentMode: 'Direct Post',
          // });
          await this.paymentRepository.updateById<IPayment>(payment._id, {
            ach: true,
          });
        }
      }
      retryPlus = retryOriginalValue;
      await commonUtil.sleep(5000);
    }
  }

  async processCommissionAuthorized(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    let retryOriginalValue = retryPlus;
    for (const payment of payments) {
      const otherPayments: IPayment[] = retryPlus
        ? await paymentUtil.getPaymentReferenceDocuments(
            payment.paymentReference
          )
        : await paymentUtil.getOtherPayments(payment);
      const concatedPayments = otherPayments.concat(payment);
      const accountsTemp = await debtorUtil.getDebtorAccounts(payment.debtorId);
      // const waterfall = await this.waterfallRepository.getOne<IWaterfall>({
      //   debtorId: payment.debtorId,
      //   paymentId: payment._id,
      // });
      // let startWaterfall = !waterfall ? false : waterfall.execute;
      let startWaterfall = false;
      for (const account of accountsTemp) {
        if (account.paymentType === 'cc') {
          let response = await this.paymentService.authorizeCreditCard(
            payment.amount,
            account.vault,
            account.platform
          );
          const result = await this.processCommissionAuthorizedResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            account.platform,
            account.vault
          );
          if (retryPlus) retryPlus = false;
          if (!result) startWaterfall = true;
          if (result) {
            startWaterfall = false;
            break;
          }
        }
        if (account.paymentType === 'ck' || account.paymentType === 'ACH') {
          const reference = v4();
          for (const payment of concatedPayments) {
            await this.paymentRepository.updateById<IPayment>(payment._id, {
              ach: true,
              paymentReference: reference,
              paymentReferenceBool: true,
            });
          }
        }
      }
      if (startWaterfall && otherPayments.length) {
        await this.startWaterfallCC([payment], cronId, false, settings);
      }
      retryPlus = retryOriginalValue;
      await commonUtil.sleep(5000);
    }
  }

  async startWaterfallCC(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    let retryOriginalValue = retryPlus;
    for (const payment of payments) {
      const otherPayments: IPayment[] =
        await paymentUtil.getOtherPayments(payment);
      const totalLegalFeeAmount =
        await lawsuitUtil.getTotalLegalFee(otherPayments);
      const totalServiceFeeAmount = await lawsuitUtil.getTotalServiceFee(
        otherPayments.length ? [otherPayments[0]] : otherPayments
      );
      const accountsTemp = await debtorUtil.getCCAccounts(payment.debtorId);
      const allAccounts = await debtorUtil.getDebtorAccounts(payment.debtorId);
      const achPresent = await debtorUtil.ifACHPresent(allAccounts);
      let data = [];
      let updateObj = {};
      if (achPresent) {
        data = await paymentUtil.getAllAmounts(payment, true);
        updateObj['achWaterfall'] = true;
      }
      if (!achPresent) {
        data = await paymentUtil.getAllAmounts(payment, false);
        updateObj['ccWaterfall'] = true;
      }
      for (const temp of data) {
        if (temp.authorized !== 'Success') {
          for (const account of accountsTemp) {
            if (account.paymentType === 'cc') {
              let response = await this.paymentService.authorizeCreditCard(
                temp.amount,
                account.vault,
                account.platform
              );
              let result = await this.processAuthorizedResponse(
                temp.caseId === null ? payment : temp,
                response,
                retryPlus,
                cronId,
                settings,
                account.platform,
                totalServiceFeeAmount,
                totalLegalFeeAmount,
                account.vault
              );
              if (retryPlus) retryPlus = false;
              if (result) {
                temp.authorized = 'Success';
                if (!temp.caseId) {
                  // await waterfallUtil.upsertWaterfall(
                  //   payment.debtorId,
                  //   payment._id,
                  //   true
                  // );
                  const readyUpdate = {
                    commission: temp.amount,
                    ccWaterfall: true,
                    ...updateObj,
                  };
                  await this.paymentRepository.updateById<IPayment>(
                    temp.paymentId,
                    readyUpdate
                  );
                }
                if (!retryPlus) {
                  for (const payment of otherPayments) {
                    await this.paymentRepository.updateById<IPayment>(
                      payment._id,
                      updateObj
                    );
                  }
                }
                break;
              }
            }
          }
        }
        if (temp.authorized !== 'Success') {
          if (!temp.caseId) {
            break;
          }
        }
      }
      retryPlus = retryOriginalValue;
      await commonUtil.sleep(5000);
    }
  }

  async startWaterfallACH(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    let retryOriginalValue = retryPlus;
    for (const payment of payments) {
      const otherPayments: IPayment[] =
        await paymentUtil.getOtherPayments(payment);
      const totalLegalFeeAmount =
        await lawsuitUtil.getTotalLegalFee(otherPayments);
      const totalServiceFeeAmount = await lawsuitUtil.getTotalServiceFee(
        otherPayments.length ? [otherPayments[0]] : otherPayments
      );
      let concatedPayments = otherPayments.concat(payment);
      const creditorsAmount = otherPayments.reduce(
        (sum, obj) => sum + obj.amount,
        0
      );
      const accountsTemp = await debtorUtil.getACHAccounts(payment.debtorId);
      const debtor = await this.debtorRepository.getById<IDebtor>(
        payment.debtorId
      );
      let data = await paymentUtil.getAllAmounts(payment, false);
      let seamlesschexStart = false;
      for (const temp of data) {
        if (temp.authorized !== 'Success') {
          for (const account of accountsTemp) {
            const response = await paynoteUtil.directDebit(
              account.vault,
              payment,
              debtor
            );

            const result = await this.processACHCaptureResponse(
              temp.caseId === null ? payment : temp,
              response,
              retryPlus,
              cronId,
              settings,
              account.platform,
              totalServiceFeeAmount,
              totalLegalFeeAmount
            );
            if (retryPlus) retryPlus = false;
            if (result) {
              temp.authorized = 'Success';
              if (!retryPlus) {
                const update = {achWaterfall: true, ccWaterfall: false};
                if (!temp.caseId) update['commission'] = temp.amount;
                for (const payment of concatedPayments) {
                  await this.paymentRepository.updateById<IPayment>(
                    payment._id,
                    update
                  );
                }
              }
              break;
            }
          }
        }
        if (temp.authorized !== 'Success') {
          seamlesschexStart = true;
          if (!temp.caseId) {
            break;
          }
          // break;
        }
      }
      if (seamlesschexStart) {
        const accountsSeamlesschex = await debtorUtil.getSeamlesschexAccounts(
          payment.debtorId
        );
        if (accountsSeamlesschex.length) {
          let totalAmount = 0;
          let data = await paymentUtil.getAllAmounts(payment, false);
          totalAmount = data.reduce((acc, curr) => {
            if (curr.authorized !== 'Success') {
              return acc + curr.amount;
            }
            return acc;
          }, 0);
          if (totalAmount) {
            for (const account of accountsSeamlesschex) {
              const decryptedData = commonUtil.getDecryptedData(account.vault);
              const tokenResponse =
                await seemlesschexUtil.tokenization(decryptedData);
              const response = await seemlesschexUtil.createCheck(
                debtor,
                totalAmount,
                tokenResponse.tokenization.token,
                decryptedData
              );
              const result = await this.processACHCommissionResponse(
                payment,
                concatedPayments,
                response,
                retryPlus,
                cronId,
                settings,
                creditorsAmount,
                account.platform,
                debtor
              );
              if (retryPlus) retryPlus = false;
              if (result) {
                break;
              }
            }
          }
        }
      }
      retryPlus = retryOriginalValue;
      await commonUtil.sleep(5000);
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
    legalFee: number,
    ccVault: string
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
      updateObjPayment['ccVault'] = ccVault;
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
      if (retry === interval.maxRetry) updateObjPayment['nonExecutable'] = true;
      // const value = interval.value * retry;
      // const retryDate = this.getRetryDate(
      //   interval.unit,
      //   value,
      //   commonUtil.getCurrentDate()
      // );
      const retryDate = await this.getRescheduledDate(settings, payment);
      updateObjPayment['rescheduled'] = retryDate;
      emailUtil.sendEmailOrSmsByEvent(
        'failed_authorization',
        '',
        payment._id,
        ''
      );
    }
    if (retryPlus) updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
    console.log(payment._id, ' payment._id');
    console.log(updateObjPayment, 'updateObj');
    if (Object.keys(updateObjPayment).length) {
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
    }
    return result;
  }

  async getRescheduledDate(settings: ISettings[], payment: any) {
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const interval = retryInterval.failedAuthorization;
    const retry = payment.retriesAuth + 1;
    const value = interval.value * retry;
    const retryDate = this.getRetryDate(
      interval.unit,
      value,
      commonUtil.getCurrentDate()
    );
    return retryDate;
  }

  async processCommissionAuthorizedResponse(
    payment: any,
    payments: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    platform: string,
    ccVault: string
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
      updateObjPayment['ccVault'] = ccVault;
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
      if (retry === interval.maxRetry) updateObjPayment['nonExecutable'] = true;
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
  }

  async processCapture(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    let retryOriginalValue = retryPlus;
    for (const payment of payments) {
      const accountsTemp = await debtorUtil.getDebtorAccounts(payment.debtorId);
      const legalFeeAmount = await lawsuitUtil.getLegalFee(payment.caseId);
      const serviceFeeAmount = await lawsuitUtil.getServiceFee(payment.caseId);
      for (const account of accountsTemp) {
        if (account.paymentType === 'cc') {
          if (payment.debtorTransId) {
            let response = await this.paymentService.captureCreditCard(
              payment.ccVault,
              payment.debtorTransId,
              payment.paymentGateway
            );
            const result = await this.processCaptureResponse(
              payment,
              response,
              retryPlus,
              cronId,
              settings,
              'cc',
              payment.paymentGateway,
              accountsTemp,
              serviceFeeAmount,
              legalFeeAmount
            );
            if (retryPlus) retryPlus = false;
            break;
            // if (result) break;
          }
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.vault,
            payment.amount + serviceFeeAmount + legalFeeAmount,
            // payment.amount,
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
            accountsTemp,
            serviceFeeAmount,
            legalFeeAmount
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (account.paymentType === 'ACH' && account.platform === 'Paynote') {
          const response = await paynoteUtil.directDebit(
            account.vault,
            payment,
            payment.caseId?.debtor
          );
          const result = await this.processACHCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            account.platform,
            serviceFeeAmount,
            legalFeeAmount
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
        if (
          account.paymentType === 'ACH' &&
          account.platform === 'Seamlesschex'
        ) {
          const decryptedData = commonUtil.getDecryptedData(account.vault);
          const tokenResponse =
            await seemlesschexUtil.tokenization(decryptedData);
          const response = await seemlesschexUtil.createCheck(
            payment.caseId.debtor,
            payment.amount,
            tokenResponse.tokenization.token,
            decryptedData
          );
          const result = await this.processACHCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            account.platform,
            serviceFeeAmount,
            legalFeeAmount
          );
          if (retryPlus) retryPlus = false;
          if (result) break;
        }
      }
      retryPlus = retryOriginalValue;
      await commonUtil.sleep(5000);
    }
  }

  async processCommissionCapture(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    let retryOriginalValue = retryPlus;
    for (const payment of payments) {
      const otherPayments: IPayment[] =
        await paymentUtil.getPaymentReferenceDocuments(
          payment.paymentReference
        );
      const totalAmount = otherPayments.reduce(
        (sum, obj) => sum + obj.amount,
        0
      );
      const concatedPayments = otherPayments.concat(payment);
      const debtor = await this.debtorRepository.getById<IDebtor>(
        payment.debtorId
      );
      const accountsTemp = await debtorUtil.getDebtorAccounts(payment.debtorId);
      let startWaterfall = false;
      for (const account of accountsTemp) {
        if (account.paymentType === 'cc') {
          if (payment.ccVault) {
            let response = await this.paymentService.captureCreditCard(
              payment.ccVault,
              payment.debtorTransId,
              payment.paymentGateway
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
              payment.paymentGateway
            );
            if (retryPlus) retryPlus = false;
            break;
            // if (result) break;
          }
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.vault,
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

        if (account.paymentType === 'ACH' && account.platform === 'Paynote') {
          let response = await paynoteUtil.directDebit(
            account.vault,
            payment,
            debtor
          );
          const result = await this.processACHCommissionResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            totalAmount,
            account.platform,
            debtor
          );
          if (retryPlus) retryPlus = false;
          if (!result) startWaterfall = true;
          if (result) {
            startWaterfall = false;
            break;
          }
        }
      }
      if (startWaterfall && !otherPayments.length) {
        for (const account of accountsTemp) {
          if (
            account.paymentType === 'ACH' &&
            account.platform === 'Seamlesschex'
          ) {
            const decryptedData = commonUtil.getDecryptedData(account.vault);
            const tokenResponse =
              await seemlesschexUtil.tokenization(decryptedData);
            let response = await seemlesschexUtil.createCheck(
              debtor,
              payment.amount,
              tokenResponse.tokenization.token,
              decryptedData
            );
            const result = await this.processACHCommissionResponse(
              payment,
              concatedPayments,
              response,
              retryPlus,
              cronId,
              settings,
              totalAmount,
              account.platform,
              debtor
            );
            if (retryPlus) retryPlus = false;
            if (result) {
              break;
            }
          }
        }
      }
      if (startWaterfall && otherPayments.length) {
        await this.startWaterfallACH([payment], cronId, false, settings);
      }
      retryPlus = retryOriginalValue;
      await commonUtil.sleep(5000);
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
    accounts: IAccount[],
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
      const ifACHPresent = await debtorUtil.ifACHPresent(accounts);
      if (ifACHPresent) updateObjPayment['ccWaterfall'] = false;
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
      if (retry === interval.maxRetry) updateObjPayment['nonExecutable'] = true;
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

    const paymentLatest = await this.paymentRepository.getById<IPayment>(
      payment._id
    );
    if (paymentLatest.captured === 'Success') {
      result = true;
    } else {
      if (Object.keys(updateObjPayment).length) {
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          updateObjPayment
        );
      }
    }
    return result;
  }

  async processACHCaptureResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    platform: string,
    serviceFee?: number,
    legalFee?: number
    // commision?: number
  ) {
    // if (response?.error) return [false, response.message];
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const updateObjPayment = {};
    updateObjPayment['paymentGateway'] = platform;
    updateObjPayment['transactionType'] = 'ACH';
    let bv = null;
    if (response.success) {
      if (platform === 'Seamlesschex') {
        bv = await seemlesschexUtil.checkBasicVerification(response);
        // if (bv?.error) updateObjPayment['authorized'] = 'Failed';
      }
      await seemlesschexUtil.saveCheckInfo(
        bv,
        null,
        response,
        payment.debtorId
      );
      const transactionId = response.check.check_id;
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['checkStatus'] = 'Pending';
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['captured'] = 'Pending';
      lawsuitUtil.updatePaymentLawsuit([payment]);
      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['serviceFee'] = serviceFee;
      updateObjPayment['legalFee'] = legalFee;
      result = true;
      emailUtil.sendEmailOrSmsByEvent(
        'successful_capture',
        '',
        payment._id,
        ''
      );
      if (
        response.check.status === 'processed' ||
        response.check.status === 'deposited'
      ) {
        updateObjPayment['captured'] = 'Success';
        updateObjPayment['checkStatus'] = 'Success';
      }
    } else {
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = response.message;
      const interval = retryInterval.failedPayment;
      const retry = payment.retriesCapture + 1;
      if (retry === interval.maxRetry) updateObjPayment['nonExecutable'] = true;
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
      if (retry === interval.maxRetry) updateObjPayment['nonExecutable'] = true;
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

  async processACHCommissionResponse(
    payment: any,
    payments: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    amount: number,
    platform: string,
    debtor: IDebtor
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const updateObjPayment = {};
    updateObjPayment['paymentGateway'] = platform;
    updateObjPayment['transactionType'] = 'ACH';
    updateObjPayment['paymentMode'] = 'Direct Post';
    let bv = null;
    if (response?.success) {
      if (platform === 'Seamlesschex') {
        bv = await seemlesschexUtil.checkBasicVerification(response);
        // if (bv?.error) updateObjPayment['authorized'] = 'Failed';
      }
      await seemlesschexUtil.saveCheckInfo(bv, null, response, debtor._id);
      const transactionId = response.check.check_id;
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['captured'] = 'Pending';
      updateObjPayment['checkStatus'] = 'Pending';
      updateObjPayment['debtorTransId'] = transactionId;
      lawsuitUtil.updatePaymentLawsuit(payments);
      result = true;
      emailUtil.sendEmailOrSmsByEvent(
        'successful_capture',
        '',
        payment._id,
        ''
      );
      if (
        response.check.status === 'processed' ||
        response.check.status === 'deposited'
      ) {
        updateObjPayment['captured'] = 'Success';
        updateObjPayment['checkStatus'] = 'Completed';
        if (amount) {
          const commissionAmount = payment.amount - amount;
          console.log(commissionAmount, 'commissionAmount');
          await this.debtorRepository.updateById(payment.debtorId, {
            $inc: {commissionPaid: commissionAmount},
          });
        }
        if (!amount) {
          await this.debtorRepository.updateById(payment.debtorId, {
            $inc: {commissionPaid: payment.amount},
          });
        }
      }
    } else {
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = response.message;
      const interval = retryInterval.failedPayment;
      const retry = payment.retriesCapture + 1;
      if (retry === interval.maxRetry) updateObjPayment['nonExecutable'] = true;
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

  async sendLawfirmPayments() {
    const lawsuits: ILawsuit[] =
      await this.lawsuitRepository.getAllWithoutPagination<ILawsuit>({
        paymentsProceed: true,
      });
    console.log(lawsuits, 'lawsuits');
    const debtorIds = lawsuits.map(lawsuit => {
      return String(lawsuit.debtorId);
    });
    console.log(debtorIds, 'debtorIds');
    const pendingAttorneyPayments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          debtorId: {$in: debtorIds},
          sendViaPaynote: 'Pending',
          isDeleted: false,
          dueDate: {
            $gte: new Date(
              new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
            ),
            $lte: new Date(
              new Date(commonUtil.getCurrentDate()).setUTCHours(0, 0, 0, 0)
            ),
          },
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
    console.log(pendingAttorneyPayments, 'pendingAttorneyPayments');
    await this.paynotePending(pendingAttorneyPayments, false);

    const failedAttorneyPayments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
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
}

export default new CronJob();
