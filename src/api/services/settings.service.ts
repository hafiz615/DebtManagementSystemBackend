import constants from '../../utils/constants.util';
import {SettingsRepository} from '../repository/setting/settings.repository';
import {Request} from 'express';
import {ISettings} from '../../database/interfaces/settings.interface';
import {Settings} from '../../database/repomodels/settings.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';
import {CustomFieldsRepository} from '../repository/customFields/customField.repository';
import {
  ICustomField,
  ITargetCustomFields,
} from '../../database/interfaces/customField.interface';
import {CustomFiled} from '../../database/repomodels/customField.repomodel';
import {TargetCFRepository} from '../repository/targetCustomFields/targetCF.repository';
import commonUtil from '../../utils/common.util';
import settingsUtil from '../../utils/settings.util';
import {values} from 'lodash';
import {NotificationConfigurationRepository} from '../repository/notificationConfiguration/notificationConfiguration.repository';
import {INotificationConfiguration} from '../../database/interfaces/notificationConfiguration.interface';
import {NotificationConfiguration} from '../../database/repomodels/notificationConfiguration.repomodel';

class SettingsService {
  private settingsRepository: SettingsRepository;
  private customFieldsRepository: CustomFieldsRepository;
  private targetCFRepository: TargetCFRepository;
  private notificationConfigurationRepository: NotificationConfigurationRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.customFieldsRepository = new CustomFieldsRepository();
    this.targetCFRepository = new TargetCFRepository();
    this.notificationConfigurationRepository =
      new NotificationConfigurationRepository();
  }

  async addSettings(
    req: Request,
    keyword: string
  ): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    if (!findSettings?.length) {
      const newSettings = new Settings();

      if (req.body?.notificationTemplates?.length) {
        req.body.notificationTemplates[0].templateId = 'Template-001';
      }
      // if (req.body?.notificationTemplates?.sms?.length) {
      //   req.body.notificationTemplates.sms[0].templateId = 'Template-001';
      // }
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      if (
        req.body?.notificationTemplates?.length >
        findSettings[0]?.notificationTemplates?.length
      ) {
        let num = req.body.notificationTemplates.length;
        req.body.notificationTemplates[num - 1].templateId =
          'Template-' + num.toString().padStart(3, '0');
      }
      // if (
      //   req.body?.notificationTemplates?.sms?.length >
      //   findSettings[0].notificationTemplates.sms.length
      // ) {
      //   let num = req.body.notificationTemplates.sms.length;
      //   req.body.notificationTemplates.sms[num - 1].templateId =
      //     'Template-' + num.toString().padStart(3, '0');
      // }
      if (keyword === 'editPaymentsNotificationSettings') {
        const paymentsNoti = await commonUtil.checkPermission(keyword, req);
        const authInterval = await commonUtil.checkPermission(keyword, req);
        const retryInterval = await commonUtil.checkPermission(keyword, req);
        if (!paymentsNoti && req.body.paymentsAuthorizations) {
          delete req.body.paymentsAuthorizations.failedAuthorizations;
          delete req.body.paymentsAuthorizations.successfulAuthorizations;
          delete req.body.paymentsAuthorizations.failedPayments;
          delete req.body.paymentsAuthorizations.successPayments;
          delete req.body.paymentsAuthorizations.upcomingPayments;
        }
        if (!retryInterval && req.body.paymentsAuthorizations) {
          delete req.body.paymentsAuthorizations.retryInterval;
        }
        if (!authInterval && req.body.paymentsAuthorizations) {
          delete req.body.paymentsAuthorizations.authorizationInterval;
        }
      }
      const mergedSettings = await settingsUtil.mergeSettings(
        findSettings[0],
        req.body
      );
      settigns = await this.settingsRepository.updateById(
        findSettings[0].id,
        mergedSettings
      );
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }

  async getSettings(
    templatePermission: boolean,
    paymentsPermission: boolean,
    customFieldsPermission: boolean
  ): Promise<[boolean, {} | string]> {
    const findSettings =
      await this.settingsRepository.getAllWithoutPagination<ISettings>();
    const customFields =
      await this.customFieldsRepository.getAllWithoutPagination<ICustomField>();
    if (!findSettings.length) {
      return [
        true,
        {
          paymentsAuthorizations: null,
          notificationTemplates: null,
          customFields: customFields.length ? customFields : null,
        },
      ];
    }
    return [
      true,
      {
        paymentsAuthorizations: paymentsPermission
          ? findSettings[0].paymentsAuthorizations
          : null,
        notificationTemplates: templatePermission
          ? findSettings[0].notificationTemplates
          : null,
        customFields: customFieldsPermission ? customFields : null,
      },
    ];
  }

  async addCustomField(
    req: Request
  ): Promise<[boolean, ICustomField | string]> {
    const newCustomField = new CustomFiled();
    const validatedCustomField = DataCopier.copy(newCustomField, req.body);
    let customField =
      await this.customFieldsRepository.create<ICustomField>(
        validatedCustomField
      );
    if (!customField) {
      return [false, constants.failureAddMessage('Custom field')];
    }
    return [true, customField];
  }

  async editCustomField(
    req: Request
  ): Promise<[boolean, ICustomField | string]> {
    let customField =
      await this.customFieldsRepository.updateById<ICustomField>(
        req.params.id,
        req.body
      );
    if (!customField) {
      return [false, constants.failureUpdateMessage('Custom field')];
    }
    return [true, customField];
  }

  async getCustomFieldsByTarget(
    req: Request
  ): Promise<[boolean, ICustomField[] | string]> {
    if (!req.query.target) return [false, 'Target is missing'];
    const target = String(req.query.target);
    const customFields =
      await this.customFieldsRepository.getAllWithoutPagination<ICustomField>({
        $or: [{target: target}, {shared: true}],
      });
    if (!customFields.length) {
      return [false, constants.notFoundMessage('Custom fields')];
    }
    return [true, customFields];
  }

  async addCustomFieldByTarget(
    req: Request
  ): Promise<[boolean, ITargetCustomFields | string]> {
    const {name, value} = req.body;
    if (!req.query.target) {
      return [false, 'Target is missing'];
    }
    if (!req.query.caseId) {
      return [false, 'Case id is missing'];
    }
    const target = String(req.query.target);
    const customField = await this.customFieldsRepository.getOne<ICustomField>({
      $and: [{target: target}, {name: name}],
    });
    if (!customField) {
      return [false, constants.notFoundMessage('custom field')];
    }
    return await settingsUtil.addCustomFieldByTarget(
      customField,
      req.body,
      target,
      String(req.query.caseId)
    );
  }

  async updateCustomFieldByTarget(
    req: Request
  ): Promise<[boolean, ITargetCustomFields | string]> {
    if (!req.query.target) return [false, 'Target is missing'];
    if (!req.query.caseId) {
      return [false, 'Case id is missing'];
    }
    const target = String(req.query.target);
    const updatedCustomFields = req.body.customFields;

    if (!updatedCustomFields || !updatedCustomFields.length)
      return [false, 'CustomFields missing!'];
    // Update the target custom field with the new custom fields array
    const targetCF =
      await this.targetCFRepository.updateByOne<ITargetCustomFields>(
        {target: target, caseId: String(req.query.caseId)},
        {$set: {customFields: updatedCustomFields}}
      );

    if (!targetCF) {
      return [false, constants.failureUpdateMessage('custom fields')];
    }

    return [true, targetCF];
  }

  async removeCustomFieldByTarget(
    req: Request
  ): Promise<[boolean, ITargetCustomFields | string]> {
    if (!req.query.target) {
      return [false, 'Target is missing'];
    }
    if (!req.query.caseId) {
      return [false, 'Case id is missing'];
    }
    let targetCF =
      await this.targetCFRepository.updateByOne<ITargetCustomFields>(
        {target: String(req.query.target), caseId: String(req.query.caseId)},
        {
          $pull: {customFields: req.body},
        }
      );
    console.log(targetCF);
    if (!targetCF) {
      return [false, constants.notFoundMessage('custom field')];
    }
    return [true, targetCF];
  }

  async deleteCustomField(req: Request): Promise<[boolean, boolean | string]> {
    let customField = await this.customFieldsRepository.delete<ICustomField>({
      _id: req.params.id,
    });
    if (!customField) {
      return [false, constants.failureDeleteMessage('custom field')];
    }
    return [true, customField];
  }

  async editNotificationTemplate(
    req: Request
  ): Promise<[boolean, ISettings | string]> {
    // if (
    //   String(req.query.type) !== 'sms' &&
    //   String(req.query.type) !== 'email'
    // ) {
    //   return [false, 'type is missing'];
    // }
    //const type = String(req.query.type);
    let result = null;
    // switch (type) {
    //   case 'sms':
    result = await this.settingsRepository.updateByOne(
      {'notificationTemplates.templateId': req.body.templateId},
      {
        $set: {
          'notificationTemplates.$': req.body,
        },
      }
    );
    //  break;
    // case 'email':
    //   result = await this.settingsRepository.updateByOne(
    //     {'notificationTemplates.email.templateId': req.body.templateId},
    //     {
    //       $set: {
    //         'notificationTemplates.email.$': req.body,
    //       },
    //     }
    //   );
    //   break;
    //  }
    if (!result) {
      return [false, constants.failureUpdateMessage('notification template')];
    }
    return [true, result];
  }

  async deleteNotificationTemplate(
    req: Request
  ): Promise<[boolean, ISettings | string]> {
    // const type = String(req?.query?.type);
    // if (type !== 'sms' && type !== 'email') {
    //   return [false, 'type is missing'];
    // }
    let result = null;
    const templateId = req.body.templateId;
    // switch (type) {
    //   case 'sms':
    result = await this.settingsRepository.updateByOne(
      {'notificationTemplates.templateId': req.body.templateId},
      {
        $pull: {
          'notificationTemplates.$': {templateId},
        },
      }
    );
    // break;
    //   case 'email':
    //     result = await this.settingsRepository.updateByOne(
    //       {'notificationTemplates.email.templateId': req.body.templateId},
    //       {
    //         $pull: {
    //           'notificationTemplates.email': {templateId},
    //         },
    //       }
    //     );
    //     break;
    // }
    if (!result) {
      return [false, constants.failureDeleteMessage('notification template')];
    }
    return [true, result];
  }

  async addNotificationConfiguration(
    req: Request
  ): Promise<[boolean, NotificationConfigurationRepository | string]> {
    let result = null,
      createConfiguration;
    let find =
      await this.notificationConfigurationRepository.getOne<INotificationConfiguration>(
        {value: req.body.value}
      );
    if (!find) {
      const newConfiguration = new NotificationConfiguration();
      const validatedConfiguration = DataCopier.copy(
        newConfiguration,
        req.body
      );
      let createConfiguration: any =
        await this.notificationConfigurationRepository.create<INotificationConfiguration>(
          validatedConfiguration
        );
      const findSettings =
        await this.settingsRepository.getAllWithoutPagination<ISettings>();

      result = await this.settingsRepository.updateById(findSettings[0].id, {
        $push: {
          notificationConfiguration: {
            value: createConfiguration.value,
            label: createConfiguration.label,
            id: createConfiguration.id,
          },
        },
      });
    } else {
      result = await this.notificationConfigurationRepository.updateByOne(
        {value: req.body.value},
        {
          $set: req.body,
        }
      );
    }
    if (!result) {
      return [false, constants.failureUpdateMessage('notification template')];
    }
    return [true, result];
  }

  async getNotificationConfiguration(
    req: Request
  ): Promise<[boolean, ISettings | INotificationConfiguration | any]> {
    let result = null;
    const type = String(req?.query?.type);
    switch (type) {
      case 'all':
        result =
          await this.settingsRepository.getAllWithoutPagination<ISettings>();
        result = result[0]?.notificationConfiguration;
        break;
      default:
        result =
          await this.notificationConfigurationRepository.getOne<INotificationConfiguration>(
            {value: type}
          );
    }

    if (!result) {
      return [false, constants.failureUpdateMessage('notification template')];
    }
    return [true, result];
  }
}

export default SettingsService;
