import {Request} from 'express';
import {ICase, IInterval} from '../../database/interfaces/case.interface';
import {IPayment} from '../../database/interfaces/payment.interface';
import constants from '../../utils/constants.util';
import {CaseRepository} from '../repository/case/case.repository';
import {PaymentRepository} from '../repository/payment/payment.repository';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import dotenv from 'dotenv';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import seemlesschexUtil from '../../utils/seemlesschex.util';
import commonUtil from '../../utils/common.util';
import {encrypt} from 'n-krypta';
import {CheckRepository} from '../repository/check/check.repository';
import {ICheck} from '../../database/interfaces/check.interface';
import debtorUtil from '../../utils/debtor.util';
import paymentUtil from '../../utils/payment.util';
dotenv.config();
class SeemlesschexService {
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;
  private checkRepository: CheckRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
    this.checkRepository = new CheckRepository();
  }

  async createCheck(req: Request) {
    // const type = String(req.query.type);
    // if (type !== 'client' && type !== 'creditor') {
    //   return [false, constants.notFoundMessage('query type is invalid')];
    // }
    const debtor = await this.debtorRepository.getById<IDebtor>(
      req.body.debtorId
    );
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const {
      amount,
      referenceId,
      transactionType,
      commission,
      transactionIds,
      data,
      transactionDate,
    } = req.body;
    const decryptedData = commonUtil.getDecryptedData(data);
    const tokenResponse = await seemlesschexUtil.tokenization(decryptedData);
    if (tokenResponse?.error) return [false, tokenResponse.message];
    const response = await seemlesschexUtil.createCheck(
      debtor,
      amount,
      tokenResponse.tokenization.token,
      decryptedData
    );
    if (response?.error) return [false, response.message];
    const bv = await seemlesschexUtil.checkBasicVerification(response);
    // const fc = await seemlesschexUtil.checkFundsVerification(response);
    let authorized = 'Success';
    // if (fc?.error || bv?.error) authorized = 'Failed'
    if (bv?.error) authorized = 'Failed';
    await seemlesschexUtil.saveCheckInfo(bv, null, response, req.body.debtorId);
    // const additionalIds = [];
    // if (type === 'client') {
    //   for (const transactionId of transactionIds) {
    //     const payment =
    //       await this.paymentRepository.getById<IPayment>(transactionId);
    //     const otherPayments: IPayment[] =
    //       await paymentUtil.getOtherPayments(payment);
    //     otherPayments.forEach(payment => {
    //       additionalIds.push(String(payment._id));
    //     });
    //   }
    // }
    // const mergedIds = transactionIds.concat(additionalIds);

    await this.paymentRepository.updateMany<IPayment>(
      {_id: transactionIds},
      {
        authorized: authorized,
        debtorTransId: response.check.check_id,
        paymentMode: transactionType,
        manualAmount: amount,
        dueDate: transactionDate,
        paymentGateway: 'Seamlesschex',
        transactionType: 'ACH',
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    return [true, response.check];
  }

  async createPaymentLink(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(
      req.body.debtorId
    );
    if (!debtor) return [false, constants.notFoundMessage('debtor on DMS')];
    const response = await debtorUtil.createPaymentLinkOrNot(
      req.body.debtorId,
      req.body.amount,
      debtor?.basicInformation?.fullName
    );
    if (!response[0]) return response;
    return response;
  }

  async updateCheck(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const {data, checkId} = req.body;

    const foundCheck = await this.checkRepository.getOne<ICheck>({
      checkId: checkId,
      isDeleted: false,
    });
    if (!foundCheck) return [false, constants.notFoundMessage('check')];
    const decryptedData = commonUtil.getDecryptedData(data);
    const tokenResponse = await seemlesschexUtil.tokenization(decryptedData);
    if (tokenResponse?.error) return [false, tokenResponse.message];

    const response = await seemlesschexUtil.updateCheck(
      debtor,
      tokenResponse.tokenization.token,
      checkId,
      decryptedData
    );
    if (response?.error) return [false, response.message];
    const bv = await seemlesschexUtil.checkBasicVerification(response);
    // const fc = await seemlesschexUtil.checkFundsVerification(response);
    let authorized = 'Success';
    // if (bv?.error || fc?.error) authorized = 'Failed';
    if (bv?.error) authorized = 'Failed';
    await seemlesschexUtil.updateCheckInfo(bv, null, response, checkId);
    await this.paymentRepository.updateMany<IPayment>(
      {debtorTransId: checkId},
      {
        authorized: authorized,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    return [true, response.check];
  }

  async voidCheck(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const {checkId} = req.body;

    const foundCheck = await this.checkRepository.getOne<ICheck>({
      checkId: checkId,
      isDeleted: false,
    });
    if (!foundCheck) return [false, constants.notFoundMessage('check')];

    const response = await seemlesschexUtil.voidCheck(checkId);
    if (response?.error) return [false, response.message];

    await seemlesschexUtil.deleteCheckInfo(checkId, 'void');
    await this.paymentRepository.updateMany<IPayment>(
      {debtorTransId: checkId},
      {
        authorized: 'Pending',
        captured: 'Pending',
        status: 'Upcoming',
        debtorTransId: '',
        paymentMode: '',
        manualCommission: 0,
        paymentGateway: '',
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    return [true, []];
  }

  async getClientChecks(req: Request) {
    let debtor = await this.debtorRepository.getById(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    let payments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          paymentMode: 'Check',
          debtorId: req.params.id,
        },
        undefined,
        undefined,
        {_id: -1}
      );

    if (!payments.length) {
      return [false, constants.notFoundMessage('payments')];
    }

    const groupedByTransId = payments.reduce((acc, item) => {
      if (!acc[item.debtorTransId]) {
        acc[item.debtorTransId] = [];
      }
      acc[item.debtorTransId].push(item);
      return acc;
    }, {});
    for (const [key, value] of Object.entries(groupedByTransId)) {
      const checkInfo = await seemlesschexUtil.getCheckInfo(key);
      groupedByTransId[key] = {payments: value, checkInfo};
    }
    return [true, groupedByTransId];
  }

  async statusChanged(req: Request) {
    const response = req.body;
    console.log(response, 'response');
    return seemlesschexUtil.checkStatusWebhook(response);
  }
}

export default SeemlesschexService;
