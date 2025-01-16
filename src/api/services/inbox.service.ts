import {Request} from 'express';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import constantsUtil from '../../utils/constants.util';
import dotenv from 'dotenv';
import {InboxRepository} from '../repository/inbox/inbox.repository';
import {IInbox} from '../../database/interfaces/inbox.interface';
import inboxUtils from '../../utils/inbox.utils';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
dotenv.config();

class InboxService {
  protected inboxRepository: InboxRepository;
  protected userRepository: UserRepository;
  protected caseRepository: CaseRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.inboxRepository = new InboxRepository();
    this.userRepository = new UserRepository();
  }

  async getAllInboxes(req: Request) {
    const reqTemp: any = req;
    const type = req.query.type;
    const filters = Object.keys(await inboxUtils.getAllInboxFilters(req)).length
      ? await inboxUtils.getAllInboxFilters(req)
      : {userId: reqTemp.id};
    filters['isDeleted'] = {$ne: true};
    let inbox = await this.inboxRepository.getAllWithoutPagination<IInbox>(
      filters,
      undefined,
      undefined,
      {createdAt: -1},
      undefined,
      undefined
      // Number(req.query.page),
      // Number(req.query.limit)
    );

    const formattedData = inboxUtils.formatInboxData(inbox, reqTemp.name, type);
    if (!inbox.length) {
      return [false, constantsUtil.notFoundMessage('Inbox')];
    }
    return [true, formattedData];
    // return [true, {inbox, totalCount}];
  }

  async markAsRead(id: string): Promise<[boolean, IInbox | string]> {
    const inboxMessage = await this.inboxRepository.getById<IInbox>(id);
    if (!inboxMessage) return [false, constants.notFoundMessage('email')];
    const inboxTemp = await this.inboxRepository.updateById<IInbox>(id, {
      isRead: true,
    });

    if (!inboxTemp) {
      return [false, constants.failureUpdateMessage('email')];
    }

    return [true, inboxTemp];
  }

  async createEmailDraft(req: Request) {
    const reqTemp: any = req;
    let caseData = null;
    if (req.body.caseId) {
      caseData = await this.caseRepository.getById<ICase>(
        req.body.caseId,
        undefined,
        undefined,
        [
          {path: 'debtor', select: ['businessInformation.companyName']},
          {path: 'creditor', select: ['businessInformation.companyName']},
        ]
      );

      console.log('case data', caseData);
      if (!caseData) {
        return [false, constantsUtil.notFoundMessage('Case')];
      }
    }
    const validateDraft = await inboxUtils.createDraft(
      req.body,
      caseData,
      reqTemp.id,
      reqTemp?.files?.files || []
    );
    const result = await this.inboxRepository.create<IInbox>(validateDraft);
    if (!result) {
      return [false, constantsUtil.failureAddMessage('draft')];
    }
    return [true, result];
  }

  deleteDraftEmail = async (req: Request) => {
    let draftTemp: any = await this.inboxRepository.getById<IInbox>(
      req.params.id
    );

    if (!draftTemp) {
      return [false, constantsUtil.notFoundMessage('Draft')];
    }

    const updateDraft = await this.inboxRepository.updateById<IInbox>(
      req.params.id,
      {isDeleted: true}
    );

    if (!updateDraft || !updateDraft.isDeleted) {
      return [false, constantsUtil.failureDeleteMessage('Draft')];
    }

    return [true, constantsUtil.successDeleteMessage('Draft')];
  };
}

export default InboxService;
