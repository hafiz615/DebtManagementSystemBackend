import {ServiceFeeRepository} from '../api/repository/serviceFee/serviceFee.repository';

import dotenv from 'dotenv';
import UploadUtil from './upload.util';

import commonUtil from './common.util';
import {StrategyRepository} from '../api/repository/strategy/strategy.repository';
import {IFee} from '../database/interfaces/serviceFee.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import {ICase} from '../database/interfaces/case.interface';
dotenv.config();
class ServiceFeeUtil {
  private serviceFeeRepository: ServiceFeeRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.serviceFeeRepository = new ServiceFeeRepository();
    this.caseRepository = new CaseRepository();
  }

  async getServiceFeeAmount(caseId: any) {
    const caseData: any = await this.caseRepository.getById<ICase>(
      caseId,
      undefined,
      undefined,
      ['debtor']
    );

    if (caseData.debtor?.serviceFee) {
      return caseData.debtor?.serviceFee;
    }

    const serviceFee = await this.serviceFeeRepository.getOne<IFee>({
      type: 'serviceFee',
    });

    return serviceFee?.fee ?? 0;
  }

  async getFee() {
    const result =
      await this.serviceFeeRepository.getAllWithoutPagination<IFee>({});

    let feeObj = {};
    for (const fee of result) {
      feeObj[fee.type] = fee.fee;
    }

    return Object.keys(feeObj).length ? [true, feeObj] : [true, null];
  }
}

export default new ServiceFeeUtil();
