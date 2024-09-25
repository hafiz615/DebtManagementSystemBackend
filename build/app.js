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
        await bulkUpload_cronjob_1.default.testBulkCron();
        // const result = await googleDriveUtil.listFiles(
        //   '186GSZ1s1N58oWVZL5thsuFKQoGDW_22l'
        // );
        //125CHiLQxw6N_s4Ky7cqMLbFPQPc_QDL5
        // console.log(result, 'resiulttttt');
        // emailUtil.sendEmailOrSmsByEvent(
        //   'successful_payment',
        //   '66b104dacab3400ef1bd74a7',
        //   '',
        //   '66a637f0f48199294373421a'
        // );
        // console.log(emailUtil.getValuesFromHtml(''));
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