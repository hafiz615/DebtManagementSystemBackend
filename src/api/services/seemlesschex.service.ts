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
dotenv.config();
class SeemlesschexService {
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
  }

  async createCheck(req: Request) {
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
    let totalAmount = amount + commission;
    const response = await seemlesschexUtil.createCheck(
      debtor,
      totalAmount,
      tokenResponse.tokenization.token,
      decryptedData
    );
    if (response?.error) return [false, response.message];
    const bv = await seemlesschexUtil.checkBasicVerification(response);
    const fc = await seemlesschexUtil.checkFundsVerification(response);
    let authorized = 'Success';
    if (fc?.error || bv?.error) authorized = 'Failed';
    await seemlesschexUtil.saveCheckInfo(bv, fc, response, req.body.debtorId);
    let updatedPayment = await this.paymentRepository.updateMany<IPayment>(
      {_id: transactionIds},
      {
        authorized: authorized,
        captured: 'Pending',
        status: 'Pending',
        debtorTransId: response.check.check_id,
        transactionType: transactionType,
        manualCommission: commission,
        dueDate: transactionDate,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    if (updatedPayment.modifiedCount) {
      await this.debtorRepository.updateById<IDebtor>(req.body.debtorId, {
        $inc: {commissionPaid: req.body.commission},
      });
    }
    return [true, response.check];
  }

  async createPaymentLink(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(
      req.body.debtorId
    );
    if (!debtor) return [false, constants.notFoundMessage('debtor on DMS')];
    const response = await seemlesschexUtil.createPaymentLink(req.body.amount);
    if (response?.error) return [false, response.message];
    return [true, response.checkout_link];
  }

  async updateCheck(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const {data, checkId} = req.body;

    const foundCheck = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: checkId,
    });
    if (foundCheck)
      return [false, constants.alreadyExistsMessage('Reference id')];

    const decryptedData = commonUtil.getDecryptedData(data);
    const tokenResponse = await seemlesschexUtil.tokenization(decryptedData);
    if (tokenResponse?.error) return [false, tokenResponse.message];

    const response = await seemlesschexUtil.updateCheck(
      debtor,
      tokenResponse.tokenization.token,
      checkId
    );
    if (response?.error) return [false, response.message];
    const bv = await seemlesschexUtil.checkBasicVerification(response);
    const fc = await seemlesschexUtil.checkFundsVerification(response);
    console.log(fc, 'fcccc');
    console.log(bv, 'bvvvvv');
    let authorized = 'Success';
    if (bv?.erorr || fc?.error) authorized = 'Failed';
    await seemlesschexUtil.saveCheckInfo(bv, fc, response, req.params.id);
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
    const {checkId, transactionIds} = req.body;

    const foundCheck = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: checkId,
    });
    if (foundCheck)
      return [false, constants.alreadyExistsMessage('Reference id')];

    const response = await seemlesschexUtil.voidCheck(checkId);
    if (response?.error) return [false, response.message];

    await seemlesschexUtil.deleteCheckInfo(checkId);
    let updatedPayment = await this.paymentRepository.updateMany<IPayment>(
      {_id: transactionIds},
      {
        authorized: 'Pending',
        captured: 'Pending',
        status: 'Upcoming',
        debtorTransId: '',
        transactionType: '',
        manualCommission: 0,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    if (updatedPayment.modifiedCount) {
      await this.debtorRepository.updateById<IDebtor>(req.params.id, {
        $inc: {commissionPaid: -req.body.commission},
      });
    }
    return [true, response.check];
  }

  async getClientChecks(req: Request) {
    let debtor = await this.debtorRepository.getById(req.params.id);
    if (!debtor) {
      return [false, constants.notFoundMessage('Debtor')];
    }
    let payments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          transactionType: 'Check',
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
}

export default SeemlesschexService;
