import {Request} from 'express';
import {twiml} from 'twilio';
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
    console.log('body', req.body);
    const {From, Body, SmsStatus, To} = req.body;
    let caseData = null;
    const number = await commonUtil.cleanPhoneNumber(From);
    const name = await callUtil.getDebtorOrCreditorName(number);
    if (name.creditorId) {
      caseData = await this.caseRepository.getOne<ICase>(
        {
          creditor: name?.creditorId,
          isDeleted: {$ne: true},
        },
        undefined,
        undefined,
        [
          {path: 'debtor', select: ['businessInformation.companyName']},
          {path: 'creditor', select: ['businessInformation.companyName']},
        ]
      );
    }
    let findUser = await this.userRepository.getOne<IUser>({
      twilioNo: To,
      isDeleted: false,
    });
    const smsData = {
      from: From,
      to: To,
      text: Body,
      textAsHtml: Body,
    };

    await emailUtil.createNewInbox(
      smsData,
      caseData,
      SmsStatus,
      v4(),
      findUser ? findUser._id.toString() : '',
      findUser ? findUser.name : '',
      null,
      null,
      'SMS'
    );
    if (caseData) {
      const time = new Date(commonUtil.getCurrentDate());
      await caseUtil.addInHistory(
        {
          From: From,
          To: To,
          Content: Body,
          Time: time,
          Action: 'SMS',
        },
        caseData._id
      );
    }
    return [true, twiml.toString()];
  };
}

export default SmsService;
