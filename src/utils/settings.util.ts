import {compare} from 'bcryptjs';
import {UserRepository} from '../api/repository/user/user.repository';
import {IUser} from '../database/interfaces/user.interface';
import commonUtil from './common.util';
import constantsUtil from './constants.util';
import {
  ICustomField,
  ITargetCustomFields,
} from '../database/interfaces/customField.interface';
import {TargetCFRepository} from '../api/repository/targetCustomFields/targetCF.repository';
import {ISettings} from '../database/interfaces/settings.interface';
import {SettingsRepository} from '../api/repository/setting/settings.repository';

class SettingsUtil {
  private targetCFRepository: TargetCFRepository;
  private settingsRepository: SettingsRepository;

  constructor() {
    this.targetCFRepository = new TargetCFRepository();
    this.settingsRepository = new SettingsRepository();
  }
  async addCustomFieldByTarget(
    customField: ICustomField,
    body: any,
    target: string,
    caseId: string
  ): Promise<[boolean, ITargetCustomFields | string]> {
    const {name, value} = body;
    let targetCF = null;

    customField.type =
      customField.type === 'text' ? 'string' : customField.type;
    let valueType: any = typeof value;
    if (valueType === 'string') {
      const date = new Date(value);
      valueType = !isNaN(date.getTime()) ? 'date' : valueType;
    }
    if (valueType !== customField.type) {
      return [false, 'Custom field and value type mismatched'];
    }
    switch (target) {
      case 'case':
        const temp = await this.targetCFRepository.getOne<ITargetCustomFields>({
          target: target,
          caseId: caseId,
        });
        if (!temp) {
          targetCF = await this.targetCFRepository.create<ITargetCustomFields>({
            target: target,
            customFields: [body],
            caseId: caseId,
            createdAt: commonUtil.getCurrentDate(),
            updatedAt: commonUtil.getCurrentDate(),
          } as any);
        } else {
          targetCF =
            await this.targetCFRepository.updateByOne<ITargetCustomFields>(
              {target: target, caseId: caseId},
              {
                $addToSet: {customFields: body},
                updatedAt: commonUtil.getCurrentDate(),
              }
            );
        }
        break;
    }
    return [true, targetCF];
  }

  async mergeSettings(settings: ISettings, body: any) {
    const paymentsAuthorizations = [
      'failedAuthorizations',
      'successfulAuthorizations',
      'failedPayments',
      'successPayments',
      'upcomingPayments',
      'retryInterval',
      'authorizationInterval',
    ];
    const notificationTemplates = ['email', 'sms'];
    if (body.paymentsAuthorizations) {
      paymentsAuthorizations.forEach(key => {
        if (!body.paymentsAuthorizations.hasOwnProperty(key)) {
          body.paymentsAuthorizations[key] =
            settings.paymentsAuthorizations[key];
        }
      });
    }
    if (body.notificationTemplates) {
      notificationTemplates.forEach(key => {
        if (!body.notificationTemplates.hasOwnProperty(key)) {
          body.notificationTemplates[key] = settings.notificationTemplates[key];
        }
      });
    }
    return body;
  }
  async getEmailSmsTemplates() {
    const findSettings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const templates = await findSettings[0].notificationTemplates;
    const emailTemplates = templates.filter(template => {
      return template.type === 'email';
    });
    const smsTemplates = templates.filter(template => {
      return template.type === 'sms';
    });
    return {emailTemplates, smsTemplates};
  }
}
export default new SettingsUtil();
