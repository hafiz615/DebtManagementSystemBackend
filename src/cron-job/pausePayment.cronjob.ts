import cron from 'node-cron';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';

class PausePayment {
  private debtorRepository: DebtorRepository;

  constructor() {
    this.debtorRepository = new DebtorRepository();
  }

  private getDateDaysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  private async pauseDebtorPaymentAmount() {
    const thirtyDaysAgo = this.getDateDaysAgo(30);

    const result = await this.debtorRepository.updateMany<IDebtor>(
      {
        paymentAmountCount: 1,
        lastPaymentAmountDate: {$lt: thirtyDaysAgo},
      },
      {
        paymentAmountCount: 0,
        lastPaymentAmountDate: null,
      }
    );
  }

  private async pauseDebtorPaymentDay() {
    const fourteenDaysAgo = this.getDateDaysAgo(14);

    const result = await this.debtorRepository.updateMany<IDebtor>(
      {
        paymentPauseCount: 2,
        lastPaymentPauseDate: {$lt: fourteenDaysAgo},
      },
      {
        paymentPauseCount: 0,
        lastPaymentPauseDate: null,
      }
    );
  }

  public startCronJob(): void {
    cron.schedule(
      '0 4 * * *',
      async () => {
        console.log(
          '[PausePayment] Running debtor pause task at 4 AM (America/New_York)'
        );
        await this.pauseDebtorPaymentAmount();
        await this.pauseDebtorPaymentDay();
      },
      {
        timezone: 'America/New_York',
      }
    );

    console.log(
      '[PausePayment] Cron job scheduled: daily at 4 AM (America/New_York)'
    );
  }
}

export default new PausePayment();
