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
const debtor_repository_1 = require("./api/repository/debtor/debtor.repository");
const moneyThumb_util_1 = __importDefault(require("./utils/moneyThumb.util"));
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
        const debtorRepo = new debtor_repository_1.DebtorRepository();
        // const getAll = await debtorRepo.getAllWithoutPagination<IDebtor>();
        // for (const debtor of getAll) {
        //   await debtorRepo.updateById(debtor._id, {
        //     emailKey: `[${nanoid(10).toUpperCase().replace(/[_-]/g, '')}]`,
        //   });
        // }
        const token = await moneyThumb_util_1.default.authenticateUser();
        const app = await moneyThumb_util_1.default.createNewApp(token, 'Smoke Studio & Mart LLC');
        // await moneyThumbUtil.convertPdf(
        //   token,
        //   '66f1221440020aa3522ec604',
        //   app['appid']
        // );
        const debtor = await debtorRepo.getById('67179c6b9f1cc6c8f4839b84');
        const card = await moneyThumb_util_1.default.getScoreCard(token, app['appid']);
        await moneyThumb_util_1.default.saveData(app['appid'], card, debtor);
        // console.log(
        //   await debtorUtil.getYearlyResults(card['accountslist']['data'])
        // );
        // console.log(await debtorUtil.getYearlyProfitMargin(card));
        // const kk = await debtorUtil.getPaidAmountOfCreditors(
        //   '66f1221440020aa3522ec604'
        // );
        // console.log(kk, 'ookoko');
        // moneyThumbUtil.saveData(app['appid'], card, '66ae508b14a585538d6921a3');
        // const debtors = await debtorRepo.getAllWithoutPagination<IDebtor>();
        // for (let i = 23; i < debtors.length; i++) {
        //   await moneyThumbUtil.run(String(debtors[i]._id));
        // }
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
        // const caseRepo = new CaseRepository();
        // const cases = await caseRepo.getAllWithoutPagination<ICase>();
        // for (const temp of cases) {
        //   console.log('ok');
        //   await caseRepo.updateById(temp._id, {
        //     remainingAmountPaid: temp.remaining,
        //   });
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