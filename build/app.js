"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const database_config_1 = require("./config/database.config");
const base_route_1 = __importDefault(require("./api/routes/base.route"));
const payment_cronjob_1 = __importDefault(require("./cron-job/payment.cronjob"));
const logs_middleware_1 = __importDefault(require("./middleware/logs.middleware")); // Import the logging middleware
const localStorage_util_1 = __importDefault(require("./utils/localStorage.util"));
const setEnv_1 = require("./database/repomodels/setEnv");
const bulkUpload_cronjob_1 = __importDefault(require("./cron-job/bulkUpload.cronjob"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.config();
        this.database = new database_config_1.Database();
    }
    config() {
        setEnv_1.EnvSetup.setEnvVariables();
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        this.app.use(logs_middleware_1.default); // Use the logging middleware
        this.app.use((req, res, next) => {
            const traceId = 'X-DMS' + Date.now().toString().substring(4);
            localStorage_util_1.default.run(new Map(), () => {
                const store = localStorage_util_1.default.getStore();
                if (store) {
                    store.set('traceId', traceId);
                }
                res.header('TraceId', traceId);
                next();
            });
        });
        (0, base_route_1.default)(this.app);
    }
    async start() {
        const appPort = process.env.PORT || 3000;
        this.app.listen(appPort, () => {
            console.log(`Server running at http://localhost:${appPort}/`);
        });
        // const credR = new CreditorRepository();
        // const allCred = await credR.getAllWithoutPagination<ICreditor>();
        // for (const creditor of allCred) {
        //   // if (creditor?.paynoteUserId) continue;
        //   if (!creditor.basicInformation?.fullName) continue;
        //   const result = await paynoteUtil.createCustomer(creditor);
        //   console.log(result);
        //   if (result?.success)
        //     await credR.updateById(creditor._id, {
        //       paynoteUserId: result.user.user_id,
        //     });
        //   // await credR.updateById(creditor._id, {
        //   //   paynoteUserId: 'd3e73330-6f93-11ef-b474-4b26e6be0816',
        //   //   paynoteSourceId: 'fea18ac6-aa50-40cd-82ba-fe99789ba466',
        //   // });
        // }
        // await bulkUploadCronjob.testBulkCron();
        // const debtorRepo = new DebtorRepository();
        // const getAll = await debtorRepo.getAllWithoutPagination<IDebtor>();
        // for (const debtor of getAll) {
        //   await debtorRepo.updateById(debtor._id, {
        //     emailKey: `[${nanoid(10).toUpperCase().replace(/[_-]/g, '')}]`,
        //   });
        // }
        // const token = await moneyThumbUtil.authenticateUser();
        // const app = await moneyThumbUtil.createNewApp(
        //   token,
        //   '66f1221440020aa3522ec604'
        // );
        // await moneyThumbUtil.convertPdf(
        //   token,
        //   '66f1221440020aa3522ec604',
        //   app['appid']
        // );
        // const card = await moneyThumbUtil.getScoreCard(token, app['appid']);
        // moneyThumbUtil.saveData(app['appid'], card, '66ae508b14a585538d6921a3');
        // const strat = new StrategyRepository();
        // const caseRepo = new CaseRepository();
        // const all = await strat.getAllWithoutPagination<IStrategy>({
        //   name: 'strategy_one',
        // });
        // for (const strategy of all) {
        //   const caseTemp = await caseRepo.getById<ICase>(strategy.caseId);
        //   if (strategy?.data?.settlementRange) {
        //     const sett = strategy.data.settlementRange;
        //     const str1 = sett.true_profit * 0.67;
        //     const str2 = sett.profitability * 0.67;
        //     await debtorRepo.updateById<IDebtor>(String(caseTemp.debtor), {
        //       strategy1MaxProfit: Math.round(str1 * 100) / 100,
        //       strategy3MaxProfit: Math.round(str2 * 100) / 100,
        //     });
        //   }
        // }
        bulkUpload_cronjob_1.default.startCronJob();
        // paymentCronjob.processPayments();
        payment_cronjob_1.default.startCronJob();
        // paymentCronjob.testCron();
        // paymentCronjob.testDebtor();
        // paymentCronjob.testPaynote();
    }
}
const app = new App();
app.start();
//# sourceMappingURL=app.js.map