import mongoose from 'mongoose';

let dbconfig =
  'mongodb+srv://mohsin123:1732544m@cluster0.fyxwu.mongodb.net/debt-settlement?retryWrites=true&w=majority';

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
