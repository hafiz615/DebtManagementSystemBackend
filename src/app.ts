import express, {Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Database} from './config/database.config';
import setup from './api/routes/base.route';
import paymentCronjob from './cron-job/payment.cronjob';
import session from 'express-session';

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
    this.app.use(
      session({
        secret: 'ED2CEF5365D68FC9996BF86E2335D', // Replace with a strong secret key
        resave: false,
        saveUninitialized: true,
        cookie: {secure: true}, // Set to true if using HTTPS
      })
    );
    setup(this.app);
  }

  public start(): void {
    const appPort = process.env.PORT || 3000;
    this.app.listen(appPort, () => {
      console.log(`Server running at http://localhost:${appPort}/`);
    });
    // paymentCronjob.processPayments();
    paymentCronjob.startCronJob();
    // paymentCronjob.testCron();
  }
}

const app = new App();
app.start();
