"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const drive_1 = require("googleapis/build/src/apis/drive");
const oauth2_1 = require("googleapis/build/src/apis/oauth2");
const case_util_1 = __importDefault(require("./case.util"));
dotenv_1.default.config();
class GoogleDriveUtil {
    async getGdCredentials() {
        const googleCredentials = {
            type: 'service_account',
            project_id: process.env.googleDriveProjectID,
            private_key_id: process.env.googleDrivePrivateKeyId,
            private_key: process.env.googleDrivePrivateKey.replace(/\\n/g, '\n'),
            client_email: process.env.googleDriveClientEmail,
            client_id: process.env.googleDriveClientId,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.googleDriveClient_x509_cert_url,
            universe_domain: 'googleapis.com',
        };
        const authGoogle = await oauth2_1.auth.getClient({
            credentials: googleCredentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        return authGoogle;
    }
    async listFiles(id) {
        try {
            const auth = await this.getGdCredentials();
            // Initialize the Google API client
            const driveObj = (0, drive_1.drive)({ version: 'v3', auth });
            const res = await driveObj.files.list({
                q: `'${id}' in parents and trashed = false`,
            });
            const files = res.data.files;
            const driveFilesData = [];
            if (files.length) {
                for (const file of files) {
                    console.log(file, 'fileeeeeeee');
                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                        if (file.name.toLowerCase().includes('mca') ||
                            file.name.toLowerCase().includes('bank')) {
                            const res = await driveObj.files.list({
                                q: `'${file.id}' in parents and trashed = false`,
                            });
                            const files = res.data.files;
                            for (const file of files) {
                                if (file.mimeType === 'application/pdf') {
                                    const fileData = await driveObj.files.get({
                                        auth: auth,
                                        fileId: file.id,
                                        alt: 'media',
                                    }, { responseType: 'arraybuffer' });
                                    driveFilesData.push({
                                        originalname: file.name,
                                        buffer: Buffer.from(fileData.data),
                                    });
                                }
                            }
                        }
                    }
                }
            }
            else {
                return 'Could not find MCA or bank statements';
            }
            console.log(driveFilesData, 'driveFilesData');
            return driveFilesData.length
                ? driveFilesData
                : 'Could not find MCA or bank statements';
        }
        catch (error) {
            console.error('Error retrieving files:', error.message);
            return error.message;
        }
    }
    async mapCreditorsCases(data, creditorData) {
        let creditor = {};
        let basicInformation = {};
        let businessInformation = {};
        let caseTemp = {};
        const cases = [];
        for (const extractedData of data) {
            basicInformation['email'] =
                extractedData.creditor_info[`creditor's Email address`].toLowerCase();
            basicInformation['phone'] = extractedData.creditor_info[`creditor's Phone Number`]
                ? await this.cleanPhoneNumber(extractedData.creditor_info[`creditor's Phone Number`])
                : '';
            //basicInformation.fullName
            businessInformation['businessCategory'] = '';
            const companyName = extractedData.creditor_info[`creditor's Name`];
            businessInformation['companyName'] = companyName;
            //creditor.accountTitle
            if (Object.keys(creditorData.mapped_data).length) {
                for (const [key, value] of Object.entries(creditorData.mapped_data)) {
                    if (value === companyName) {
                        basicInformation['fullName'] = key;
                        creditor['accountTitle'] = key;
                    }
                }
            }
            else {
                for (const name of creditorData.creditor_names) {
                    if (companyName.includes(name)) {
                        basicInformation['fullName'] = name;
                        creditor['accountTitle'] = name;
                    }
                }
            }
            creditor['basicInformation'] = basicInformation;
            creditor['businessInformation'] = businessInformation;
            creditor['lastFundedDate'] = extractedData?.contract_details?.signing_date
                ? extractedData.contract_details.signing_date
                : '';
            caseTemp['contractDetails'] = extractedData?.contract_details;
            const payable_amount = extractedData?.contract_details?.payable_amount ?? '';
            const amount = payable_amount
                ? case_util_1.default.getCleanAmount(payable_amount)
                : 0;
            caseTemp['remaining'] = amount;
            caseTemp['totalDebt'] = amount;
            caseTemp['creditor'] = creditor;
            cases.push(caseTemp);
            creditor = {};
            basicInformation = {};
            businessInformation = {};
            caseTemp = {};
        }
        console.log(cases);
        return cases;
    }
    async cleanPhoneNumber(phoneNumber) {
        let cleanedNumber = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
        if (cleanedNumber.startsWith('1')) {
            cleanedNumber = cleanedNumber.substring(1);
        }
        return cleanedNumber;
    }
}
exports.default = new GoogleDriveUtil();
//# sourceMappingURL=googleDrive.util.js.map