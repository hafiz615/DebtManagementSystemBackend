import express, {Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Database} from './config/database.config';
import setup from './api/routes/base.route';
import paymentCronjob from './cron-job/payment.cronjob';
import logMiddleware from './middleware/logs.middleware'; // Import the logging middleware
import asyncLocalStorage from './utils/localStorage.util';
import {EnvSetup} from './database/repomodels/setEnv';
import emailUtil from './utils/email.util';
import googleDriveUtil from './utils/googleDrive.util';
import bulkUploadCronjob from './cron-job/bulkUpload.cronjob';
import {CreditorRepository} from './api/repository/creditor/creditor.repository';
import {ICreditor} from './database/interfaces/creditor.interface';
import paynoteUtil from './utils/paynote.util';
import {DebtorRepository} from './api/repository/debtor/debtor.repository';
import {IDebtor} from './database/interfaces/debtor.interface';
import {nanoid} from 'nanoid';
import creditorUtil from './utils/creditor.util';
import moneyThumbUtil from './utils/moneyThumb.util';
import {StrategyRepository} from './api/repository/strategy/strategy.repository';
import {IStrategy} from './database/interfaces/strategy.interface';
import {CaseRepository} from './api/repository/case/case.repository';
import {ICase} from './database/interfaces/case.interface';

class App {
  protected app: Application;
  protected database: Database;

  constructor() {
    this.app = express();
    this.config();
    this.database = new Database();
  }

  private config(): void {
    EnvSetup.setEnvVariables();
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    this.app.use(logMiddleware); // Use the logging middleware
    this.app.use((req, res, next) => {
      const traceId = 'X-DMS' + Date.now().toString().substring(4);
      asyncLocalStorage.run(new Map(), () => {
        const store = asyncLocalStorage.getStore();
        if (store) {
          store.set('traceId', traceId);
        }
        res.header('TraceId', traceId);
        next();
      });
    });
    setup(this.app);
  }

  public async start(): Promise<void> {
    const appPort = process.env.PORT || 3000;
    this.app.listen(appPort, () => {
      console.log(`Server running at http://localhost:${appPort}/`);
    });
    // const credR = new CreditorRepository();
    // const allCred = await credR.getAllWithoutPagination<ICreditor>();
    // for (const creditor of allCred) {
    //   // if (creditor?.paynoteUserId) continue;
    //   if (!creditor.basicInformation?.fullName) continue;
    //   const result = await paynoteUtil.createCustomer(creditor);
    //   console.log(result);
    //   if (result?.success)
    //     await credR.updateById(creditor._id, {
    //       paynoteUserId: result.user.user_id,
    //     });
    //   // await credR.updateById(creditor._id, {
    //   //   paynoteUserId: 'd3e73330-6f93-11ef-b474-4b26e6be0816',
    //   //   paynoteSourceId: 'fea18ac6-aa50-40cd-82ba-fe99789ba466',
    //   // });
    // }
    // await bulkUploadCronjob.testBulkCron();
    // const debtorRepo = new DebtorRepository();
    // const getAll = await debtorRepo.getAllWithoutPagination<IDebtor>();
    // for (const debtor of getAll) {
    //   await debtorRepo.updateById(debtor._id, {
    //     emailKey: `[${nanoid(10).toUpperCase().replace(/[_-]/g, '')}]`,
    //   });
    // }
    // const token = await moneyThumbUtil.authenticateUser();
    // const app = await moneyThumbUtil.createNewApp(
    //   token,
    //   '66f1221440020aa3522ec604'
    // );
    // await moneyThumbUtil.convertPdf(
    //   token,
    //   '66f1221440020aa3522ec604',
    //   app['appid']
    // );
    // const card = await moneyThumbUtil.getScoreCard(token, app['appid']);
    // moneyThumbUtil.saveData(app['appid'], card, '66ae508b14a585538d6921a3');

    // const debtors = await debtorRepo.getAllWithoutPagination<IDebtor>();
    // for (let i = 23; i < debtors.length; i++) {
    //   await moneyThumbUtil.run(String(debtors[i]._id));
    // }
    // const strat = new StrategyRepository();
    // const caseRepo = new CaseRepository();
    // const all = await strat.getAllWithoutPagination<IStrategy>({
    //   name: 'strategy_one',
    // });
    // for (const strategy of all) {
    //   const caseTemp = await caseRepo.getById<ICase>(strategy.caseId);
    //   if (strategy?.data?.settlementRange) {
    //     const sett = strategy.data.settlementRange;
    //     const str1 = sett.true_profit * 0.67;
    //     const str2 = sett.profitability * 0.67;

    //     await debtorRepo.updateById<IDebtor>(String(caseTemp.debtor), {
    //       strategy1MaxProfit: Math.round(str1 * 100) / 100,
    //       strategy3MaxProfit: Math.round(str2 * 100) / 100,
    //     });
    //   }
    // }
    // const caseRepo = new CaseRepository();
    // const cases = await caseRepo.getAllWithoutPagination<ICase>();
    // for (const temp of cases) {
    //   console.log('ok');
    //   await caseRepo.updateById(temp._id, {
    //     remainingAmountPaid: temp.remaining,
    //   });
    // }
    bulkUploadCronjob.startCronJob();
    // paymentCronjob.processPayments();
    paymentCronjob.startCronJob();
    // paymentCronjob.testCron();
    // paymentCronjob.testDebtor();
    // paymentCronjob.testPaynote();
  }
}

const app = new App();
app.start();
