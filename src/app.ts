import express, {Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Database} from './config/database.config';
import setup from './api/routes/base.route';
import paymentCronjob from './cron-job/payment.cronjob';
import logMiddleware from './middleware/logs.middleware'; // Import the logging middleware
import asyncLocalStorage from './utils/localStorage.util';
import {EnvSetup} from './utils/setEnv';
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
import debtorUtil from './utils/debtor.util';
import commonUtil from './utils/common.util';
import {PaymentRepository} from './api/repository/payment/payment.repository';
import {IPayment} from './database/interfaces/payment.interface';
import {Server, Socket} from 'socket.io';
import {createServer} from 'http';
import dotenv from 'dotenv';
dotenv.config();

class App {
  protected app: Application;
  protected database: Database;
  protected io: any;
  public socketInstance: any;
  protected httpServer: any;
  // protected socket: any;
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: `*`,
      },
    });
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

    this.io.on('connection', (socket: Socket) => {
      console.log('a user connected');
      this.socketInstance = socket;
    });

    this.httpServer.listen(appPort, () => {
      console.log(`Server running at http://localhost:${appPort}/`);
    });
    if (
      process.env.environment === 'prod' &&
      process.env.runPaynoteScript === 'true'
    )
      await paynoteUtil.syncUsersPaynote();
    bulkUploadCronjob.startCronJob();
    // paymentCronjob.processPayments();
    // paymentCronjob.processCommissionPayments();
    // paymentCronjob.startCronJob();
    // paymentCronjob.testCron();
    // paymentCronjob.testDebtor();
    // paymentCronjob.testPaynote();
  }
}

const app = new App();
app.start();

export default app;
