import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {IDebtor} from '../database/interfaces/debtor.interface';
import axiosInstance from './axiosInstanceInterceptor';
import dotenv from 'dotenv';
import UploadUtil from './upload.util';
dotenv.config();
class MoneyThumbUtil {
  private debtorRepository: DebtorRepository;
  private uploadUtil: UploadUtil;
  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.uploadUtil = new UploadUtil();
  }

  async run(debtorId: string) {
    try {
      const debtor = await this.debtorRepository.getById<IDebtor>(debtorId);
      let appid = debtor.moneyThumbAppId;
      const token = await this.authenticateUser();
      if (!appid) {
        const app = await this.createNewApp(token, debtorId);
        appid = app['appid'];
      }
      await this.convertPdf(token, debtorId, appid);
      const scoreCard = await this.getScoreCard(token, appid, debtorId);
      await this.saveData(appid, scoreCard, debtorId);
    } catch (error) {
      console.log(error.message);
    }
  }

  async authenticateUser() {
    let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/authenticate`;

    const data = {
      product: process.env.moneyThumbProduct,
      username: process.env.moneyThumbUsername,
      password: process.env.moneyThumbPassword,
    };
    try {
      console.log('I am in authenticateUser moneythumb');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('Response Data', response.data);
      return response.data;
    } catch (error) {
      console.log(error.message);
      return error.message;
    }
  }

  async createNewApp(token: string, appNumber: string) {
    let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/new`;
    // Response Data {
    //     appnumber: 'test',
    //     appid: 3314502,
    //     naccounts: 14,
    //     owner: 'COMMERCIAL ACCOUNT MANAGEMENT',
    //     totalstatements: 0,
    //     totalstatements_reconciled: 0,
    //     totaltaxforms: 0,
    //     totaltaxreturns: 0,
    //     address1: 'Standard Monthly Service Charge',
    //     address2: '',
    //     citystate: '  ',
    //     expfactor: '50',
    //     accountlist: []
    //   }
    const data = {
      token: token,
      product: process.env.moneyThumbProduct,
      appnumber: appNumber,
    };

    try {
      console.log('I am in createNewApp moneythumb');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Response Data', response.data);
      return response.data;
    } catch (error) {
      console.log(error.message);
      return error.message;
    }
  }

  async convertPdf(token: string, debtorId: string, appId: number) {
    const debtor = await this.debtorRepository.getById<IDebtor>(debtorId);
    const documents = debtor.documents;

    let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/makecsv`;

    try {
      for (const document of documents) {
        const bytes = await this.uploadUtil.getPdfBytesFromS3(document.key);
        if (typeof bytes === 'string') continue;
        const stringData = Buffer.from(bytes).toString();
        const data = {
          token: token,
          product: process.env.moneyThumbProduct,
          appid: appId,
          'pdf-filename': stringData,
        };
        console.log('I am in convertPdf moneythumb');
        console.log('URL: ', url);
        // console.log('Payload: ', data);
        const response = await axiosInstance.post(url, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Response Data', response.data);
      }
      //   return response.data;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  }

  async getScoreCard(token: string, appId: number, debtorId: string) {
    let url = `https://online.moneythumb.com/api/v${process.env.moneyThumbVersion}/scorecard`;
    const data = {
      token: token,
      product: process.env.moneyThumbProduct,
      appid: appId,
    };

    try {
      console.log('I am in getScoreCard moneythumb');
      console.log('URL: ', url);
      console.log('Payload: ', data);
      const response = await axiosInstance.post(url, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Response Data', response.data['metrics']['metricdata']);
      return response.data;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  }

  async saveData(appid: number, scoreCard: any, debtorId: string) {
    try {
      if (scoreCard['metrics']['metricdata']) {
        const metricData = scoreCard['metrics']['metricdata'];
        if (metricData?.length) {
          const profitArray = metricData.find(row => row[0] === 'Profit');
          const trueRevenueArray = metricData.find(
            row => row[0] === 'True Revenue'
          );
          if (profitArray.length && trueRevenueArray.length) {
            const profitAverage =
              (parseFloat(profitArray[1]) + parseFloat(profitArray[2])) / 2;
            const trueRevenueAverage =
              (parseFloat(trueRevenueArray[1]) +
                parseFloat(trueRevenueArray[2])) /
              2;
            const profitability = (profitAverage / trueRevenueAverage) * 0.67;
            console.log(profitability, 'profitability');
            await this.debtorRepository.updateById<IDebtor>(debtorId, {
              strategy3MaxProfit: Math.round(profitability * 100) / 100,
              appid: appid,
            });
            return;
          }
          await this.debtorRepository.updateById<IDebtor>(debtorId, {
            appid: appid,
          });
        }
      }
    } catch (error) {
      console.log(error.message);
    }
  }
}
export default new MoneyThumbUtil();
