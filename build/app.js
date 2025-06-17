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
const setEnv_1 = require("./utils/setEnv");
const bulkUpload_cronjob_1 = __importDefault(require("./cron-job/bulkUpload.cronjob"));
const pausePayment_cronjob_1 = __importDefault(require("./cron-job/pausePayment.cronjob"));
const paynote_util_1 = __importDefault(require("./utils/paynote.util"));
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class App {
    // protected socket: any;
    constructor() {
        this.app = (0, express_1.default)();
        this.httpServer = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: `*`,
            },
        });
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
        this.io.on('connection', (socket) => {
            console.log('a user connected');
            this.socketInstance = socket;
        });
        this.httpServer.listen(appPort, () => {
            console.log(`Server running at http://localhost:${appPort}/`);
        });
        // const debtorRepo = new DebtorRepository();
        // const token = await moneyThumbUtil.authenticateUser();
        // const app = await moneyThumbUtil.createNewApp(
        //   token,
        //   'Smoke Studio & Mart LLC'
        // );
        // const debtor = await debtorRepo.getById<IDebtor>(
        //   '67179c6b9f1cc6c8f4839b84'
        // );
        // const card = await moneyThumbUtil.getScoreCard(token, app.appid);
        // await moneyThumbUtil.getProfitMarginPerMonth(debtor, card);
        // const caseRepo = new CaseRepository();
        // await caseRepo.updateMany({'intervals.amount': {$gte: 0}}, {intervals: []});
        // const debtorRepos = new DebtorRepository();
        // const thirtyDaysAgo = new Date();
        // thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        // const debtorData = await debtorRepos.updateMany<IDebtor>(
        //   {
        //     paymentAmountCount: 1,
        //     lastPaymentAmountDate: {$lt: thirtyDaysAgo},
        //   },
        //   {
        //     paymentAmountCount: 0,
        //     lastPaymentAmountDate: null,
        //   }
        // );
        // console.log('show', debtorData);
        if (process.env.environment === 'prod' &&
            process.env.runPaynoteScript === 'true')
            await paynote_util_1.default.syncUsersPaynote();
        bulkUpload_cronjob_1.default.startCronJob();
        // await easypayUtil.syncClients('Easypay direct');
        // paymentCronjob.processPayments();
        // paymentCronjob.processCommissionPayments();
        if (process.env.environment === 'prod') {
            payment_cronjob_1.default.startCronJob();
            pausePayment_cronjob_1.default.startCronJob();
        }
        // paymentCronjob.cronSeamlesschex();
        // paymentCronjob.testCron();
        // paymentCronjob.testDebtor();
        // paymentCronjob.testPaynote();
    }
}
const app = new App();
app.start();
exports.default = app;
//# sourceMappingURL=app.js.map