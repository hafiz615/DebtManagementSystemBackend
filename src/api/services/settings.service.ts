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

class SettingsService {
  private settingsRepository: SettingsRepository;
  private customFieldsRepository: CustomFieldsRepository;
  private targetCFRepository: TargetCFRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.customFieldsRepository = new CustomFieldsRepository();
    this.targetCFRepository = new TargetCFRepository();
  }

  async addSettings(req: Request): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings = await this.settingsRepository.getAll<ISettings>({});
    if (!findSettings.length) {
      const newSettings = new Settings();
      if (req.body?.notificationTemplates?.email?.length) {
        req.body.notificationTemplates.email[0].templateId = 'Template-001';
      }
      if (req.body?.notificationTemplates?.sms?.length) {
        req.body.notificationTemplates.sms[0].templateId = 'Template-001';
      }
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      if (
        req.body?.notificationTemplates?.email?.length >
        findSettings[0].notificationTemplates.email.length
      ) {
        let num = req.body.notificationTemplates.email.length;
        req.body.notificationTemplates.email[num - 1].templateId =
          'Template-' + num.toString().padStart(3, '0');
      }
      if (
        req.body?.notificationTemplates?.sms?.length >
        findSettings[0].notificationTemplates.sms.length
      ) {
        let num = req.body.notificationTemplates.sms.length;
        req.body.notificationTemplates.sms[num - 1].templateId =
          'Template-' + num.toString().padStart(3, '0');
      }
      settigns = await this.settingsRepository.updateById(findSettings[0].id, {
        ...req.body,
      });
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }

  async getSettings(): Promise<[boolean, {} | string]> {
    const findSettings = await this.settingsRepository.getAll<ISettings>();
    const customFields =
      await this.customFieldsRepository.getAll<ICustomField>();
    if (!findSettings.length) {
      return [
        true,
        {
          paymentsAuthorizations: null,
          notificationTemplates: null,
          customFields: customFields,
        },
      ];
    }
    return [
      true,
      {
        paymentsAuthorizations: findSettings[0].paymentsAuthorizations,
        notificationTemplates: findSettings[0].notificationTemplates,
        customFields: customFields,
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
    target: string
  ): Promise<[boolean, ICustomField[] | string]> {
    const customFields = await this.customFieldsRepository.getAll<ICustomField>(
      {$or: [{target: target}, {shared: true}]}
    );
    if (!customFields.length) {
      return [false, constants.notFoundMessage('Custom fields')];
    }
    return [true, customFields];
  }
  async addCustomFieldByTarget(
    req: Request
  ): Promise<[boolean, ICustomField | string]> {
    const {name, value} = req.body;
    if (!req.query.target) {
      return [false, 'Target is missing'];
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
      target
    );
  }

  /**
   * Updates the custom fields for a specific target.
   *
   * @param req - The Express request object containing the target and updated custom fields.
   * @returns A Promise that resolves to a tuple containing a boolean indicating success and the updated target custom fields or an error message.
   *
   * @remarks
   * This method updates the custom fields for a specific target in the database.
   * It checks if the target is provided in the request query parameters.
   * If the target is missing, it returns an error message.
   * It then updates the target custom field with the new custom fields array using the `targetCFRepository.updateByOne` method.
   * If the target custom field is not found, it returns an error message.
   * Otherwise, it returns the updated target custom fields.
   */
  async updateCustomFieldByTarget(
    req: Request
  ): Promise<[boolean, ITargetCustomFields | string]> {
    if (!req.query.target) {
      return [false, 'Target is missing'];
    }
    const target = String(req.query.target);
    const updatedCustomFields = req.body.customFields;

    // Update the target custom field with the new custom fields array
    const targetCF =
      await this.targetCFRepository.updateByOne<ITargetCustomFields>(
        {target: target},
        {$set: {customFields: updatedCustomFields}}
      );

    if (!targetCF) {
      return [false, constants.notFoundMessage('custom fields for target')];
    }

    return [true, targetCF];
  }

  async removeCustomFieldByTarget(
    req: Request
  ): Promise<[boolean, ITargetCustomFields | string]> {
    if (!req.query.target) {
      return [false, 'Target is missing'];
    }
    let targetCF =
      await this.targetCFRepository.updateByOne<ITargetCustomFields>(
        {target: String(req.query.target)},
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
}

export default SettingsService;
