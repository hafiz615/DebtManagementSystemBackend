"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const contact_repository_1 = require("../api/repository/contact/contact.repository");
const creditor_repository_1 = require("../api/repository/creditor/creditor.repository");
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const contact_repomodel_1 = require("../database/repomodels/contact.repomodel");
const creditor_repomodel_1 = require("../database/repomodels/creditor.repomodel");
const debtor_repomodel_1 = require("../database/repomodels/debtor.repomodel");
const dataCopier_util_1 = require("./dataCopier.util");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const payment_repomodel_1 = require("../database/repomodels/payment.repomodel");
class CaseUtil {
    constructor() {
        this.contactRepository = new contact_repository_1.ContactRepository();
        this.debtRepository = new debtor_repository_1.DebtorRepository();
        this.creditorRepository = new creditor_repository_1.CreditorRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
    }
    async createContacts(data) {
        const validatedContacts = [];
        for (const contact of data) {
            const newContact = new contact_repomodel_1.Contact();
            const validatedContact = dataCopier_util_1.DataCopier.copy(newContact, contact);
            validatedContacts.push(validatedContact);
        }
        const contacts = await this.contactRepository.createMany(validatedContacts);
        return contacts.map(contact => {
            return contact._id;
        });
    }
    async createDebtor(data) {
        const newDebtor = new debtor_repomodel_1.Debtor();
        const validatedDebtor = dataCopier_util_1.DataCopier.copy(newDebtor, data);
        return await this.debtRepository.create(validatedDebtor);
    }
    async createCreditor(data) {
        const newCreditor = new creditor_repomodel_1.Creditor();
        const validatedCreditor = dataCopier_util_1.DataCopier.copy(newCreditor, data);
        return await this.creditorRepository.create(validatedCreditor);
    }
    async uploadFileFormat(originalFile) {
        const parsesdPath = (0, path_1.parse)(originalFile);
        const fileName = parsesdPath.name;
        const extension = parsesdPath.ext.toLowerCase();
        return `${fileName}-${Date.now()}${extension}`;
    }
    async createPayment(data) {
        const payment = new payment_repomodel_1.Payment();
        for (const interval of data.intervals) {
            if (interval.frequency === 0 && interval.status === 'Pending') {
                payment.dueDate = interval.startDate;
                await this.populatePayment(data._id, payment, interval);
            }
            if (interval.frequency != 0 && interval.status === 'Pending') {
                payment.dueDate = payment.dueDate
                    ? payment.dueDate
                    : await this.getDatePayment(interval.startDate, interval.timePeriod, payment.frequency);
                await this.populatePayment(data._id, payment, interval);
            }
        }
        await this.paymentRepository.create(payment);
    }
    async getDatePayment(date, timePeriod, number) {
        const currentDate = new Date(date);
        switch (timePeriod.toLowerCase()) {
            case 'weekly':
                currentDate.setDate(currentDate.getDate() + number * 7);
                break;
            case 'monthly':
                currentDate.setMonth(currentDate.getMonth() + number);
                break;
            case 'fortnightly':
                currentDate.setDate(currentDate.getDate() + number * 14);
                break;
            default:
                throw new Error('Invalid time period');
        }
        return currentDate.toString();
    }
    async populatePayment(caseId, payment, interval) {
        payment.amount = interval.amount;
        payment.frequency = interval.frequencyProgress + 1;
        payment.caseId = caseId;
        payment.intervalId = String(interval._id);
    }
}
exports.default = new CaseUtil();
//# sourceMappingURL=case.util.js.map