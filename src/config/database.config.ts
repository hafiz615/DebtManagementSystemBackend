import mongoose from 'mongoose';

let dbconfig = 'mongodb://localhost:27017/debt-settlement';

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
