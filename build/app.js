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
const express_session_1 = __importDefault(require("express-session"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.config();
        this.database = new database_config_1.Database();
    }
    config() {
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        this.app.use((0, express_session_1.default)({
            secret: 'ED2CEF5365D68FC9996BF86E2335D', // Replace with a strong secret key
            resave: false,
            saveUninitialized: true,
            cookie: { secure: true }, // Set to true if using HTTPS
        }));
        (0, base_route_1.default)(this.app);
    }
    start() {
        const appPort = process.env.PORT || 3000;
        this.app.listen(appPort, () => {
            console.log(`Server running at http://localhost:${appPort}/`);
        });
        // paymentCronjob.processPayments();
        payment_cronjob_1.default.startCronJob();
        // paymentCronjob.testCron();
    }
}
const app = new App();
app.start();
//# sourceMappingURL=app.js.map