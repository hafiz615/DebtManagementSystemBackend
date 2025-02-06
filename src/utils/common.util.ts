import bcrypt from 'bcryptjs';
import constantsUtil from './constants.util';
import RolesPermissionsService from '../api/services/rolesPermissions.service';
import {Request} from 'express';
import {decrypt} from 'n-krypta';
import dotnev from 'dotenv';
import {paymentPlatform} from '../enums';
import mime from 'mime-types';
dotnev.config();
class CommonUtil {
  getCurrentDate() {
    let date = new Date().toUTCString();
    return date;
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

  async cleanPhoneNumberConditionally(phoneNumber: string) {
    const phoneNumberCode = phoneNumber.startsWith('+92')
      ? '+92'
      : phoneNumber.startsWith('92')
        ? '92'
        : '';

    if (
      process.env.environment === 'dev' &&
      (phoneNumberCode === '+92' || phoneNumberCode === '92')
    ) {
      return phoneNumber.replace(/^(\+?92)/, '');
    } else {
      return this.cleanPhoneNumber(phoneNumber);
    }
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
}
export default new CommonUtil();
