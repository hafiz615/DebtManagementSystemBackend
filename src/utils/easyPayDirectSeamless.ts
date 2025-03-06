import axiosInstance from './axiosInstanceInterceptor';
import commonUtil from './common.util';
class EasyPayDirectSeamless {
  async addInvoice(
    platform: string,
    amount: number,
    email: string
  ): Promise<[boolean, string]> {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const params = {
      invoicing: 'add_invoice',
      security_key: urlSecurityKey.securityKey,
      amount: String(amount),
      email: email,
    };

    const response = await axiosInstance.post(
      url,
      new URLSearchParams(params),
      {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }
    );

    console.log('Final Params:', params);
    console.log('Response Data:', response.data);
    const responseNum = new URLSearchParams(response.data).get('response');
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

    const params = {
      invoicing: 'send_invoice',
      security_key: urlSecurityKey.securityKey,
      invoice_id: invoiceId,
    };

    const response = await axiosInstance.post(
      url,
      new URLSearchParams(params),
      {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }
    );

    console.log('Send Invoice Params:', params);
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

    const params = {
      invoicing: 'close_invoice',
      security_key: urlSecurityKey.securityKey,
      invoice_id: invoiceId,
    };

    const response = await axiosInstance.post(
      url,
      new URLSearchParams(params),
      {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      }
    );

    console.log('Close Invoice Params:', params);
    console.log('Response Data:', response.data);
    const responseNum = new URLSearchParams(response.data).get('response');

    if (responseNum === '1') {
      return [true, 'Invoice closed successfully'];
    }

    return [false, 'Unable to close invoice'];
  }
}

export default new EasyPayDirectSeamless();
