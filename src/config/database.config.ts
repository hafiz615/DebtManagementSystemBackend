import mongoose from 'mongoose';
import {SettingsRepository} from '../api/repository/setting/settings.repository';
import {Settings} from '../database/repomodels/settings.repomodel';
import {ISettings} from '../database/interfaces/settings.interface';

let dbconfig =
  'mongodb+srv://mohsin123:1732544m@cluster0.fyxwu.mongodb.net/debt-settlement-staging?retryWrites=true&w=majority';

export class Database {
  protected dbUri: string;

  constructor() {
    this.dbUri = dbconfig!;
    this.connectDb();
  }
  private connectDb(): void {
    const options = {
      retryWrites: true,
      autoIndex: true, // build indexes true or false
    };
    mongoose
      .connect(this.dbUri, options)
      .then(async res => {
        console.log('connection established at ', this.dbUri);
        const settingsRepository = new SettingsRepository();
        const findSettings =
          await settingsRepository.getAllWithoutPagination<ISettings>();
        if (!findSettings.length) {
          const settings = new Settings();
          await settingsRepository.create<ISettings>(settings as any);
        }
      })
      .catch(err => {
        console.log(err);
        process.exit(1);
      });
  }
}
