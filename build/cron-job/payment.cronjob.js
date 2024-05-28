"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
console.log('i am here');
class CronJob {
    startCronJob() {
        node_cron_1.default.schedule('* * * * *', () => {
            console.log('Running a task every minute');
        });
    }
}
exports.default = new CronJob();
//# sourceMappingURL=payment.cronjob.js.map