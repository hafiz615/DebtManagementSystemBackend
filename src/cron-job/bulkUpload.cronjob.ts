import cron from 'node-cron';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {BulkUploadRepository} from '../api/repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../database/interfaces/bulkUpload.interface';
import googleDriveUtil from '../utils/googleDrive.util';
import UploadUtil from '../utils/upload.util';
import {IDebtor} from '../database/interfaces/debtor.interface';
import caseUtil from '../utils/case.util';

class BulkCronJob {
  private debtorRepository: DebtorRepository;
  private bulkUploadRepository: BulkUploadRepository;
  private uploadUtil: UploadUtil;
  constructor() {
    this.debtorRepository = new DebtorRepository();
    this.bulkUploadRepository = new BulkUploadRepository();
    this.uploadUtil = new UploadUtil();
  }

  async testBulkCron() {
    const bulkUploads = await this.bulkUploadRepository.getAll<IBulkUpload>(
      {
        $or: [
          {status: 'Pending'},
          {$and: [{retries: {$lt: 2}}, {status: 'Failed'}]},
        ],
      },
      undefined,
      undefined,
      {_id: -1},
      undefined,
      undefined,
      1,
      10
    );
    console.log(bulkUploads, 'bulkuploadssss');
    for (const bulkUpload of bulkUploads) {
      if (!bulkUpload.driveUrl) continue;
      const folderId = await this.getFolderId(bulkUpload.driveUrl);
      console.log(folderId, 'folderIdd');
      const getFilesData = await googleDriveUtil.listFiles(folderId);
      console.log(getFilesData, 'get filesss');
      const documents = await this.uploadUtil.awsS3FileUpload(getFilesData);
      console.log(documents);
      const updatedDebtor = await this.debtorRepository.updateById<IDebtor>(
        String(bulkUpload.debtor),
        {documents: documents}
      );
      console.log(updatedDebtor);
      const extractedFields =
        await caseUtil.getExtractionMCABuffer(getFilesData);
      console.log(
        extractedFields.extracted_fields,
        'extractedFields.extracted_fields'
      );
      // const extractedFields = [
      //   {
      //     bussiness_info: {
      //       'Business Legal Name': 'ALOPPOC LLC',
      //       'Business EIN Number': '85-2208548',
      //       'Business Category': 'Limited Liability Company (LLC)',
      //       'Business Country Name': 'USA',
      //       'Business State Name': 'Florida',
      //       'Business City Name': 'Boca Raton',
      //       'Business Zip code': '33433',
      //       'Business Phone Number': '(561) 235-6125',
      //       'Business Street Address': '6450 VÍA TIERRA',
      //     },
      //     debtor_info: {
      //       "Debtor's Name": 'James M Coppola',
      //       "Debtor's Email address": 'jamescoppola44@gmail.com',
      //       "Debtor's SSN": '262-55-0680',
      //       "Debtor's Country Name": 'USA',
      //       "Debtor's State Name": 'Florida',
      //       "Debtor's City Name": 'Boca Raton',
      //       "Debtor's Zip code": '33433',
      //       "Debtor's Phone Number": '(561) 235-6125',
      //       "Debtor's Address": '6450 VÍA TIERRA, Boca Raton, FL 33433',
      //     },
      //     creditor_info: {
      //       "creditor's Name": 'Bitty Advance 2, LLC',
      //       "creditor's bank acc. title": '',
      //       "creditor's Email address": 'accountsupport@bittyadvance.com',
      //       "creditor's Phone Number": '(768) 987-9876',
      //     },
      //     contract_details: {
      //       signing_date: '2023-04-27',
      //       loan_amount: '6,000',
      //       payable_amount: '9,900',
      //       purchased_percentage: 'Daily',
      //       repayment_amount: 'Daily',
      //     },
      //   },
      // ];
      // const creditorData = {
      //   creditor_names: ['Bitty Advance', 'Funding Metrics'],
      //   mapped_data: {'Bitty Advance': 'Bitty Advance 2, LLC'},
      // };
      if (
        typeof extractedFields === 'string' &&
        bulkUpload.status === 'Pending'
      ) {
        await this.bulkUploadRepository.updateById(bulkUpload._id, {
          status: 'Failed',
        });
        continue;
      }
      if (
        typeof extractedFields === 'string' &&
        bulkUpload.status === 'Failed'
      ) {
        await this.bulkUploadRepository.updateById(bulkUpload._id, {
          $inc: {retries: 1},
          errorMessage: extractedFields,
        });
        continue;
      }
      console.log(
        extractedFields.extracted_fields,
        'extractedFields.extracted_fields'
      );
      const creditorData = await caseUtil.getCreditorNames(
        updatedDebtor,
        extractedFields.extracted_fields,
        ''
      );
      console.log(creditorData, 'creditor Dataaaa');
      const caseTemp = await googleDriveUtil.mapCreditorsCases(
        extractedFields.extracted_fields,
        creditorData
      );
      console.log(caseTemp, 'caseTempoppp');
      const resp = await caseUtil.createCreditorsCases(
        {data: caseTemp},
        bulkUpload.createdByName,
        bulkUpload.createdById,
        String(bulkUpload.debtor)
      );
      console.log(resp);
    }
  }

  startCronJob() {
    cron.schedule('0 6,12,18 * * *', async () => {
      const bulkUploads = await this.bulkUploadRepository.getAll<IBulkUpload>(
        {
          status: 'Pending',
          $and: [{retries: {$lt: 2}}, {status: 'Failed'}],
        },
        undefined,
        undefined,
        {_id: -1},
        undefined,
        undefined,
        1,
        10
      );
      for (const bulkUpload of bulkUploads) {
        if (!bulkUpload.driveUrl) continue;
        const folderId = await this.getFolderId(bulkUpload.driveUrl);
        const getFilesData = await googleDriveUtil.listFiles(folderId);
        const documents = await this.uploadUtil.awsS3FileUpload(getFilesData);
        const updatedDebtor = await this.debtorRepository.updateById<IDebtor>(
          String(bulkUpload.debtor),
          {documents: documents}
        );
        const extractedFields =
          await caseUtil.getExtractionMCABuffer(getFilesData);
        if (
          typeof extractedFields === 'string' &&
          bulkUpload.status === 'Pending'
        ) {
          await this.bulkUploadRepository.updateById(bulkUpload._id, {
            status: 'Failed',
          });
        }
        if (
          typeof extractedFields === 'string' &&
          bulkUpload.status === 'Failed'
        ) {
          await this.bulkUploadRepository.updateById(bulkUpload._id, {
            $inc: {retries: 1},
          });
        }
        console.log(
          extractedFields.extracted_fields,
          'extractedFields.extracted_fields'
        );
        const creditorNames = await caseUtil.getCreditorNames(
          updatedDebtor,
          extractedFields.extracted_fields,
          ''
        );

        console.log(creditorNames, 'creditornamesssss');
      }
    });
  }

  async getFolderId(url: string) {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1] as string;
    }
    return '';
  }
}

export default new BulkCronJob();
