import cron from 'node-cron';
import {DebtorRepository} from '../api/repository/debtor/debtor.repository';
import {BulkUploadRepository} from '../api/repository/bulkUpload/bulkUpload.repository';
import {IBulkUpload} from '../database/interfaces/bulkUpload.interface';
import googleDriveUtil from '../utils/googleDrive.util';
import UploadUtil from '../utils/upload.util';
import {IDebtor} from '../database/interfaces/debtor.interface';
import caseUtil from '../utils/case.util';
import commonUtil from '../utils/common.util';
import {ICase} from '../database/interfaces/case.interface';

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
      try {
        let checkError = false;
        if (!bulkUpload.driveUrl) continue;
        let folderId = await this.getFolderId(bulkUpload.driveUrl);
        if (!folderId) {
          folderId = 'Invalid drive url';
          await this.checkErrorAI(bulkUpload, folderId);
          continue;
        }
        console.log(folderId, 'folderIdd');
        const getFilesData = await googleDriveUtil.listFiles(folderId);
        checkError = await this.checkErrorAI(bulkUpload, getFilesData);
        if (checkError) continue;
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
        checkError = await this.checkErrorAI(bulkUpload, extractedFields);
        if (checkError) continue;
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
        checkError = await this.checkErrorAI(bulkUpload, creditorData);
        if (checkError) continue;
        const caseTemp = await googleDriveUtil.mapCreditorsCases(
          extractedFields.extracted_fields,
          creditorData
        );
        console.log(caseTemp, 'caseTempoppp');
        const result = await caseUtil.createCreditorsCases(
          {data: caseTemp},
          bulkUpload.createdByName,
          bulkUpload.createdById,
          String(bulkUpload.debtor)
        );
        if (result[0]) {
          const cases = result[1] as ICase[];
          const caseIds = cases.map(temp => {
            return String(temp._id);
          });
          let retries = bulkUpload.retries;
          if (bulkUpload.status === 'Failed') retries += 1;
          await this.bulkUploadRepository.updateById(bulkUpload._id, {
            status: 'Action Required',
            $push: {time: new Date(commonUtil.getCurrentDate())},
            caseIds: caseIds,
            retries: retries,
          });
        }
        console.log(result);
      } catch (error) {
        console.log(error);
        await this.checkErrorAI(bulkUpload, error.message);
      }
    }
  }

  startCronJob() {
    cron.schedule('0 */3 * * *', async () => {
      const bulkUploads = await this.bulkUploadRepository.getAll<IBulkUpload>(
        {
          status: 'Pending',
        },
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        10
      );
      console.log(bulkUploads, 'bulkuploadssss');
      for (const bulkUpload of bulkUploads) {
        try {
          let checkError = false;
          if (!bulkUpload.driveUrl) continue;
          let folderId = await this.getFolderId(bulkUpload.driveUrl);
          if (!folderId) {
            folderId = 'Invalid drive url';
            await this.checkErrorAI(bulkUpload, folderId);
            continue;
          }
          console.log(folderId, 'folderIdd');
          const getFilesData = await googleDriveUtil.listFiles(folderId);
          checkError = await this.checkErrorAI(bulkUpload, getFilesData);
          if (checkError) continue;
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
          checkError = await this.checkErrorAI(bulkUpload, extractedFields);
          if (checkError) continue;
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
          checkError = await this.checkErrorAI(bulkUpload, creditorData);
          if (checkError) continue;
          const caseTemp = await googleDriveUtil.mapCreditorsCases(
            extractedFields.extracted_fields,
            creditorData
          );
          console.log(caseTemp, 'caseTempoppp');
          const result = await caseUtil.createCreditorsCases(
            {data: caseTemp},
            bulkUpload.createdByName,
            bulkUpload.createdById,
            String(bulkUpload.debtor)
          );
          if (result[0]) {
            const cases = result[1] as ICase[];
            const caseIds = cases.map(temp => {
              return String(temp._id);
            });
            let retries = bulkUpload.retries;
            if (bulkUpload.status === 'Failed') retries += 1;
            await this.bulkUploadRepository.updateById(bulkUpload._id, {
              status: 'Action Required',
              $push: {time: new Date(commonUtil.getCurrentDate())},
              caseIds: caseIds,
              retries: retries,
            });
          }
          console.log(result);
        } catch (error) {
          console.log(error);
          await this.checkErrorAI(bulkUpload, error.message);
        }
      }
    });
  }

  private async getFolderId(url: string) {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1] as string;
    }
    return '';
  }

  private async checkErrorAI(bulkUpload: IBulkUpload, checkError: any) {
    if (
      typeof checkError === 'string' &&
      bulkUpload.status === 'Pending' &&
      bulkUpload.retries === 2
    ) {
      await this.bulkUploadRepository.updateById(bulkUpload._id, {
        status: 'Failed',
        $inc: {retries: 1},
        errorMessage: checkError,
        $push: {time: new Date(commonUtil.getCurrentDate())},
      });
      return true;
    }
    if (typeof checkError === 'string' && bulkUpload.status === 'Pending') {
      await this.bulkUploadRepository.updateById<IBulkUpload>(bulkUpload._id, {
        $inc: {retries: 1},
        errorMessage: checkError,
        $push: {time: new Date(commonUtil.getCurrentDate())},
      });
      return true;
    }
    return false;
  }
}

export default new BulkCronJob();
