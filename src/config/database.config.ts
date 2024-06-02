import mongoose from 'mongoose';

let dbconfig =
  'mongodb://165.227.188.235:27018/debt-settlement?authSource=admin';

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
      .then(res => {
        console.log('connection established at ', this.dbUri);
      })
      .catch(err => {
        console.log(err);
        process.exit(1);
      });
  }
}
