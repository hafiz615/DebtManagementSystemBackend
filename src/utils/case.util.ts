import {parse} from 'path';
import {ContactRepository} from '../api/repository/contact/contact.repository';
import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IContact} from '../database/interfaces/contact.interface';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {Contact} from '../database/repomodels/contact.repomodel';
import {Creditor} from '../database/repomodels/creditor.repomodel';
import {Debtor} from '../database/repomodels/debtor.repomodel';
import {DataCopier} from './dataCopier.util';
import {PaymentRepository} from '../api/repository/payment/payment.repository';
import {ICase} from '../database/interfaces/case.interface';
import {Payment} from '../database/repomodels/payment.repomodel';
import {IPayment} from '../database/interfaces/payment.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import DebtorService from '../api/services/debtor.service';
import CreditorService from '../api/services/creditor.service';
import {Case} from '../database/repomodels/case.repomodel';
import constantsUtil from './constants.util';

class CaseUtil {
  private contactRepository: ContactRepository;
  private debtRepository: DebtorRepository;
  private creditorRepository: CreditorRepository;
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private debtorService: DebtorService;
  private creditorService: CreditorService;

  constructor() {
    this.contactRepository = new ContactRepository();
    this.debtRepository = new DebtorRepository();
    this.creditorRepository = new CreditorRepository();
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
  }
  async createContacts(data: IContact[]) {
    const validatedContacts: IContact[] = [];
    for (const contact of data) {
      const newContact = new Contact();
      const validatedContact = DataCopier.copy(newContact, contact);
      validatedContacts.push(validatedContact);
    }
    const contacts =
      await this.contactRepository.createMany<IContact>(validatedContacts);

    return contacts.map(contact => {
      return contact._id;
    });
  }

  async createDebtor(data: IDebtor) {
    const newDebtor = new Debtor();
    const validatedDebtor = DataCopier.copy(newDebtor, data);
    return await this.debtRepository.create<IDebtor>(validatedDebtor);
  }

  async createCreditor(data: ICreditor) {
    const newCreditor = new Creditor();
    const validatedCreditor = DataCopier.copy(newCreditor, data);
    return await this.creditorRepository.create<ICreditor>(validatedCreditor);
  }

  async uploadFileFormat(originalFile: string) {
    const parsesdPath = parse(originalFile);
    const fileName = parsesdPath.name;
    const extension = parsesdPath.ext.toLowerCase();
    return `${fileName}-${Date.now()}${extension}`;
  }

  async createPayment(data: ICase) {
    const payment = new Payment();
    const paymentsArray = [];
    let tempPayment = null;
    for (const interval of data.intervals) {
      if (interval.frequency === 0) {
        payment.dueDate = interval.startDate;
        tempPayment = await this.populatePayment(
          data._id,
          payment,
          interval,
          0
        );
        paymentsArray.push(tempPayment);
      }
      if (interval.frequency != 0) {
        for (let i = 1; i <= interval.frequency; i++) {
          if (i === 1) {
            payment.dueDate = interval.startDate;
          } else {
            payment.dueDate = await this.getDatePayment(
              interval.startDate,
              interval.timePeriod,
              i
            );
          }
          tempPayment = await this.populatePayment(
            data._id,
            payment,
            interval,
            i
          );
          paymentsArray.push(tempPayment);
        }
      }
    }
    await this.paymentRepository.createMany<IPayment>(paymentsArray);
  }

