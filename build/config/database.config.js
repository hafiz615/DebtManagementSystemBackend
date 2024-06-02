"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let dbconfig = 'mongodb://165.227.188.235:27018/debt-settlement?authSource=admin';
class Database {
    constructor() {
        this.dbUri = dbconfig;
        this.connectDb();
    }
    connectDb() {
        const options = {
            retryWrites: true,
            autoIndex: true, // build indexes true or false
        };
        mongoose_1.default
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
exports.Database = Database;
//# sourceMappingURL=database.config.js.map