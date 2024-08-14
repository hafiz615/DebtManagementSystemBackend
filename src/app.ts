import express, {Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Database} from './config/database.config';
import setup from './api/routes/base.route';
import paymentCronjob from './cron-job/payment.cronjob';
import logMiddleware from './middleware/logs.middleware'; // Import the logging middleware
import asyncLocalStorage from './utils/localStorage.util';
class App {
  protected app: Application;
  protected database: Database;

  constructor() {
    this.app = express();
    this.config();
    this.database = new Database();
  }

  private config(): void {
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

  public start(): void {
    const appPort = process.env.PORT || 3000;
    this.app.listen(appPort, () => {
      console.log(`Server running at http://localhost:${appPort}/`);
    });
    // paymentCronjob.processPayments();
    // paymentCronjob.startCronJob();
    // paymentCronjob.testCron();
    // paymentCronjob.testDebtor();
    // paymentCronjob.testPaynote();
  }
}

const app = new App();
app.start();
