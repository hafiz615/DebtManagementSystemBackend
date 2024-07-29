"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const settings_repository_1 = require("../api/repository/setting/settings.repository");
const settings_repomodel_1 = require("../database/repomodels/settings.repomodel");
let dbconfig = 'mongodb+srv://mohsin123:1732544m@cluster0.fyxwu.mongodb.net/debt-settlement?retryWrites=true&w=majority';
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
            .then(async (res) => {
            console.log('connection established at ', this.dbUri);
            const settingsRepository = new settings_repository_1.SettingsRepository();
            const findSettings = await settingsRepository.getAllWithoutPagination();
            if (!findSettings.length) {
                const settings = new settings_repomodel_1.Settings();
                await settingsRepository.create(settings);
            }
        })
            .catch(err => {
            console.log(err);
            process.exit(1);
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=database.config.js.map