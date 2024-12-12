import {Request} from 'express';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import constantsUtil from '../../utils/constants.util';
import dotenv from 'dotenv';
import {InboxRepository} from '../repository/inbox/inbox.repository';
import {IInbox} from '../../database/interfaces/inbox.interface';
import inboxUtils from '../../utils/inbox.utils';
dotenv.config();

class InboxService {
  protected inboxRepository: InboxRepository;
  protected userRepository: UserRepository;

  constructor() {
    this.inboxRepository = new InboxRepository();
    this.userRepository = new UserRepository();
  }

  async getAllInboxes(req: Request) {
    const filters = await inboxUtils.getAllInboxFilters(req);
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
    const formattedData = inboxUtils.formatInboxData(inbox);
    // const totalCount = await this.inboxRepository.getCount<IInbox>(filters);

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
}

export default InboxService;
