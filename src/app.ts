import express, {Application} from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {Database} from './config/database.config';
import setup from './api/routes/base.route';

class App {
  protected app: Application;
  protected database: Database;

  constructor() {
    this.app = express();
    this.config();
    this.database = new Database();
  }

  private config(): void {
    const corsOptions = {
      origin: 'https://debt-management-system-front-end.vercel.app', // Allow only your frontend domain
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    };
    this.app.use(cors(corsOptions));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: false}));
    setup(this.app);
  }

  public start(): void {
    const appPort = process.env.PORT || 3000;
    this.app.listen(appPort, () => {
      console.log(`Server running at http://localhost:${appPort}/`);
    });
  }
}

const app = new App();
app.start();
