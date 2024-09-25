"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const bulkUpload_repository_1 = require("../api/repository/bulkUpload/bulkUpload.repository");
const googleDrive_util_1 = __importDefault(require("../utils/googleDrive.util"));
const upload_util_1 = __importDefault(require("../utils/upload.util"));
const case_util_1 = __importDefault(require("../utils/case.util"));
const common_util_1 = __importDefault(require("../utils/common.util"));
class BulkCronJob {
    constructor() {
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.bulkUploadRepository = new bulkUpload_repository_1.BulkUploadRepository();
        this.uploadUtil = new upload_util_1.default();
    }
    async testBulkCron() {
        const bulkUploads = await this.bulkUploadRepository.getAll({
            $or: [
                { status: 'Pending' },
                { $and: [{ retries: { $lt: 2 } }, { status: 'Failed' }] },
            ],
        }, undefined, undefined, { _id: -1 }, undefined, undefined, 1, 10);
        console.log(bulkUploads, 'bulkuploadssss');
        for (const bulkUpload of bulkUploads) {
            try {
                if (!bulkUpload.driveUrl)
                    continue;
                const folderId = await this.getFolderId(bulkUpload.driveUrl);
                console.log(folderId, 'folderIdd');
                const getFilesData = await googleDrive_util_1.default.listFiles(folderId);
                let checkError = false;
                checkError = await this.checkErrorAI(bulkUpload, getFilesData);
                if (checkError)
                    continue;
                console.log(getFilesData, 'get filesss');
                const documents = await this.uploadUtil.awsS3FileUpload(getFilesData);
                console.log(documents);
                const updatedDebtor = await this.debtorRepository.updateById(String(bulkUpload.debtor), { documents: documents });
                console.log(updatedDebtor);
                const extractedFields = await case_util_1.default.getExtractionMCABuffer(getFilesData);
                checkError = await this.checkErrorAI(bulkUpload, extractedFields);
                if (checkError)
                    continue;
                console.log(extractedFields.extracted_fields, 'extractedFields.extracted_fields');
                const creditorData = await case_util_1.default.getCreditorNames(updatedDebtor, extractedFields.extracted_fields, '');
                console.log(creditorData, 'creditor Dataaaa');
                checkError = await this.checkErrorAI(bulkUpload, creditorData);
                if (checkError)
                    continue;
                const caseTemp = await googleDrive_util_1.default.mapCreditorsCases(extractedFields.extracted_fields, creditorData);
                console.log(caseTemp, 'caseTempoppp');
                const result = await case_util_1.default.createCreditorsCases({ data: caseTemp }, bulkUpload.createdByName, bulkUpload.createdById, String(bulkUpload.debtor));
                if (result[0]) {
                    const cases = result[1];
                    const caseIds = cases.map(temp => {
                        return String(temp._id);
                    });
                    let retries = bulkUpload.retries;
                    if (bulkUpload.status === 'Failed')
                        retries += 1;
                    await this.bulkUploadRepository.updateById(bulkUpload._id, {
                        status: 'Action Required',
                        $push: { time: new Date(common_util_1.default.getCurrentDate()) },
                        caseIds: caseIds,
                        retries: retries,
                    });
                }
                console.log(result);
            }
            catch (error) {
                console.log(error);
                await this.checkErrorAI(bulkUpload, error.message);
            }
        }
    }
    startCronJob() {
        node_cron_1.default.schedule('0 6,12,18 * * *', async () => {
            const bulkUploads = await this.bulkUploadRepository.getAll({
                $or: [
                    { status: 'Pending' },
                    { $and: [{ retries: { $lt: 2 } }, { status: 'Failed' }] },
                ],
            }, undefined, undefined, { _id: -1 }, undefined, undefined, 1, 10);
            console.log(bulkUploads, 'bulkuploadssss');
            for (const bulkUpload of bulkUploads) {
                try {
                    if (!bulkUpload.driveUrl)
                        continue;
                    const folderId = await this.getFolderId(bulkUpload.driveUrl);
                    console.log(folderId, 'folderIdd');
                    const getFilesData = await googleDrive_util_1.default.listFiles(folderId);
                    let checkError = false;
                    checkError = await this.checkErrorAI(bulkUpload, getFilesData);
                    if (checkError)
                        continue;
                    console.log(getFilesData, 'get filesss');
                    const documents = await this.uploadUtil.awsS3FileUpload(getFilesData);
                    console.log(documents);
                    const updatedDebtor = await this.debtorRepository.updateById(String(bulkUpload.debtor), { documents: documents });
                    console.log(updatedDebtor);
                    const extractedFields = await case_util_1.default.getExtractionMCABuffer(getFilesData);
                    checkError = await this.checkErrorAI(bulkUpload, extractedFields);
                    if (checkError)
                        continue;
                    console.log(extractedFields.extracted_fields, 'extractedFields.extracted_fields');
                    const creditorData = await case_util_1.default.getCreditorNames(updatedDebtor, extractedFields.extracted_fields, '');
                    console.log(creditorData, 'creditor Dataaaa');
                    checkError = await this.checkErrorAI(bulkUpload, creditorData);
                    if (checkError)
                        continue;
                    const caseTemp = await googleDrive_util_1.default.mapCreditorsCases(extractedFields.extracted_fields, creditorData);
                    console.log(caseTemp, 'caseTempoppp');
                    const result = await case_util_1.default.createCreditorsCases({ data: caseTemp }, bulkUpload.createdByName, bulkUpload.createdById, String(bulkUpload.debtor));
                    if (result[0]) {
                        const cases = result[1];
                        const caseIds = cases.map(temp => {
                            return String(temp._id);
                        });
                        let retries = bulkUpload.retries;
                        if (bulkUpload.status === 'Failed')
                            retries += 1;
                        await this.bulkUploadRepository.updateById(bulkUpload._id, {
                            status: 'Action Required',
                            $push: { time: new Date(common_util_1.default.getCurrentDate()) },
                            caseIds: caseIds,
                            retries: retries,
                        });
                    }
                    console.log(result);
                }
                catch (error) {
                    console.log(error);
                    await this.checkErrorAI(bulkUpload, error.message);
                }
            }
        });
    }
    async getFolderId(url) {
        const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
            return match[1];
        }
        return '';
    }
    async checkErrorAI(bulkUpload, checkError) {
        if (typeof checkError === 'string' && bulkUpload.status === 'Pending') {
            await this.bulkUploadRepository.updateById(bulkUpload._id, {
                status: 'Failed',
                errorMessage: checkError,
                $push: { time: new Date(common_util_1.default.getCurrentDate()) },
            });
            return true;
        }
        if (typeof checkError === 'string' && bulkUpload.status === 'Failed') {
            await this.bulkUploadRepository.updateById(bulkUpload._id, {
                $inc: { retries: 1 },
                errorMessage: checkError,
                $push: { time: new Date(common_util_1.default.getCurrentDate()) },
            });
            return true;
        }
        return false;
    }
}
exports.default = new BulkCronJob();
//# sourceMappingURL=bulkUpload.cronjob.js.map