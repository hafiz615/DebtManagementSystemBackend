"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
class PausePayment {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    getDateDaysAgo(days) {
        return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
    async pauseDebtorPaymentAmount() {
        const thirtyDaysAgo = this.getDateDaysAgo(30);
        const result = await this.debtorRepository.updateMany({
            paymentAmountCount: 1,
            lastPaymentAmountDate: { $lt: thirtyDaysAgo },
        }, {
            paymentAmountCount: 0,
            lastPaymentAmountDate: null,
        });
    }
    async pauseDebtorPaymentDay() {
        const fourteenDaysAgo = this.getDateDaysAgo(14);
        const result = await this.debtorRepository.updateMany({
            paymentPauseCount: 2,
            lastPaymentPauseDate: { $lt: fourteenDaysAgo },
        }, {
            paymentPauseCount: 0,
            lastPaymentPauseDate: null,
        });
    }
    startCronJob() {
        node_cron_1.default.schedule('0 4 * * *', async () => {
            console.log('[PausePayment] Running debtor pause task at 4 AM (America/New_York)');
            await this.pauseDebtorPaymentAmount();
            await this.pauseDebtorPaymentDay();
        }, {
            timezone: 'America/New_York',
        });
        console.log('[PausePayment] Cron job scheduled: daily at 4 AM (America/New_York)');
    }
}
exports.default = new PausePayment();
//# sourceMappingURL=pausePayment.cronjob.js.map