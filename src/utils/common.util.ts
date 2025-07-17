import bcrypt from 'bcryptjs';
import constantsUtil from './constants.util';
import RolesPermissionsService from '../api/services/rolesPermissions.service';
import {Request} from 'express';
import {decrypt} from 'n-krypta';
import dotnev from 'dotenv';
import {paymentPlatform} from '../enums';
import mime from 'mime-types';
import {CreditorRepository} from '../api/repository/creditor/creditor.repository';
import {AttorneyRepository} from '../api/repository/attorney/attorney.repository';
import {ICreditor} from '../database/interfaces/creditor.interface';
import {IAttorney} from '../database/interfaces/attorney.interface';
import {LawfirmRepository} from '../api/repository/lawfirm/lawfirm.repository';
import {ILawfirm} from '../database/interfaces/lawfirm.interface';
import mongoose from 'mongoose';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';
import {CaseRepository} from '../api/repository/case/case.repository';
import {ICase} from '../database/interfaces/case.interface';
import {INotificationCount} from '../database/interfaces/notificationCount.interface';
dotnev.config();
class CommonUtil {
  private creditorRepository: CreditorRepository;
  private attorneyRepository: AttorneyRepository;
  private lawfirmRepository: LawfirmRepository;
  private debtorRepository: DebtorRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.creditorRepository = new CreditorRepository();
    this.attorneyRepository = new AttorneyRepository();
    this.lawfirmRepository = new LawfirmRepository();
    this.debtorRepository = new DebtorRepository();
    this.caseRepository = new CaseRepository();
  }
  getCurrentDate() {
    let date = new Date().toUTCString();
    return date;
  }
  async getUserByType(id: string, type: string) {
    switch (type) {
      case 'creditor':
        return {
          obj: await this.creditorRepository.getById<ICreditor>(id),
          model: new CreditorRepository(),
        };
      case 'attorney':
        return {
          obj: await this.attorneyRepository.getById<IAttorney>(id),
          model: new AttorneyRepository(),
        };
      case 'lawfirm':
        return {
          obj: await this.lawfirmRepository.getById<ILawfirm>(id),
          model: new LawfirmRepository(),
        };
      case 'debtor':
        return {
          obj: await this.debtorRepository.getById<IDebtor>(id),
          model: new DebtorRepository(),
        };

      case 'case':
        return {
          obj: await this.caseRepository.getById<ICase>(
            id,
            undefined,
            undefined,
            ['creditor', 'debtor']
          ),
          model: new CaseRepository(),
        };
      default:
        return null;
    }
  }

  async getTimePeriod(
    timePeriod: string,
    endDate?: string,
    paymentDueDate?: string
  ) {
    switch (timePeriod) {
      case 'Daily':
        return 1;
      case 'Weekly':
        return 7;
      case 'Fortnightly':
        return 14;
      case 'Monthly':
        return 30;
      case 'Custom':
        const baseDate = paymentDueDate
          ? new Date(paymentDueDate)
          : new Date(this.getCurrentDate());

        return Math.round(
          (new Date(endDate).getTime() - baseDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
      default:
        return null;
    }
  }

  async getUserDetails(data: any) {
    return {
      name: data?.basicInformation?.fullName || data?.name,
      email: data?.basicInformation?.email || data?.email,
    };
  }

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(String(password), salt);
  }

  checkPasswordRegex(password: string) {
    const passRegex = constantsUtil.passwordRegex;
    return passRegex.test(password);
  }

  async checkPermission(keyword: string, req: any) {
    const rolesPermissionsService = new RolesPermissionsService();
    const role = req.role;
    const getRole = await rolesPermissionsService.getRole(role);
    const permissions = {
      ...getRole.generalPermissions,
      ...getRole.settings,
      ...getRole.analytics,
    };
    // if (keyword === 'addNewUser' && req.body.role === 'Admin') {
    //   return permissions['createAdminUser'];
    // }
    return permissions[keyword];
  }

  async calculatePercentageChange(oldValue: number, newValue: number) {
    const difference = newValue - oldValue;
    const percentageChange = (difference / oldValue) * 100;
    return Number(percentageChange.toFixed(2)); // Returns the result rounded to 2 decimal places
  }

  async cleanPhoneNumber(phoneNumber: string) {
    let cleanedNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
    if (cleanedNumber.startsWith('1')) {
      cleanedNumber = cleanedNumber.substring(1);
    }
    return cleanedNumber;
  }

  async extractLastTenDigits(num: string) {
    return num.replace(/\D/g, '').slice(-10);
  }

  extractAmount(feeString: string) {
    const match = feeString ? feeString.match(/(\d+(\.\d+)?)/) : false;
    if (match) {
      return parseFloat(match[0]);
    }
    return 0;
  }

  async removeDashesAndRoundBrackets(data: string) {
    if (typeof data === 'number') return String(data);
    if (!data) return '-';
    return data.replace(/[-()]/g, '');
  }

  async getValuePercenatge(data: string) {
    if (typeof data === 'number') return String(data);
    if (!data) return '-';
    const result = data.match(/\d+%/);

    if (result) {
      return result[0];
    } else {
      return data;
    }
  }

  async getFirstAndLastNameByFullName(fullName: string) {
    const creditorNames = fullName.split(' ');
    let lastName = '';
    if (!creditorNames[1]) {
      lastName = creditorNames[0];
    } else {
      lastName = creditorNames.slice(1).join(' ');
    }

    var data = {
      firstName: creditorNames[0],
      lastName: lastName,
    };
    return data;
  }

  getDecryptedData(data: string) {
    return decrypt(data, process.env.kryptaSecretKey);
  }

  async getUrlAndSecurityKeyPlatform(platform: string) {
    let securityKey = '';
    let url = '';
    switch (platform) {
      case paymentPlatform.easypay:
        securityKey = process.env.easypaySecurityKey;
        url = process.env.easypayUrl;
        break;
      case paymentPlatform.seamlesschexMerchant:
        securityKey = process.env.seamlesschexMerchantSecurityKey;
        url = process.env.seamlesschexMerchantUrl;
        break;
    }
    return {securityKey, url};
  }

  async getUrlAndSecurityKeyQuery(platform: string) {
    let securityKey = '';
    let url = '';
    switch (platform) {
      case paymentPlatform.easypay:
        securityKey = process.env.easypaySecurityKey;
        url = process.env.easypayQueryUrl;
        break;
      case paymentPlatform.seamlesschexMerchant:
        securityKey = process.env.seamlesschexMerchantSecurityKey;
        url = process.env.seamlesschexMerchantQueryUrl;
        break;
    }
    return {securityKey, url};
  }

  async getPageAndLimit(
    defaultPage: number,
    defaultLimit: number,
    req: Request
  ) {
    let page = 0,
      limit = 0;
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : defaultPage;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : defaultLimit;
    }
    return {page, limit};
  }

  getMimeType(fileName: string) {
    return mime.lookup(fileName) || 'application/octet-stream';
  }

  isMongoId(data: string) {
    return mongoose.Types.ObjectId.isValid(data);
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async notificationCount(notificationCount: INotificationCount, type: string) {
    let field = null;

    switch (type) {
      case 'EMAIL':
        field = 'emailCount';
        break;
      case 'SMS':
        field = 'smsCount';
        break;
      case 'TASK':
        field = 'taskCount';
        break;
      default:
        return null;
    }

    notificationCount.count -= notificationCount[field];
    notificationCount[field] = 0;

    return notificationCount;
  }
}
export default new CommonUtil();
