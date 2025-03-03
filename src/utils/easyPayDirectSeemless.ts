import axiosInstance from './axiosInstanceInterceptor';
import commonUtil from './common.util';
class EasyPayDirectSeamless {
  async addInvoice(
    platform: string,
    amount: number,
    email: string,
    debtorName?: string
  ): Promise<[boolean, string]> {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const formData = new URLSearchParams();
    formData.append('invoicing', 'add_invoice');
    formData.append('security_key', urlSecurityKey.securityKey);
    formData.append('amount', String(amount));
    formData.append('email', email);

    if (debtorName) {
      const names = await commonUtil.getFirstAndLastNameByFullName(debtorName);
      formData.append('first_name', names.firstName);
      formData.append('last_name', names.lastName);
    }

    // Send POST request with correct headers
    const response = await axiosInstance.post(url, formData.toString(), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });

    console.log('Final Params:', formData.toString());
    console.log('Response Data:', response.data);
    const responseNum = new URLSearchParams(response.data).get('response');
    console.log('Response Number:', responseNum);

    if (responseNum === '1') {
      const invoiceId = new URLSearchParams(response.data).get('invoice_id');
      return [true, invoiceId];
    }

    return [false, 'Unable to create invoice'];
  }

  async sendInvoice(
    platform: string,
    invoiceId: string
  ): Promise<[boolean, string]> {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const formData = new URLSearchParams();
    formData.append('invoicing', 'send_invoice');
    formData.append('security_key', urlSecurityKey.securityKey);
    formData.append('invoice_id', invoiceId);

    const response = await axiosInstance.post(url, formData.toString(), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });

    console.log('Send Invoice Params:', formData.toString());
    console.log('Response Data:', response.data);
    const responseNum = new URLSearchParams(response.data).get('response');

    if (responseNum === '1') {
      return [true, 'Invoice sent successfully'];
    }

    return [false, 'Unable to send invoice'];
  }

  async closeInvoice(
    platform: string,
    invoiceId: string
  ): Promise<[boolean, string]> {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const formData = new URLSearchParams();
    formData.append('invoicing', 'close_invoice');
    formData.append('security_key', urlSecurityKey.securityKey);
    formData.append('invoice_id', invoiceId);

    const response = await axiosInstance.post(url, formData.toString(), {
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });

    console.log('Close Invoice Params:', formData.toString());
    console.log('Response Data:', response.data);
    const responseNum = new URLSearchParams(response.data).get('response');

    if (responseNum === '1') {
      return [true, 'Invoice closed successfully'];
    }

    return [false, 'Unable to close invoice'];
  }
}

export default new EasyPayDirectSeamless();
