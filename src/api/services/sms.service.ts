import {Request} from 'express';
import callUtil from '../../utils/call.util';
import emailUtil from '../../utils/email.util';
import commonUtil from '../../utils/common.util';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import {UserRepository} from '../repository/user/user.repository';
import {IUser} from '../../database/interfaces/user.interface';
import {v4} from 'uuid';
import caseUtil from '../../utils/case.util';
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse';
class SmsService {
  private caseRepository: CaseRepository;
  private userRepository: UserRepository;
  constructor() {
    this.caseRepository = new CaseRepository();
    this.userRepository = new UserRepository();
  }

  receivedSmsFallback = async (req: Request) => {
    console.log('Fallback triggered:', req.body);
    const twiml = new MessagingResponse();
    twiml.message(
      'We are experiencing issues. Please try again later or contact support.'
    );

    return [true, twiml.toString()];
  };

  receivedMessage = async (req: Request) => {
    const {From, Body, SmsStatus, To} = req.body;

    const number = await commonUtil.cleanPhoneNumber(From);
    const name = await callUtil.getDebtorOrCreditorName(number);

    let caseData = name?.creditorId
      ? await this.caseRepository.getOne<ICase>(
          {creditor: name.creditorId, isDeleted: {$ne: true}},
          undefined,
          undefined,
          [
            {path: 'debtor', select: ['businessInformation.companyName']},
            {path: 'creditor', select: ['businessInformation.companyName']},
          ]
        )
      : null;

    if (!caseData && name?.debtorId) {
      const findCases =
        await this.caseRepository.getAllWithoutPagination<ICase>(
          {debtor: name.debtorId, isDeleted: {$ne: true}},
          undefined,
          undefined,
          undefined,
          [
            {path: 'creditor', select: ['businessInformation.companyName']},
            {path: 'debtor', select: ['businessInformation.companyName']},
          ]
        );
      caseData = findCases.length === 1 ? findCases[0] : null;
    }
    const findUser = await this.userRepository.getOne<IUser>({
      twilioNo: To,
      isDeleted: false,
    });

    const smsData = {
      from: From,
      to: To,
      text: Body,
      textAsHtml: Body,
    };

    const hello = await emailUtil.createNewInbox(
      smsData,
      caseData,
      SmsStatus,
      v4(),
      findUser?._id?.toString() || '',
      findUser?.name || '',
      null,
      null,
      'SMS'
    );

    if (caseData) {
      await caseUtil.addInHistory(
        {
          From,
          To,
          Content: Body,
          Time: new Date(commonUtil.getCurrentDate()),
          Action: 'SMS',
        },
        caseData._id.toString()
      );
    }

    const twiml = new MessagingResponse();
    twiml.message('Message received successfully');

    return [true, twiml.toString()];
  };
}

export default SmsService;
