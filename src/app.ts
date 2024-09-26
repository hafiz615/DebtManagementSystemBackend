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
    // await bulkUploadCronjob.testBulkCron();
    bulkUploadCronjob.startCronJob();
    // const result = await googleDriveUtil.listFiles(
    //   '186GSZ1s1N58oWVZL5thsuFKQoGDW_22l'
    // );
    //125CHiLQxw6N_s4Ky7cqMLbFPQPc_QDL5
    // console.log(result, 'resiulttttt');
    // emailUtil.sendEmailOrSmsByEvent(
    //   'successful_payment',
    //   '66b104dacab3400ef1bd74a7',
    //   '',
    //   '66a637f0f48199294373421a'
    // );
    // console.log(emailUtil.getValuesFromHtml(''));
    // paymentCronjob.processPayments();
    paymentCronjob.startCronJob();
    // paymentCronjob.testCron();
    // paymentCronjob.testDebtor();
    // paymentCronjob.testPaynote();
  }
}

const app = new App();
app.start();
