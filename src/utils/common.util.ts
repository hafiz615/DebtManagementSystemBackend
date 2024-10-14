import bcrypt from 'bcryptjs';
import constantsUtil from './constants.util';
import RolesPermissionsService from '../api/services/rolesPermissions.service';
import {Request} from 'express';

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
}
export default new CommonUtil();
