import {Request} from 'express';
import {UserRepository} from '../repository/user/user.repository';
import constants from '../../utils/constants.util';
import constantsUtil from '../../utils/constants.util';
import dotenv from 'dotenv';
import {InboxRepository} from '../repository/inbox/inbox.repository';
import {IInbox} from '../../database/interfaces/inbox.interface';
import {TasksRepository} from '../repository/tasks/tasks.repository';
import {ITasks} from '../../database/interfaces/tasks.interface';
import inboxUtils from '../../utils/inbox.utils';
import {CaseRepository} from '../repository/case/case.repository';
import {ICase} from '../../database/interfaces/case.interface';
import commonUtil from '../../utils/common.util';
import emailUtil from '../../utils/email.util';
import {v4} from 'uuid';
import {IUser} from '../../database/interfaces/user.interface';
dotenv.config();

class InboxService {
  protected inboxRepository: InboxRepository;
  protected userRepository: UserRepository;
  protected caseRepository: CaseRepository;
  protected taskRepository: TasksRepository;

  constructor() {
    this.caseRepository = new CaseRepository();
    this.inboxRepository = new InboxRepository();
    this.userRepository = new UserRepository();
    this.taskRepository = new TasksRepository();
  }

  async getAllInboxes(req: Request) {
    const reqTemp: any = req;
    const {all, medium, type} = req.query;
    let filters: any = {isDeleted: {$ne: true}};
    filters['medium'] = medium;

    let inbox = {};
    if (all === 'all') {
      inbox = await this.inboxRepository.getAllWithoutPagination<IInbox>(
        filters,
        undefined,
        undefined,
        {createdAt: -1},
        {path: 'previousMessages'}
      );
    } else if (all === 'completed') {
      filters = {
        ...filters,
        isCompleted: true,
      };
      inbox = await this.inboxRepository.getAllWithoutPagination<IInbox>(
        filters,
        undefined,
        undefined,
        {createdAt: -1},
        {path: 'previousMessages'}
      );
    } else {
      const inboxFilters = await inboxUtils.getAllInboxFilters(req);
      filters = {
        ...filters,
        ...(Object.keys(inboxFilters).length
          ? inboxFilters
          : {userId: reqTemp.id}),
        isCompleted: {$ne: true},
      };

      inbox = await this.inboxRepository.getAllWithoutPagination<IInbox>(
        filters,
        undefined,
        undefined,
        {createdAt: -1},
        {path: 'previousMessages'}
      );
    }
    console.log('length', Object.keys(inbox).length);
    const formattedData = inboxUtils.formatInboxData(inbox, reqTemp.name, type);
    if (!formattedData) {
      return [false, constantsUtil.notFoundMessage('Inbox')];
    }
    return [true, formattedData];
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
      if (!caseData) {
        return [false, constantsUtil.notFoundMessage('Case')];
      }
    }
    const validateDraft = await inboxUtils.prepareCreateDraft(
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

  updateDraft = async (req: Request) => {
    const reqTemp: any = req;

    const draftTemp = await this.inboxRepository.getById<IInbox>(req.params.id);
    if (!draftTemp) {
      return [false, constantsUtil.notFoundMessage('Draft')];
    }

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

      if (!caseData) {
        return [false, constantsUtil.notFoundMessage('Case')];
      }
    }

    const updatedDraftData = await inboxUtils.prepareUpdateDraft(
      draftTemp,
      req.body,
      caseData,
      reqTemp.id,
      reqTemp?.files?.files || []
    );

    const updatedDraft = await this.inboxRepository.updateById<IInbox>(
      req.params.id,
      {...updatedDraftData, updatedAt: commonUtil.getCurrentDate()}
    );

    if (!updatedDraft) {
      return [false, constantsUtil.failureUpdateMessage('Draft')];
    }

    return [true, updatedDraft];
  };

  async createDraft(req: Request) {
    const reqTemp: any = req;
    const threadId = v4();
    let caseData = null;
    let {from, sendTo, content} = req.body;
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
      if (!caseData) {
        return [false, constantsUtil.notFoundMessage('Case')];
      }
    }

    const smsData = {
      from: from,
      to: sendTo,
      text: content,
      textAsHtml: content,
    };

    emailUtil.createNewInbox(
      smsData,
      caseData,
      'draft',
      threadId,
      reqTemp.id,
      reqTemp.name,
      null,
      null,
      'SMS'
    );

    return [true, `Draft created successfully`];
  }

  updateDraftSms = async (req: Request) => {
    const reqTemp: any = req;

    const {sendTo, from, content} = req.body;

    const draftId = req.params.id;

    // Find the draft first
    const existingDraft = await this.inboxRepository.getOne<IInbox>({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!existingDraft) {
      return [false, constantsUtil.notFoundMessage('Draft')];
    }

    // Update the draft
    const updatedDraft = await this.inboxRepository.updateById<IInbox>(
      req.params.id,
      {
        to: sendTo,
        from: from,
        text: content,
        textAsHtml: content,
        updatedAt: commonUtil.getCurrentDate(),
      }
    );
    return [true, updatedDraft];
  };

  inboxStatus = async (req: Request) => {
    const filter =
      req?.query?.task === 'true'
        ? {Repository: TasksRepository}
        : {Repository: InboxRepository};
    let undo = req?.query?.undo;
    let status = undo === 'true' ? false : true;

    const repositoryInstance = new filter.Repository();

    const existingInbox = await repositoryInstance.getOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!existingInbox) {
      return [false, constantsUtil.notFoundMessage('')];
    }

    const updatedInbox = await repositoryInstance.updateById(req.params.id, {
      isCompleted: status,
      updatedAt: commonUtil.getCurrentDate(),
    });
    return [true, updatedInbox];
  };

  async getSms(req: Request) {
    const reqTemp: any = req;

    let user = null;
    const filters: any = await inboxUtils.getAllInboxFilters(req);
    filters['isDeleted'] = {$ne: true};
    filters['medium'] = 'SMS';
    const medium = req.query.medium;
    medium === 'SMS'
      ? (filters['type'] = {$ne: 'draft'})
      : (filters['type'] = 'draft');
    if (req.query.all === 'false') {
      user = await this.userRepository.getById<IUser>(
        req.body?.userId || reqTemp.id
      );
      if (!user) return [false, constants.notFoundMessage('user')];
      const cleanNumber = await commonUtil.cleanPhoneNumber(user.twilioNo);
      filters['$or'] = [{from: cleanNumber}, {to: cleanNumber}];
    }
    let result = null;
    result =
      await this.inboxRepository.getAllWithoutPagination<IInbox>(filters);
    if (medium === 'SMS') {
      result = result.reduce((result: any, item: IInbox) => {
        if (item.caseCode) {
          if (!result[item.caseCode]) {
            result[item.caseCode] = [];
          }
          result[item.caseCode].push(item);
        }
        return result;
      }, {});
    }
    return [true, {allSms: result, userName: user ? user.name : ''}];
  }
}

export default InboxService;
