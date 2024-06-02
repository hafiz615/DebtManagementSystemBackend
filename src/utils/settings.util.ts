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

class SettingsUtil {
  private targetCFRepository: TargetCFRepository;

  constructor() {
    this.targetCFRepository = new TargetCFRepository();
  }
  async addCustomFieldByTarget(
    customField: ICustomField,
    body: any,
    target: string
  ): Promise<[boolean, ICustomField | string]> {
    const {name, value} = body;
    let targetCF = null;

    customField.type =
      customField.type === 'Text' ? 'string' : customField.type;
    let valueType: any = typeof value;
    if (valueType === 'string') {
      const date = new Date(value);
      valueType = !isNaN(date.getTime()) ? 'Date' : valueType;
    }
    if (valueType !== customField.type) {
      return [false, 'Custom field and value type mismatched'];
    }
    switch (target) {
      case 'case':
        const temp = await this.targetCFRepository.getOne<ITargetCustomFields>({
          target: target,
        });
        if (!temp) {
          targetCF = await this.targetCFRepository.create<ITargetCustomFields>({
            target: target,
            customFields: [body],
            createdAt: commonUtil.getCurrentDate(),
            updatedAt: commonUtil.getCurrentDate(),
          } as any);
        } else {
          targetCF =
            await this.targetCFRepository.updateByOne<ITargetCustomFields>(
              {target: target},
              {
                $addToSet: {customFields: body},
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
    const notificationTemplates = ['sms', 'email'];
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
}
export default new SettingsUtil();
