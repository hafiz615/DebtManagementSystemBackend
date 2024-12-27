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
dotenv.config();
class SeemlesschexService {
  private paymentRepository: PaymentRepository;
  private debtorRepository: DebtorRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.debtorRepository = new DebtorRepository();
  }

  async createCheck(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const {amount, token, store} = req.body;
    const response = await seemlesschexUtil.createCheck(
      debtor,
      amount,
      token,
      store
    );
    if (!response?.error) return [false, response.message];
    const bv = await seemlesschexUtil.checkBasicVerification(response);
    const fc = await seemlesschexUtil.checkFundsVerification(response);
    let updatedPayment = await this.paymentRepository.updateMany<IPayment>(
      {_id: req.body.transactionIds},
      {
        authorized: 'Success',
        captured: 'Pending',
        status: 'Pending',
        debtorTransId: req.body.referenceId,
        transactionType: req.body.transactionType,
        manualCommission: req.body.commission,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    if (updatedPayment) {
      await this.debtorRepository.updateById<IDebtor>(req.params.id, {
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
}

export default SeemlesschexService;
