import cron from 'node-cron';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {IPayment} from '../database/interfaces/payment.interface';
import paymentUtil from '../utils/payment.util';
import {SettingsRepository} from '../api/repository/setting/settings.repository';
import {ISettings} from '../database/interfaces/settings.interface';
import {URLSearchParams} from 'url';
import {PaymentLoggingRepository} from '../api/repository/paymentLogging/paymentLogging.repository';
import {PaymentLogging} from '../database/repomodels/paymentLogging.repomodel';
import commonUtil from '../utils/common.util';
import {v4 as uuidv4, v4} from 'uuid';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Payment} from '../database/repomodels/payment.repomodel';
import mongoose from 'mongoose';
import {DataCopier} from '../utils/dataCopier.util';
import {IPaymentLogging} from '../database/interfaces/paymentLogging.interface';
import paynoteUtil from '../utils/paynote.util';
import emailUtil from '../utils/email.util';
import PaymentService from '../api/services/payment.service';
import {CaseRepository} from '../api/repository/case/case.repository';
import {ICase} from '../database/interfaces/case.interface';
import creditorUtil from '../utils/creditor.util';
import debtorUtil from '../utils/debtor.util';

class CronJob {
  private paymentRepository: PaymentRepository;
  private paymentService: PaymentService;
  private settingsRepository: SettingsRepository;
  private paymentLoggingRepository: PaymentLoggingRepository;
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.settingsRepository = new SettingsRepository();
    this.paymentService = new PaymentService();
    this.paymentLoggingRepository = new PaymentLoggingRepository();
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
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
  async testDebtor() {
    const cronId = uuidv4();
    const debtors =
      await this.debtorRepository.getAllWithoutPagination<IDebtor>(
        undefined,
        undefined,
        '+totalCommission +commissionPaid +weeklyCommission +weeklyCommissionPaid +weeklyCommissionDate +commissionPaymentId',
        {createdAt: 1}
      );
    for (const debtor of debtors) {
      if (debtor.totalCommission === debtor.commissionPaid) {
        continue;
      }
      let payment: any;
      if (debtor.commissionPaymentId) {
        payment = await this.paymentRepository.getById<IPayment>(
          debtor.commissionPaymentId
        );
      } else {
        payment = await this.getCommissionDocument(
          debtor._id,
          debtor.weeklyCommission
        );
      }
      if (
        debtor.weeklyCommissionPaid &&
        this.checkCommissionTimePeriod(payment.dueDate, 'weekly')
      ) {
        const paymentDoc = await this.getCommissionDocument(
          debtor._id,
          debtor.weeklyCommission
        );
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
      let commisionToPay = await this.calculateCommission(
        debtor.totalCommission,
        debtor.commissionPaid,
        debtor.weeklyCommission
      );
      const retryCommissionInterval = {
        unit: 'hours',
        value: 8,
        maxRetry: 3,
      };

      if (!debtor.weeklyCommissionPaid) {
        for (const account of debtor.accounts) {
          if (payment.authorized === 'Pending') {
            if (account.paymentType === 'cc') {
              const response = await this.paymentService.authorizeCreditCard(
                commisionToPay,
                account.customerVaultId
              );
              const result = await this.processCommissionAuthResponse(
                payment,
                response,
                false,
                cronId
              );
              if (result) {
                payment = await this.paymentRepository.getById<IPayment>(
                  debtor.commissionPaymentId
                );
                break;
              }
            }
            if (account.paymentType === 'ck') {
              const response = await this.paymentService.achCredit(
                account.customerVaultId,
                commisionToPay,
                ''
              );
              const result = await this.processCommissionCaptureResponse(
                payment,
                response,
                false,
                cronId,
                'ck'
              );
              if (result) {
                await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                break;
              }
            }
          }
          if (payment.authorized === 'Failed') {
            if (payment.retriesAuth === retryCommissionInterval.maxRetry)
              continue;
            if (this.checkCommissionTimePeriod(payment.rescheduled, 'hours')) {
              if (account.paymentType === 'cc') {
                const response = await this.paymentService.authorizeCreditCard(
                  commisionToPay,
                  account.customerVaultId
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
                  break;
                }
              }
            }
          }
          if (payment.authorized === 'Success') {
            if (payment.captured === 'Pending') {
              if (account.paymentType === 'cc') {
                const response = await this.paymentService.captureCreditCard(
                  account.customerVaultId,
                  payment.debtorTransId,
                  ''
                );
                const result = await this.processCommissionCaptureResponse(
                  payment,
                  response,
                  false,
                  cronId,
                  'cc'
                );
                if (result) {
                  await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                  break;
                }
              }
              if (account.paymentType === 'ck') {
                const response = await this.paymentService.achCredit(
                  account.customerVaultId,
                  commisionToPay,
                  ''
                );
                const result = await this.processCommissionCaptureResponse(
                  payment,
                  response,
                  false,
                  cronId,
                  'ck'
                );
                if (result) {
                  await this.updateDebtorPaidValues(debtor._id, commisionToPay);
                  break;
                }
              }
            }
            if (payment.captured === 'Failed') {
              if (payment.retriesCapture === retryCommissionInterval.maxRetry) {
                continue;
              }
              if (
                this.checkCommissionTimePeriod(payment.rescheduled, 'hours')
              ) {
                if (account.paymentType === 'cc') {
                  const response = await this.paymentService.captureCreditCard(
                    account.customerVaultId,
                    payment.debtorTransId,
                    ''
                  );
                  const result = await this.processCommissionCaptureResponse(
                    payment,
                    response,
                    true,
                    cronId,
                    'cc'
                  );
                  if (result) {
                    await this.updateDebtorPaidValues(
                      debtor._id,
                      commisionToPay
                    );
                    break;
                  }
                }
                if (account.paymentType === 'ck') {
                  const response = await this.paymentService.achCredit(
                    account.customerVaultId,
                    commisionToPay,
                    ''
                  );
                  const result = await this.processCommissionCaptureResponse(
                    payment,
                    response,
                    true,
                    cronId,
                    'ck'
                  );
                  if (result) {
                    await this.updateDebtorPaidValues(
                      debtor._id,
                      commisionToPay
                    );
                    break;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  async testPaynote() {
    const pendingPayments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {captured: 'Success', sendViaPaynote: 'Pending', caseId: {$ne: null}},
        undefined,
        undefined,
        undefined,
        {
          path: 'caseId',
          select: ['_id', 'caseCode'],
          populate: ['creditor'],
        }
      );
    await this.paynotePending(pendingPayments);

    const failedPayments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {captured: 'Success', sendViaPaynote: 'Failed', caseId: {$ne: null}},
        undefined,
        undefined,
        undefined,
        {
          path: 'caseId',
          select: ['_id', 'caseCode'],
          populate: ['creditor'],
        }
      );
    await this.paynoteFailed(failedPayments);

    // for (const payment of payments) {
    //   if (payment.caseId.creditor.paynoteUserId) {
    //     const paynoteCustomer = await paynoteUtil.getCustomer(
    //       payment.caseId.creditor
    //     );
    //     if (paynoteCustomer.error) continue;
    //     // if (paynoteCustomer.user.status === 'unverified') continue;
    //     console.log(paynoteCustomer);
    //     const paymentResult = await paynoteUtil.sendPayment(payment);
    //     console.log(paymentResult);
    //     if (paymentResult.error) {
    //       console.log('Send Email');
    //       let message = '';
    //       if (paymentResult?.messages) {
    //         message = paymentResult.messages[0];
    //       } else {
    //         message = paymentResult.message;
    //       }
    //       console.log(message, 'message');
    //       await this.paymentRepository.updateById<IPayment>(payment._id, {
    //         sendViaPaynote: 'Failed',
    //       });
    //       // emailUtil.sendEmailOrSmsByEvent(
    //       //   'failed_payment',
    //       //   '',
    //       //   payment._id,
    //       //   ''
    //       // );
    //       continue;
    //     }
    //     // emailUtil.sendEmailOrSmsByEvent(
    //     //   'successful_payment',
    //     //   '',
    //     //   payment._id,
    //     //   ''
    //     // );
    //     await this.paymentRepository.updateById<IPayment>(payment._id, {
    //       paynoteCheckId: paymentResult.check.check_id,
    //       sendViaPaynote: 'Success',
    //     });
    //   }
    // }
  }
  startCronJob() {
    cron.schedule('30 * * * *', async () => {
      console.log('Running a task every zero of an hour');
      // const payments: any = await paymentUtil.getAllCronJobPayments();
      await this.processPayments();
    });

    cron.schedule('0 * * * *', async () => {
      console.log('Running a task every zero of an hour');
      // const payments: any = await paymentUtil.getAllCronJobPayments();
      await this.processCommissionPayments();
    });

    // cron.schedule('30 * * * *', async () => {
    //   console.log('Running a task every 30 min of an hour');
    //   const cronId = uuidv4();
    //   const debtors =
    //     await this.debtorRepository.getAllWithoutPagination<IDebtor>(
    //       undefined,
    //       undefined,
    //       '+totalCommission +commissionPaid +weeklyCommission +weeklyCommissionPaid +weeklyCommissionDate +commissionPaymentId',
    //       {createdAt: 1}
    //     );
    //   for (const debtor of debtors) {
    //     if (debtor.totalCommission === debtor.commissionPaid) {
    //       continue;
    //     }
    //     let payment: any;
    //     if (debtor.commissionPaymentId) {
    //       payment = await this.paymentRepository.getById<IPayment>(
    //         debtor.commissionPaymentId
    //       );
    //     } else {
    //       payment = await this.getCommissionDocument(
    //         debtor._id,
    //         debtor.weeklyCommission
    //       );
    //     }
    //     if (
    //       debtor.weeklyCommissionPaid &&
    //       this.checkCommissionTimePeriod(payment.dueDate, 'weekly')
    //     ) {
    //       const paymentDoc = await this.getCommissionDocument(
    //         debtor._id,
    //         debtor.weeklyCommission
    //       );
    //       await this.debtorRepository.updateById<IDebtor>(debtor._id, {
    //         weeklyCommissionPaid: false,
    //         commissionPaymentId: paymentDoc.id,
    //       });
    //       continue;
    //     }
    //     if (
    //       debtor.weeklyCommissionPaid &&
    //       !this.checkCommissionTimePeriod(payment.dueDate, 'weekly')
    //     ) {
    //       continue;
    //     }
    //     let commisionToPay = await this.calculateCommission(
    //       debtor.totalCommission,
    //       debtor.commissionPaid,
    //       debtor.weeklyCommission
    //     );
    //     const retryCommissionInterval = {
    //       unit: 'hours',
    //       value: 8,
    //       maxRetry: 3,
    //     };

    //     if (!debtor.weeklyCommissionPaid) {
    //       for (const account of debtor.accounts) {
    //         if (payment.authorized === 'Pending') {
    //           if (account.paymentType === 'cc') {
    //             const response = await this.paymentService.authorizeCreditCard(
    //               commisionToPay,
    //               account.customerVaultId
    //             );
    //             const result = await this.processCommissionAuthResponse(
    //               payment,
    //               response,
    //               false,
    //               cronId
    //             );
    //             if (result) {
    //               payment = await this.paymentRepository.getById<IPayment>(
    //                 debtor.commissionPaymentId
    //               );
    //               break;
    //             }
    //           }
    //           if (account.paymentType === 'ck') {
    //             const response = await this.paymentService.achCredit(
    //               account.customerVaultId,
    //               commisionToPay,
    //               ''
    //             );
    //             const result = await this.processCommissionCaptureResponse(
    //               payment,
    //               response,
    //               false,
    //               cronId,
    //               'ck'
    //             );
    //             if (result) {
    //               await this.updateDebtorPaidValues(debtor._id, commisionToPay);
    //               break;
    //             }
    //           }
    //         }
    //         if (payment.authorized === 'Failed') {
    //           if (payment.retriesAuth === retryCommissionInterval.maxRetry)
    //             continue;
    //           if (
    //             this.checkCommissionTimePeriod(payment.rescheduled, 'hours')
    //           ) {
    //             if (account.paymentType === 'cc') {
    //               const response =
    //                 await this.paymentService.authorizeCreditCard(
    //                   commisionToPay,
    //                   account.customerVaultId
    //                 );
    //               const result = await this.processCommissionAuthResponse(
    //                 payment,
    //                 response,
    //                 true,
    //                 cronId
    //               );
    //               if (result) {
    //                 payment = await this.paymentRepository.getById<IPayment>(
    //                   debtor.commissionPaymentId
    //                 );
    //                 break;
    //               }
    //             }
    //           }
    //         }
    //         if (payment.authorized === 'Success') {
    //           if (payment.captured === 'Pending') {
    //             if (account.paymentType === 'cc') {
    //               const response = await this.paymentService.captureCreditCard(
    //                 account.customerVaultId,
    //                 payment.debtorTransId,
    //                 ''
    //               );
    //               const result = await this.processCommissionCaptureResponse(
    //                 payment,
    //                 response,
    //                 false,
    //                 cronId,
    //                 'cc'
    //               );
    //               if (result) {
    //                 await this.updateDebtorPaidValues(
    //                   debtor._id,
    //                   commisionToPay
    //                 );
    //                 break;
    //               }
    //             }
    //             if (account.paymentType === 'ck') {
    //               const response = await this.paymentService.achCredit(
    //                 account.customerVaultId,
    //                 commisionToPay,
    //                 ''
    //               );
    //               const result = await this.processCommissionCaptureResponse(
    //                 payment,
    //                 response,
    //                 false,
    //                 cronId,
    //                 'ck'
    //               );
    //               if (result) {
    //                 await this.updateDebtorPaidValues(
    //                   debtor._id,
    //                   commisionToPay
    //                 );
    //                 break;
    //               }
    //             }
    //           }
    //           if (payment.captured === 'Failed') {
    //             if (
    //               payment.retriesCapture === retryCommissionInterval.maxRetry
    //             ) {
    //               continue;
    //             }
    //             if (
    //               this.checkCommissionTimePeriod(payment.rescheduled, 'hours')
    //             ) {
    //               if (account.paymentType === 'cc') {
    //                 const response =
    //                   await this.paymentService.captureCreditCard(
    //                     account.customerVaultId,
    //                     payment.debtorTransId,
    //                     ''
    //                   );
    //                 const result = await this.processCommissionCaptureResponse(
    //                   payment,
    //                   response,
    //                   true,
    //                   cronId,
    //                   'cc'
    //                 );
    //                 if (result) {
    //                   await this.updateDebtorPaidValues(
    //                     debtor._id,
    //                     commisionToPay
    //                   );
    //                   break;
    //                 }
    //               }
    //               if (account.paymentType === 'ck') {
    //                 const response = await this.paymentService.achCredit(
    //                   account.customerVaultId,
    //                   commisionToPay,
    //                   ''
    //                 );
    //                 const result = await this.processCommissionCaptureResponse(
    //                   payment,
    //                   response,
    //                   true,
    //                   cronId,
    //                   'ck'
    //                 );
    //                 if (result) {
    //                   await this.updateDebtorPaidValues(
    //                     debtor._id,
    //                     commisionToPay
    //                   );
    //                   break;
    //                 }
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // });

    cron.schedule('15 * * * *', async () => {
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
          },
          undefined,
          undefined,
          undefined,
          {
            path: 'caseId',
            select: ['_id', 'caseCode', 'remaining'],
            populate: [
              {
                path: 'creditor',
                select: [
                  'paynoteSourceId',
                  'paynoteUserId',
                  'basicInformation.fullName',
                ],
              },
              {path: 'debtor', select: ['_id', 'basicInformation.fullName']},
            ],
          }
        );
      await this.paynotePending(pendingPayments);

      const failedPayments =
        await this.paymentRepository.getAllWithoutPagination<IPayment>(
          {captured: 'Success', sendViaPaynote: 'Failed', caseId: {$ne: null}},
          undefined,
          undefined,
          undefined,
          {
            path: 'caseId',
            select: ['_id', 'caseCode', 'remaining'],
            populate: [
              {
                path: 'creditor',
                select: [
                  'paynoteSourceId',
                  'paynoteUserId',
                  'basicInformation.fullName',
                ],
              },
              {path: 'debtor', select: ['_id', 'basicInformation.fullName']},
            ],
          }
        );

      await this.paynoteFailed(failedPayments);

      // for (const payment of payments as any) {
      //   if (payment.caseId.creditor.paynoteUserId) {
      //     const paynoteCustomer = await paynoteUtil.getCustomer(
      //       payment.caseId.creditor
      //     );
      //     if (paynoteCustomer.error) continue;
      //     if (paynoteCustomer.user.status === 'unverified') continue;
      //     const paymentResult = await paynoteUtil.sendPayment(payment);
      //     console.log(paymentResult);
      //     if (paymentResult.error) {
      //       console.log('Send Email');
      //       let message = '';
      //       if (paymentResult?.messages) {
      //         message = paymentResult.messages[0];
      //       } else {
      //         message = paymentResult.message;
      //       }
      //       console.log(message, 'message');
      //       await this.paymentRepository.updateById<IPayment>(payment._id, {
      //         sendViaPaynote: 'Failed',
      //       });
      //       emailUtil.sendEmailOrSmsByEvent(
      //         'failed_payment',
      //         '',
      //         payment._id,
      //         ''
      //       );
      //       continue;
      //     }

      //     emailUtil.sendEmailOrSmsByEvent(
      //       'successful_payment',
      //       '',
      //       payment._id,
      //       ''
      //     );
      //     await this.paymentRepository.updateById<IPayment>(payment._id, {
      //       paynoteCheckId: paymentResult.check.check_id,
      //       sendViaPaynote: 'Success',
      //     });
      //   }
      // }
    });

    // cron.schedule('0 21 * * *', async () => {
    //   const today = new Date(commonUtil.getCurrentDate());
    //   const targetDate = new Date(commonUtil.getCurrentDate());
    //   targetDate.setDate(today.getDate() + 2); // Add 2 days to the current date

    //   // Set the targetDate to the start of the day (00:00:00) for comparison
    //   const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    //   const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    //   const payments: IPayment[] =
    //     await this.paymentRepository.getAllWithoutPagination<IPayment>({
    //       status: 'Upcoming',
    //       caseId: {$ne: null},
    //       dueDate: {
    //         $gte: startOfDay,
    //         $lte: endOfDay,
    //       },
    //     });

    //   for (const payment of payments) {
    //     emailUtil.sendEmailOrSmsByEvent(
    //       'upcoming_payment',
    //       '',
    //       payment._id,
    //       ''
    //     );
    //   }
    // });
  }

  async paynotePending(payments: any) {
    const retryPaynoteInterval = {
      unit: 'days',
      value: 1,
      maxRetry: 2,
    };
    await this.processPaynotePayments(payments, false, retryPaynoteInterval);
  }

  async paynoteFailed(payments: any) {
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
    await this.processPaynotePayments(
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
      if (
        payment.caseId.creditor.paynoteUserId &&
        payment.caseId.creditor.paynoteSourceId
      ) {
        // const paynoteCustomer = await paynoteUtil.getCustomer(
        //   payment.caseId.creditor
        // );
        // console.log(paynoteCustomer);
        // if (paynoteCustomer.error) continue;
        // if (paynoteCustomer.user.status === 'unverified') continue;
        const paymentResult = await paynoteUtil.sendPayment(payment);
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
            payment.dueDate
          );
          let retries = payment.retriesAuth;
          if (retryPlus) retries += 1;
          await this.paymentRepository.updateById<IPayment>(payment._id, {
            sendViaPaynote: 'Failed',
            rescheduled: retryDate,
            retriesPaynote: retries,
            failedReasonPaynote: message,
          });
          // emailUtil.sendEmailOrSmsByEvent(
          //   'failed_payment',
          //   '',
          //   payment._id,
          //   ''
          // );
          continue;
        }

        // emailUtil.sendEmailOrSmsByEvent(
        //   'successful_payment',
        //   '',
        //   payment._id,
        //   ''
        // );
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

  async processPayments() {
    // const payments: any = await paymentUtil.getAllCronJobPayments();
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
    const paymentsFailedCaptured = await paymentUtil.getFailedCaptured();
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

  async updateDebtorPaidValues(id: string, commission: number) {
    await this.debtorRepository.updateById<IDebtor>(id, {
      weeklyCommissionPaid: true,
      $inc: {commissionPaid: commission},
    });
  }

  async calculateCommission(
    totalCommision: number,
    commissionPaid: number,
    weeklyCommission: number
  ) {
    let sumTotalPaidWeekly = commissionPaid + weeklyCommission;
    if (sumTotalPaidWeekly <= totalCommision) return weeklyCommission;
    let amountUp = sumTotalPaidWeekly - totalCommision;
    return weeklyCommission - amountUp;
  }

  async getCommissionDocument(debtorId: string, amount: number) {
    const payment = new Payment();
    payment.timePeriod = 'hours';
    payment.dueDate = commonUtil.getCurrentDate();
    payment.debtorId = debtorId;
    payment.caseId = null;
    payment.amount = amount;
    const createdPayment = await this.paymentRepository.create<IPayment>(
      payment as any
    );
    await this.debtorRepository.updateById<IDebtor>(debtorId, {
      commissionPaymentId: createdPayment.id,
    });
    return createdPayment;
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
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['status'] = 'Pending';

      successAuth = true;
      // emailUtil.sendEmailOrSmsByEventForCommission(
      //   'successful_payment',
      //   payment
      // );
    } else {
      updateObjPayment['authorized'] = 'Failed';
      updateObjPayment['status'] = 'Pending';
      updateObjPayment['failedReasonAuthorization'] = responseText;
      const retry = payment.retriesAuth + 1;
      const value = retryCommissionInterval.value * retry;
      const retryDate = this.getRetryDate(
        retryCommissionInterval.unit,
        value,
        payment.dueDate
      );
      updateObjPayment['rescheduled'] = retryDate;
      // emailUtil.sendEmailOrSmsByEventForCommission('failed_payment', payment);
    }
    if (retryPlus) updateObjPayment['retriesAuth'] = payment.retriesAuth + 1;
    if (Object.keys(updateObjPayment).length) {
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
    }
    return successAuth;
  }

  async processCommissionCaptureResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    type: string
  ) {
    const retryCommissionInterval = {
      unit: 'hours',
      value: 8,
      maxRetry: 3,
    };
    let successCapture = false;
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Success';
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        updateObjPayment['debtorTransId'] = transactionId;
      }
      await this.debtorRepository.updateById<IDebtor>(payment._id, {
        weeklyCommissionPaid: true,
      });
      successCapture = true;
      // emailUtil.sendEmailOrSmsByEventForCommission(
      //   'successful_payment',
      //   payment
      // );
    } else {
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        updateObjPayment['status'] = 'Pending';
      }
      updateObjPayment['captured'] = 'Failed';
      updateObjPayment['failedReasonCaptured'] = responseText;
      const retry = payment.retriesCapture + 1;
      const value = retryCommissionInterval.value * retry;
      const retryDate = this.getRetryDate(
        retryCommissionInterval.unit,
        value,
        payment.dueDate
      );
      updateObjPayment['rescheduled'] = retryDate;

      // emailUtil.sendEmailOrSmsByEventForCommission('failed_payment', payment);
    }
    if (retryPlus)
      updateObjPayment['retriesCapture'] = payment.retriesCapture + 1;
    if (Object.keys(updateObjPayment).length) {
      await this.paymentRepository.updateById<IPayment>(
        payment._id,
        updateObjPayment
      );
    }
    return successCapture;
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
    return currentDate >= dateTemp;
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
    // const pendingAuthorized = payments[0].pendingAuthorized.filter(
    //   (payment: IPayment) => {
    //     if (payment.timePeriod) {
    //       const interval =
    //         authorizationInterval[payment.timePeriod.toLowerCase()];
    //       return this.shouldAuthorize(interval.unit, interval.value, payment);
    //     }
    //     return false;
    //   }
    // );
    const pendingAuthorized = payments.filter((payment: IPayment) => {
      if (payment.timePeriod) {
        const interval =
          authorizationInterval[payment.timePeriod.toLowerCase()];
        return this.shouldAuthorize(interval.unit, interval.value, payment);
      }
      return false;
    });
    return pendingAuthorized;
    // await this.processAuthorized(pendingAuthorized, cronId, false, settings);
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
    // const pendingCaptured = payments[0].pendingCaptured.filter(
    //   (payment: IPayment) => {
    //     return currentDate.getTime() >= new Date(payment.dueDate).getTime();
    //   }
    // );
    const pendingCaptured = payments.filter((payment: IPayment) => {
      return currentDate.getTime() >= new Date(payment.dueDate).getTime();
    });
    return pendingCaptured;
    // await this.processCapture(pendingCaptured, cronId, false, settings);
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
    // const filterPaymentWithRetries = payments[0].failedAuthorized.filter(
    //   (payment: IPayment) => {
    //     return (
    //       payment.retriesAuth != retryInterval.failedAuthorization.maxRetry
    //     );
    //   }
    // );
    const filterPaymentWithRetries = payments.filter((payment: IPayment) => {
      return payment.retriesAuth != retryInterval.failedAuthorization.maxRetry;
    });
    const failedAuthorized = filterPaymentWithRetries.filter(
      (payment: IPayment) => {
        return this.retry(payment.rescheduled);
      }
    );
    return failedAuthorized;
    // await this.processAuthorized(failedAuthorized, cronId, true, settings);
  }

  async processAuthorized(
    payments: any,
    cronId: string,
    retryPlus: boolean,
    settings: ISettings[]
  ) {
    for (const payment of payments) {
      const accounts = payment.caseId.debtor.accounts;
      const getCommission = await debtorUtil.getCommissionAmount(payment);
      const sum = getCommission + payment.amount;
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.authorizeCreditCard(
            sum,
            account.customerVaultId
          );
          const result = await this.processAuthorizedResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            getCommission
          );
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.customerVaultId,
            sum,
            ''
          );
          const result = await this.processCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            'ck',
            getCommission
          );
          if (result) break;
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
      const otherPayments: IPayment[] = await this.getOtherPayments(payment);
      const totalAmount = otherPayments.reduce(
        (sum, obj) => sum + obj.amount,
        0
      );
      const concatedPayments = otherPayments.concat(payment);
      const accounts = payment.caseId.debtor.accounts;
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.authorizeCreditCard(
            payment.amount,
            account.customerVaultId
          );
          const result = await this.processCommissionAuthorizedResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings
          );
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.customerVaultId,
            totalAmount,
            ''
          );
          const result = await this.processCaptureCommissionResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            'ck',
            totalAmount
          );
          if (result) break;
        }
      }
    }
  }

  async getOtherPayments(payment: IPayment) {
    const debtorId = payment.debtorId;
    const nextDate = await this.addDaysBasedOnPeriod(
      payment.dueDate,
      payment.timePeriod
    );
    const payments =
      await this.paymentRepository.getAllWithoutPagination<IPayment>({
        debtorId: debtorId,
        caseId: {$ne: null},
        dueDate: {
          $gte: new Date(payment.dueDate),
          $lt: nextDate,
        },
      });
    return payments;
  }

  async addDaysBasedOnPeriod(date: string, timePeriod: string) {
    const timePeriods = {
      daily: 1,
      weekly: 7,
      fortnightly: 14,
      monthly: 30,
      custom: 0,
    };

    let daysToAdd = timePeriods[timePeriod.toLowerCase()];

    if (!daysToAdd) {
      daysToAdd = 7;
    }

    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + daysToAdd);

    return resultDate;
  }
  async processAuthorizedResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    commission: number
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
      updateObjPayment['commission'] = commission;
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
      const interval = retryInterval.failedAuthorization;
      const retry = payment.retriesAuth + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        payment.dueDate
      );
      updateObjPayment['rescheduled'] = retryDate;
      // emailUtil.sendEmailOrSmsByEvent(
      //   'failed_authorization',
      //   '',
      //   payment._id,
      //   ''
      // );
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
    settings: ISettings[]
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');

      updateObjPayment['debtorTransId'] = transactionId;
      updateObjPayment['authorized'] = 'Success';
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
      const interval = retryInterval.failedAuthorization;
      const retry = payment.retriesAuth + 1;
      const value = interval.value * retry;
      const retryDate = this.getRetryDate(
        interval.unit,
        value,
        payment.dueDate
      );
      updateObjPayment['rescheduled'] = retryDate;
      // emailUtil.sendEmailOrSmsByEvent(
      //   'failed_authorization',
      //   '',
      //   payment._id,
      //   ''
      // );
    }
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
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.captureCreditCard(
            account.customerVaultId,
            payment.debtorTransId,
            ''
          );
          const result = await this.processCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            'cc'
          );
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.customerVaultId,
            payment.amount,
            ''
          );
          const result = await this.processCaptureResponse(
            payment,
            response,
            retryPlus,
            cronId,
            settings,
            'ck'
          );
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
      const otherPayments: IPayment[] = await this.getPaymentReferenceDocuments(
        payment.paymentReference
      );
      const totalAmount = otherPayments.reduce(
        (sum, obj) => sum + obj.amount,
        0
      );
      const concatedPayments = otherPayments.concat(payment);
      const accounts = payment.caseId.debtor.accounts;
      for (const account of accounts) {
        if (account.paymentType === 'cc') {
          const response = await this.paymentService.captureCreditCard(
            account.customerVaultId,
            payment.debtorTransId,
            ''
          );
          const result = await this.processCaptureCommissionResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            'cc',
            totalAmount
          );
          if (result) break;
        }
        if (account.paymentType === 'ck') {
          const response = await this.paymentService.achCredit(
            account.customerVaultId,
            payment.amount,
            ''
          );
          const result = await this.processCaptureCommissionResponse(
            payment,
            concatedPayments,
            response,
            retryPlus,
            cronId,
            settings,
            'ck',
            totalAmount
          );
          if (result) break;
        }
      }
    }
  }

  async getPaymentReferenceDocuments(referenceId: string) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>({
      paymentReference: referenceId,
      paymentReferenceBool: true,
      caseId: {$ne: null},
    });
  }

  async processCaptureResponse(
    payment: any,
    response: any,
    retryPlus: boolean,
    cronId: string,
    settings: ISettings[],
    type: string,
    commision?: number
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        updateObjPayment['debtorTransId'] = transactionId;
        updateObjPayment['commission'] = commision;
      }
      result = true;
      // emailUtil.sendEmailOrSmsByEvent(
      //   'successful_payment',
      //   '',
      //   payment._id,
      //   ''
      // );
    } else {
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        // updateObjPayment['status'] = 'Pending';
      }
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

      // emailUtil.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
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
    amount: number
  ) {
    let result = false;
    const {retryInterval} = settings.length
      ? settings[0].paymentsAuthorizations
      : this.defaultRetryInterval();
    const responseNum = new URLSearchParams(response).get('response');
    const responseText = new URLSearchParams(response).get('responsetext');
    const updateObjPayment = {};
    if (responseNum === '1') {
      const transactionId = new URLSearchParams(response).get('transactionid');
      updateObjPayment['captured'] = 'Success';
      updateObjPayment['status'] = 'Pending';
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        updateObjPayment['debtorTransId'] = transactionId;
      }
      result = true;
      // emailUtil.sendEmailOrSmsByEvent(
      //   'successful_payment',
      //   '',
      //   payment._id,
      //   ''
      // );
      if (amount) {
        const commissionAmount = payment.amount - amount;
        await this.paymentRepository.updateById<IPayment>(payment._id, {
          amount: commissionAmount,
        });
        await this.debtorRepository.updateById(payment.debtorId, {
          $inc: {commissionPaid: commissionAmount},
        });
      }
    } else {
      if (type === 'ck') {
        updateObjPayment['authorized'] = 'Success';
        // updateObjPayment['status'] = 'Pending';
      }
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

      // emailUtil.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
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
