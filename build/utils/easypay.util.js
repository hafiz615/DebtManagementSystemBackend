"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const axiosInstanceInterceptor_1 = __importDefault(require("./axiosInstanceInterceptor"));
const dotenv_1 = __importDefault(require("dotenv"));
const check_repository_1 = require("../api/repository/check/check.repository");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const common_util_1 = __importDefault(require("./common.util"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const xml2js_1 = require("xml2js");
dotenv_1.default.config();
class EasypayUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.checkRepository = new check_repository_1.CheckRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
    }
    async syncClients(platform) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyQuery(platform);
        const url = urlSecurityKey.url;
        const params = {
            report_type: 'customer_vault',
            security_key: urlSecurityKey.securityKey,
        };
        console.log(url, 'urlllllll');
        const response = await axiosInstanceInterceptor_1.default.get(url, { params });
        const json = await this.convertXmlToJson(response.data);
        if (json.nm_response?.customer_vault?.customer &&
            json.nm_response?.customer_vault?.customer.length) {
            const customers = json.nm_response.customer_vault.customer;
            console.log(customers.length, 'customers.length');
            const allDebtors = await this.debtorRepository.getAllWithoutPagination();
            const debtorEmails = allDebtors
                .filter(debtor => debtor.basicInformation.email) // Filter creditors with an email
                .map(debtor => debtor.basicInformation.email.toLowerCase());
            console.log(debtorEmails, 'klklklk');
            await this.processAllUsersResults(customers, debtorEmails, platform);
        }
    }
    async convertXmlToJson(xmlData) {
        try {
            return await (0, xml2js_1.parseStringPromise)(xmlData, { explicitArray: false });
        }
        catch (error) {
            console.error('Error parsing XML:', error);
        }
    }
    async processAllUsersResults(users, debtorEmails, platform) {
        for (const user of users) {
            const email = user.email.toLowerCase();
            let paymentType = '';
            if (debtorEmails.includes(email)) {
                if (user.cc_number)
                    paymentType = 'cc';
                if (user.check_account)
                    paymentType = 'ck';
                console.log(email, 'user.email');
                console.log(paymentType, 'paymentType');
                console.log(user.customer_vault_id, 'user.customer_vault_id');
                console.log(platform, 'platform');
                await this.debtorRepository.updateByOne({ 'basicInformation.email': email }, {
                    $push: {
                        accounts: {
                            $each: [
                                {
                                    paymentType: paymentType,
                                    customerVaultId: user.customer_vault_id,
                                    platform: platform,
                                },
                            ],
                        },
                    },
                    updatedAt: common_util_1.default.getCurrentDate(),
                });
            }
        }
    }
}
exports.default = new EasypayUtil();
//# sourceMappingURL=easypay.util.js.map