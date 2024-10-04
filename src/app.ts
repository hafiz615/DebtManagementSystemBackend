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
    //   console.log(creditor);
    //   if (creditor?.paynoteUserId) continue;
    //   if (!creditor.basicInformation?.fullName) continue;
    //   const result = await paynoteUtil.createCustomer(creditor);
    //   if (result?.success)
    //     await credR.updateById(creditor._id, {
    //       paynoteUserId: result.user.user_id,
    //     });
    // }
    // await bulkUploadCronjob.testBulkCron();
    // const debtorRepo = new DebtorRepository();
    // const getAll = await debtorRepo.getAllWithoutPagination<IDebtor>();
    // for (const debtor of getAll) {
    //   await debtorRepo.updateById(debtor._id, {
    //     emailKey: `[${nanoid(10).toUpperCase().replace(/[_-]/g, '')}]`,
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
