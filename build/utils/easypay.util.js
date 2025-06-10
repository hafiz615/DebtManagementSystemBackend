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
const syncPaymentMethod_repository_1 = require("../api/repository/ISyncPaymentMethod/syncPaymentMethod.repository");
const debtor_util_1 = __importDefault(require("./debtor.util"));
dotenv_1.default.config();
class EasypayUtil {
    constructor() {
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.checkRepository = new check_repository_1.CheckRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.syncPaymentMethodRepository = new syncPaymentMethod_repository_1.SyncPaymentMethodRepository();
    }
    async getEasyPayCustomers(platform) {
        const urlSecurityKey = await common_util_1.default.getUrlAndSecurityKeyQuery(platform);
        const url = urlSecurityKey.url;
        const params = {
            report_type: 'customer_vault',
            security_key: urlSecurityKey.securityKey,
        };
        console.log(url, 'urlllllll');
        const response = await axiosInstanceInterceptor_1.default.get(url, { params });
        const json = await this.convertXmlToJson(response.data);
        if (!json.nm_response?.customer_vault?.customer &&
            !json.nm_response?.customer_vault?.customer.length)
            return [false, 'Unable To Find Data'];
        const customers = json.nm_response.customer_vault.customer;
        console.log(customers.length, 'customers.length');
        // console.log(debtor, 'klklklk');
        return customers;
    }
    async convertXmlToJson(xmlData) {
        return await (0, xml2js_1.parseStringPromise)(xmlData, { explicitArray: false });
    }
    async checkClientExist(users, debtorEmail, platform, id, existingDebtor) {
        let update = { easyPayUserId: '' };
        const easyPayEmails = users.map(user => {
            return user.email.toLowerCase();
        });
        // const index = easyPayEmails.indexOf(debtorEmail);
        // if (index === -1) return [false, `Could Not Found the User in ${platform}`];
        const indices = easyPayEmails.reduce((acc, email, index) => {
            if (email === debtorEmail) {
                acc.push(index);
            }
            return acc;
        }, []);
        if (indices.length === 0) {
            return [false, `Could not find the user in ${platform}`];
        }
        const userIds = [];
        for (const index of indices) {
            const email = users[index].email.toLowerCase();
            let paymentType = '';
            if (users[index].cc_number)
                paymentType = 'cc';
            if (users[index].check_account)
                paymentType = 'ck';
            const accounts = await debtor_util_1.default.getDebtorAccounts(String(existingDebtor._id));
            const customerVaultExists = accounts?.some(account => account.vault === users[index].customer_vault_id);
            if (customerVaultExists) {
                userIds.push(users[index].customer_vault_id);
                continue;
            }
            // await this.debtorRepository.updateById<IDebtor>(_id, {
            //   $push: {
            //     accounts: {
            //       $each: [
            //         {
            //           paymentType: paymentType,
            //           customerVaultId: users[index].customer_vault_id,
            //           platform: platform,
            //         },
            //       ],
            //     },
            //   },
            //   updatedAt: commonUtil.getCurrentDate(),
            // });
            await debtor_util_1.default.createAccount(id, paymentType, platform, users[index].customer_vault_id);
            userIds.push(users[index].customer_vault_id);
        }
        update['userIds'] = userIds;
        return [true, update];
    }
    async upsertDebtorEasyPayEmail(debtorId, email, platform, customerVaultIds) {
        for (const customerVaultId of customerVaultIds) {
            await this.syncPaymentMethodRepository.upsert({ syncId: debtorId, platform: platform }, {
                email: email,
                updatedAt: common_util_1.default.getCurrentDate(),
            });
        }
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