import dotenv from 'dotenv';
import constantsUtil from './constants.util';
dotenv.config();
export class EnvSetup {
  static dbURI: string;
  static invitationLink: string;

  static setEnvVariables() {
    const env = process.env.environment;
    switch (env) {
      case 'dev':
        this.dbURI = `mongodb://${process.env.dbUsername_Dev}:${process.env.dbPassword_Dev}@139.59.34.88:27017/debt-settlement-staging?authSource=admin`;
        this.invitationLink = constantsUtil.ACCOUNT_INVITATION_BASE_LINK_DEV;
        break;
      case 'prod':
        this.dbURI = `mongodb://${process.env.dbUsername_Prod}:${process.env.dbPassword_Prod}@18.208.220.253:27017/debt-settlement?authSource=admin`;
        this.invitationLink = constantsUtil.ACCOUNT_INVITATION_BASE_LINK;
        break;
    }
  }
}