  async getDatePayment(
    date: string,
    timePeriod: string,
    number: number
  ): Promise<string> {
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

  async populatePayment(
    caseId: string,
    payment: Payment,
    interval: any,
    frequency: number
  ) {
    payment.amount = interval.amount;
    payment.frequency = frequency;
    payment.caseId = caseId;
    payment.intervalId = String(interval._id);
    return {...payment};
  }

  async getCaseCode() {
    const cases = await this.caseRepository.getAll<ICase>({}, {}, undefined);
    if (!cases.length) return 'CASE-001';
    let caseCode = cases[cases.length - 1].caseCode;
    return (
      'CASE-' +
      (parseInt(caseCode.split('-')[1]) + 1).toString().padStart(3, '0')
    );
  }

  async getAllCreditorsOfDebtor(debtor: IDebtor) {
    const cases = await this.caseRepository.getAll<ICase>(
      {debtor: debtor._id},
      'totalDebt caseCode status',
      undefined,
      undefined,
      {path: 'creditor', select: ['basicInformation.fullName']}
    );

    const tempCases: any = cases;
    return tempCases.map(obj => ({
      totalDebt: obj.totalDebt,
      caseCode: obj.caseCode,
      status: obj.status,
      name: obj.creditor.basicInformation.fullName,
    }));
  }

  async createCase(body: any, role: string, email: string) {
    let contactIds = null;
    let debtor: IDebtor = null;
    let creditor: ICreditor = null;
    const getDebtor = await this.debtRepository.getOne<IDebtor>({
      $or: [
        {
          'basicInformation.email':
            body.debtor.basicInformation.email.toLowerCase(),
        },
        {
          'basicInformation.SSID': body.debtor.basicInformation.SSID,
        },
        {
          'basicInformation.phone': body.debtor.basicInformation.phone,
        },
      ],
    });
    const getCreditor = await this.creditorRepository.getOne<ICreditor>({
      $or: [
        {
          'basicInformation.email':
            body.creditor.basicInformation.email.toLowerCase(),
        },
        {
          'basicInformation.phone': body.creditor.basicInformation.phone,
        },
      ],
    });
    if (!getDebtor) {
      contactIds = await this.createContacts(
        body.debtor.contacts as IContact[]
      );
      const debtorData = {
        ...body.debtor,
        contacts: contactIds,
      };
      debtor = await this.createDebtor(debtorData as IDebtor);
    }
    if (!getCreditor) {
      contactIds = await this.createContacts(
        body.creditor.contacts as IContact[]
      );
      const creditorData = {
        ...body.creditor,
        contacts: contactIds,
      };
      creditor = await this.createCreditor(creditorData as ICreditor);
    }
    if (getDebtor) debtor = getDebtor as IDebtor;
    if (getCreditor) creditor = getCreditor as ICreditor;
    body.debtor = debtor?._id;
    body.creditor = creditor?._id;
    const newCase = new Case();
    newCase.caseOwner = role;
    newCase.createdBy = email;
    newCase.caseCode = await this.getCaseCode();
    const validatedCase = DataCopier.copy(newCase, body);
    const caseCreated = await this.caseRepository.create<ICase>(validatedCase);
    await this.createPayment(caseCreated);
    return caseCreated;
  }

  async checkCasePayment(body: any): Promise<[boolean, string]> {
    if (body.remaining !== body.totalDebt - body.paidAmount) {
      return [false, constantsUtil.Messages.PAYMENT_CALCULATION_ERROR];
    }
    let amount = 0;
    for (const interval of body.intervals) {
      if (!interval.frequency) {
        amount += interval.amount;
      }
      if (interval.frequency != 0) {
        for (let i = 0; i < interval.frequency; i++) {
          amount += interval.amount;
        }
      }
    }
    if (amount !== body.remaining) {
      return [false, constantsUtil.Messages.PAYMENT_CALCULATION_ERROR];
    }
    return [true, ''];
  }

  async getClientsList(cases: any) {
    const seenDebtor = new Set();
    const result = [];
    const mappingIndex = {};
    const mappingCreditors = {};
    let seenCreditor = new Set();
    let index = 0;
    for (const tempCase of cases) {
      let debtorId = String(tempCase.debtor._id);
      let creditorId = String(tempCase.creditor);
      if (seenDebtor.has(debtorId)) {
        let index = mappingIndex[debtorId];
        let creditorSet = mappingCreditors[debtorId];
        let resultObj = result[index];
        if (!creditorSet.has(creditorId)) {
          resultObj.creditors += 1;
          creditorSet.add(creditorId);
          mappingCreditors[debtorId] = creditorSet;
        }
        result[index] = {
          cases: resultObj.cases + 1,
          creditors: resultObj.creditors,
          name: resultObj.name,
          status: resultObj.status,
          totalDebt: resultObj.totalDebt + tempCase.totalDebt,
          id: resultObj.id,
        };
      } else {
        seenDebtor.add(debtorId);
        seenCreditor.add(creditorId);
        result.push({
          cases: 1,
          creditors: 1,
          name: tempCase.debtor.basicInformation.fullName,
          status: tempCase.debtor.basicInformation.status,
          totalDebt: tempCase.totalDebt,
          id: debtorId,
        });
        mappingIndex[debtorId] = index;
        index += 1;
        mappingCreditors[debtorId] = seenCreditor;
        seenCreditor = new Set();
      }
    }
    return result;
  }
}
export default new CaseUtil();
