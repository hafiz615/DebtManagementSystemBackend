import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import UploadUtil from '../../utils/upload.util';
import emailUtil from '../../utils/email.util';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';

class EmailService {
  private caseRepository: CaseRepository;
  constructor() {
    this.caseRepository = new CaseRepository();
  }
  async sendSmsEmailDebtorCreditor(req: Request) {
    const reqTemp: any = req;
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) {
      return [false, constantsUtil.notFoundMessage('case')];
    }
    const type = String(req.query.type);
    if (type !== 'email' && type !== 'sms') {
      return [false, 'Type is missing!'];
    }
    return await emailUtil.sendEmailSmsToDebtorCreditor(
      caseTemp._id,
      reqTemp.id,
      req.body,
      type
    );
  }
}

export default EmailService;
