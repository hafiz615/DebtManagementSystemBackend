import bcrypt from 'bcryptjs';
import constantsUtil from './constants.util';

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
}
export default new CommonUtil();
