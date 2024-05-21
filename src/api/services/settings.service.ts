import constants from '../../utils/constants.util';
import {SettingsRepository} from '../repository/setting/settings.repository';
import {Request} from 'express';
import {ISettings} from '../../database/interfaces/settings.interface';
import {Settings} from '../../database/repomodels/settings.repomodel';
import {DataCopier} from '../../utils/dataCopier.util';

class SettingsService {
  private settingsRepository: SettingsRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
  }

  async addSettings(req: Request): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings = await this.settingsRepository.getAll<ISettings>({});
    if (!findSettings) {
      const newSettings = new Settings();
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      settigns = await this.settingsRepository.updateById(findSettings[0].id, {
        ...req.body,
      });
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }
  async addCustomFields(req: Request): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings = await this.settingsRepository.getAll<ISettings>({});
    if (!findSettings) {
      const newSettings = new Settings();
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      settigns = await this.settingsRepository.updateById(findSettings[0].id, {
        ...req.body,
      });
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }
  async editCustomFields(req: Request): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings = await this.settingsRepository.getAll<ISettings>({});
    if (!findSettings) {
      const newSettings = new Settings();
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      settigns = await this.settingsRepository.updateById(findSettings[0].id, {
        ...req.body,
      });
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }
  async getCustomFields(req: Request): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings = await this.settingsRepository.getAll<ISettings>({});
    if (!findSettings) {
      const newSettings = new Settings();
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      settigns = await this.settingsRepository.updateById(findSettings[0].id, {
        ...req.body,
      });
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }
  async deleteCustomField(
    req: Request
  ): Promise<[boolean, ISettings | string]> {
    let settigns = null;
    const findSettings = await this.settingsRepository.getAll<ISettings>({});
    if (!findSettings) {
      const newSettings = new Settings();
      const validatedSettings = DataCopier.copy(newSettings, req.body);
      settigns =
        await this.settingsRepository.create<ISettings>(validatedSettings);
    } else {
      settigns = await this.settingsRepository.updateById(findSettings[0].id, {
        ...req.body,
      });
    }
    if (!settigns) {
      return [false, constants.failureUpdateMessage('settings')];
    }
    return [true, settigns];
  }
}

export default SettingsService;
