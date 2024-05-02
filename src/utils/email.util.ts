import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import {IUser} from '../database/interfaces/user.interface';
import constantsUtil from './constants.util';
dotenv.config();
class EmailUtil {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
  }

  async sendInvitationLink(user: IUser, link: string) {
    const msg = {
      to: user.email,
      from: 'mohsin@luminogics.com', // Use the email address or domain you verified above
      subject: `${constantsUtil.ACCOUNT_INVITATION_SUBJECT}`,
      text: `Dear ${user.name},

             You've been invited to join our platform! To complete your account setup, please click the link below to set your password:

             ${link}

             If you didn't request this, you can safely ignore this email.

            Thank you,
            Debt-Settlement Team`,
    };
    try {
      await sgMail.send(msg);
    } catch (error: any) {
      console.log(error.message);
      return error.message;
    }
  }
}

export default EmailUtil;
