"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mail_1 = __importDefault(require("@sendgrid/mail"));
const dotenv_1 = __importDefault(require("dotenv"));
const constants_util_1 = __importDefault(require("./constants.util"));
const notificationConfiguration_repository_1 = require("../api/repository/notificationConfiguration/notificationConfiguration.repository");
const settings_repository_1 = require("../api/repository/setting/settings.repository");
const case_repository_1 = require("../api/repository/case/case.repository");
const payment_repository_1 = require("../api/repository/payment/payment.repository");
const user_repository_1 = require("../api/repository/user/user.repository");
const lodash_1 = __importDefault(require("lodash"));
const handlebars_1 = __importDefault(require("handlebars"));
const debtor_repository_1 = require("../api/repository/debtor/debtor.repository");
const twilio_1 = __importDefault(require("twilio"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const case_util_1 = __importDefault(require("./case.util"));
const common_util_1 = __importDefault(require("./common.util"));
const client_1 = __importDefault(require("@sendgrid/client"));
const dataCopier_util_1 = require("./dataCopier.util");
const inbox_repository_1 = require("../api/repository/inbox/inbox.repository");
const inbox_repomodel_1 = require("../database/repomodels/inbox.repomodel");
const notification_repository_1 = require("../api/repository/notification/notification.repository");
const notification_repomodel_1 = require("../database/repomodels/notification.repomodel");
const notificationCount_repomodel_1 = require("../database/repomodels/notificationCount.repomodel");
const notificationCount_repository_1 = require("../api/repository/notificationCount/notificationCount.repository");
const uuid_1 = require("uuid");
const upload_util_1 = __importDefault(require("./upload.util"));
const tasks_repository_1 = require("../api/repository/tasks/tasks.repository");
const emailThreading_repository_1 = require("../api/repository/emailThreading/emailThreading.repository");
const emailThreading_repomodel_1 = require("../database/repomodels/emailThreading.repomodel");
// import {threadId} from 'worker_threads';
dotenv_1.default.config();
class EmailUtil {
    constructor() {
        mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
        this.notificationConfigurationRepository =
            new notificationConfiguration_repository_1.NotificationConfigurationRepository();
        this.settingsRepository = new settings_repository_1.SettingsRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.userRepository = new user_repository_1.UserRepository();
        this.debtorRepository = new debtor_repository_1.DebtorRepository();
        this.inboxRepository = new inbox_repository_1.InboxRepository();
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.notificationCountRepository = new notificationCount_repository_1.NotificationCountRepository();
        this.client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        client_1.default.setApiKey(process.env.SENDGRID_API_KEY);
        this.uploadUtil = new upload_util_1.default();
        this.taskRepository = new tasks_repository_1.TasksRepository();
        this.emailThreadingRepository = new emailThreading_repository_1.EmailThreadingRepository();
    }
    async sendInvitationLink(user, link) {
        const msg = {
            to: user.email,
            from: process.env.defaultEmail,
            subject: `${constants_util_1.default.ACCOUNT_INVITATION_SUBJECT}`,
            text: `Dear ${user.name},

             You've been invited to join our platform! To complete your account setup, please click the link below to set your password:

             ${link}

             If you didn't request this, you can safely ignore this email.

            Thank you,
            First Choice Debt Solutions`,
        };
        try {
            await mail_1.default.send(msg);
        }
        catch (error) {
            console.log(error.message);
            return error.message;
        }
    }
    async sendLink(user, text, subject) {
        const msg = {
            to: user.email,
            from: process.env.defaultEmail,
            subject: subject,
            text: text,
        };
        try {
            await mail_1.default.send(msg);
        }
        catch (error) {
            console.log(error.message);
            return error.message;
        }
    }
    async sendEmailOrSmsByEvent(value, caseId, paymentId, userId, taskId, debtorTemp) {
        const event = await this.notificationConfigurationRepository.getOne({ value });
        const threadId = (0, uuid_1.v4)();
        if (event) {
            const userPermissions = event.userPermission;
            let [user, debtor, creditor, caseTemp, payment, task] = await this.initializeValues(caseId, paymentId, userId, taskId);
            if (debtorTemp)
                debtor = debtorTemp;
            for (const userPermission of userPermissions) {
                if (userPermission.email_allowed && userPermission.email_template) {
                    const template = await this.getTemplate(userPermission.email_template);
                    if (!template)
                        continue;
                    const allValues = await this.getValues(template.content);
                    let content = template.content;
                    if (allValues.length) {
                        let replacements = await this.getPopulatedObject(event, debtor, creditor, caseTemp, user, payment, task, allValues);
                        if (Object.keys(replacements).length) {
                            const nestedObject = await this.unflat(replacements);
                            const compiledHtml = handlebars_1.default.compile(content);
                            content = compiledHtml(nestedObject);
                        }
                    }
                    const emails = await this.getEmail(caseTemp, userPermission.role);
                    if (emails) {
                        const from = template.from
                            ? template.from
                            : process.env.defaultEmail;
                        await this.sendEmail(emails, from, template.subject, content, null, null, caseId, threadId);
                        if (caseId) {
                            const time = new Date(common_util_1.default.getCurrentDate());
                            await case_util_1.default.addInHistory({
                                Username: user?.name || '',
                                Subject: template.subject,
                                From: from,
                                To: emails,
                                Content: content,
                                Time: time,
                                Action: 'EMAIL',
                            }, caseId);
                        }
                    }
                }
                if (userPermission.sms_allowed && userPermission.sms_template) {
                    const template = await this.getTemplate(userPermission.sms_template);
                    if (!template)
                        continue;
                    const allValues = await this.getValues(template.content);
                    let content = template.content;
                    if (allValues.length) {
                        let replacements = await this.getPopulatedObject(event, debtor, creditor, caseTemp, user, payment, task, allValues);
                        if (Object.keys(replacements).length) {
                            const nestedObject = await this.unflat(replacements);
                            const compiledContent = handlebars_1.default.compile(content);
                            content = compiledContent(nestedObject);
                        }
                    }
                    let phoneNumbers = await this.getPhone(caseTemp, userPermission.role);
                    if (phoneNumbers) {
                        const fromNumber = user?.twilioNo || process.env.TWILIO_CALLER_ID;
                        if (userPermission.role === 'Admin') {
                            for (const phone of phoneNumbers) {
                                await this.sendSms(content, phone, fromNumber);
                            }
                        }
                        else {
                            await this.sendSms(content, phoneNumbers, fromNumber);
                        }
                        if (caseId) {
                            const time = new Date(common_util_1.default.getCurrentDate());
                            await case_util_1.default.addInHistory({
                                Username: user?.name || '',
                                From: fromNumber,
                                To: phoneNumbers,
                                Content: content,
                                Time: time,
                                Action: 'SMS',
                            }, caseId);
                        }
                    }
                }
            }
        }
    }
    async sendEmailSmsToDebtorCreditor(caseData, userId, body, type, files, threadId, userName) {
        let { from, sendTo, subject, content, cc, signedUrls } = body;
        if (typeof signedUrls === 'string') {
            signedUrls = JSON.parse(signedUrls);
        }
        let reqThreadId = null;
        if (threadId) {
            reqThreadId = threadId;
        }
        else {
            threadId = (0, uuid_1.v4)();
        }
        const allValues = await this.getValues(content);
        if (allValues.length) {
            let [user, debtor, creditor, caseTemp, payment, task] = await this.initializeValues(caseData?._id, '', userId, '');
            let replacements = await this.getPopulatedObject(null, debtor, creditor, caseTemp, user, payment, task, allValues);
            if (Object.keys(replacements).length) {
                const nestedObject = await this.unflat(replacements);
                const compiledString = handlebars_1.default.compile(content);
                content = compiledString(nestedObject);
            }
        }
        const time = new Date(common_util_1.default.getCurrentDate());
        let attachments = [];
        switch (type) {
            case 'email':
                cc = JSON.parse(cc);
                for (const file of files) {
                    attachments.push({
                        content: file.buffer.toString('base64'),
                        filename: file.originalname,
                        type: file.mimetype,
                        disposition: 'attachment',
                    });
                }
                const data = await this.uploadUtil.awsS3FileUpload(files, false);
                for (const obj of data) {
                    const mimeType = common_util_1.default.getMimeType(obj.key);
                    obj.url = await this.uploadUtil.getS3FileSignedUrl(obj.key, mimeType, 60 * 60 * 24 * 365 * 10, process.env.s3BucketName);
                }
                signedUrls?.forEach(async (urlObj) => {
                    const byteArray = await this.uploadUtil.getPdfBytesFromS3(urlObj.key);
                    const base64Content = byteArray.length > 0
                        ? Buffer.from(byteArray).toString('base64')
                        : '';
                    const mimeType = common_util_1.default.getMimeType(urlObj.key);
                    attachments.push({
                        content: base64Content,
                        filename: urlObj.originalFileName,
                        type: mimeType,
                        disposition: 'attachment',
                    });
                });
                const result = await this.sendEmail(sendTo, from, subject, content, cc, attachments, caseData?._id, threadId, userId, userName);
                const updatedData = [...data, ...signedUrls];
                const uniqueAttachments = lodash_1.default.uniqBy(updatedData, item => `${item.key}-${item.originalFileName}`);
                if (result[0]) {
                    await case_util_1.default.addInHistory({
                        Username: userName,
                        Subject: subject,
                        From: from,
                        To: sendTo,
                        CC: cc,
                        Content: content,
                        Time: time,
                        Action: 'EMAIL',
                        Attachments: uniqueAttachments,
                    }, caseData?._id);
                    const emailData = {
                        from,
                        to: sendTo,
                        subject,
                        text: content,
                        textAsHtml: content,
                        cc: cc,
                        attachments: uniqueAttachments,
                    };
                    if (reqThreadId) {
                        this.createInbox(caseData, 'sent', emailData, threadId, userId, userName, 'EMAIL', true);
                    }
                    else {
                        this.createInbox(caseData, 'sent', emailData, threadId, userId, userName, 'EMAIL');
                    }
                }
                return result;
            case 'sms':
                const smsResult = await this.sendSms(content, sendTo, from);
                const smsData = {
                    from: from,
                    to: sendTo,
                    text: content,
                    textAsHtml: content,
                };
                this.createNewInbox(smsData, caseData, 'sent', threadId, userId, userName, null, null, 'SMS');
                if (smsResult[0]) {
                    await case_util_1.default.addInHistory({
                        Username: userName,
                        From: from,
                        To: sendTo,
                        Content: content,
                        Time: time,
                        Action: 'SMS',
                    }, caseData?._id);
                }
                return smsResult;
            case 'compose':
                cc = JSON.parse(cc);
                for (const file of files) {
                    attachments.push({
                        content: file.buffer.toString('base64'),
                        filename: file.originalname,
                        type: file.mimetype,
                        disposition: 'attachment',
                    });
                }
                const composeData = await this.uploadUtil.awsS3FileUpload(files, false);
                for (const obj of composeData) {
                    const mimeType = common_util_1.default.getMimeType(obj.key);
                    obj.url = await this.uploadUtil.getS3FileSignedUrl(obj.key, mimeType, 60 * 60 * 24 * 365 * 10, process.env.s3BucketName);
                }
                const resultCompose = await this.sendEmail(sendTo, from, subject, content, cc, attachments, '', threadId, userId, userName);
                const composeEmailData = {
                    from,
                    to: sendTo,
                    subject,
                    text: content,
                    textAsHtml: content,
                    cc: cc,
                    attachments: composeData,
                };
                if (reqThreadId) {
                    const composeEmail = await this.createInbox(null, 'received', composeEmailData, threadId, userId, userName, 'EMAIL', true);
                }
                else {
                    const composeEmail = await this.createInbox(null, 'sent', composeEmailData, threadId, userId, userName, 'EMAIL');
                }
                return resultCompose;
        }
        return [true, ''];
    }
    async createInbox(caseTemp, type, emailData, threadId, userId, userName, medium, check) {
        const newMessage = new inbox_repomodel_1.Inbox();
        const newNotification = new notification_repomodel_1.Notification();
        const newNotificationCount = new notificationCount_repomodel_1.NotificationCount();
        let res = null;
        if (type == 'received' || check) {
            type = check ? 'sent' : 'received';
            console.log('ABC');
            const existingInbox = await this.inboxRepository.getAllWithoutPagination({
                threadId,
            }, undefined, undefined, { _id: -1 });
            // const existingAttachments = existingInbox[0].attachments || [];
            const mergedAttachments = [
                // ...existingAttachments,
                ...emailData.attachments,
            ];
            const previousMessages = [
                existingInbox[0]._id,
                ...existingInbox[0]?.previousMessages,
            ];
            const uniqueAttachments = lodash_1.default.uniqBy(mergedAttachments, item => `${item.key}-${item.originalFileName}`);
            // await this.inboxRepository.updateById<IInbox>(existingInbox._id, {
            //   text: existingInbox.text + emailData.text,
            //   textAsHtml: existingInbox.textAsHtml + emailData.textAsHtml,
            //   attachments: uniqueAttachments,
            // });
            res = await this.createNewInbox(emailData, caseTemp, type, threadId, userId, userName, previousMessages, uniqueAttachments, medium);
            const emailThreading = {
                threadId: threadId,
                previousMessages: res._id,
            };
            await this.upsertEmailThreading(emailThreading);
            console.log('Create New Inbox response when Response', res);
        }
        else {
            res = await this.createNewInbox(emailData, caseTemp, type, threadId, userId, userName, [], null, medium);
            console.log('Create New Inbox response when Create', res);
            const emailThreading = {
                threadId: threadId,
                firstInboxMessage: res._id,
                previousMessages: [res._id],
                userId: userId,
                caseId: caseTemp?._id,
            };
            await this.upsertEmailThreading(emailThreading);
            return res;
        }
        if (caseTemp) {
            newNotification.caseId = caseTemp._id;
            newNotification.text = this.formatText(caseTemp.creditor.businessInformation.companyName);
        }
        newNotification.type = 'EMAIL';
        newNotification.userId = userId;
        newNotification.inboxId = res._id;
        // await this.notificationRepository.create<INotification>(
        //   newNotification as any
        // );
        const currentCount = await this.notificationCountRepository.getOne({
            userId: userId,
        });
        if (!check) {
            newNotificationCount.userId = userId;
            newNotificationCount.count = currentCount
                ? (currentCount?.count || 0) + 1
                : 1;
            newNotificationCount.emailCount = currentCount
                ? (currentCount?.emailCount || 0) + 1
                : 1;
            await this.notificationCountRepository.upsert({ userId }, newNotificationCount);
        }
        return newNotification;
    }
    async createNewInbox(emailData, caseTemp, type, threadId, userId, userName, previousMessages, uniqueAttachments, medium, senderFullName) {
        const newMessage = new inbox_repomodel_1.Inbox();
        if (caseTemp) {
            newMessage.caseCode = caseTemp.caseCode;
            newMessage.creditorCompanyName =
                caseTemp.creditor.businessInformation.companyName;
            newMessage.debtorCompanyName =
                caseTemp.debtor.businessInformation.companyName;
            newMessage.negotiatorName = caseTemp.negotiator;
            newMessage.caseId = String(caseTemp._id);
            newMessage.debtorId = String(caseTemp.debtor._id);
        }
        newMessage.cc = emailData.cc;
        newMessage.from = emailData.from;
        newMessage.subject = emailData.subject;
        newMessage.text = emailData.text;
        newMessage.textAsHtml = emailData.textAsHtml;
        if (senderFullName)
            newMessage.senderName = senderFullName;
        newMessage.to = emailData.to;
        newMessage.type = type;
        newMessage.medium = medium;
        newMessage.attachments = uniqueAttachments || emailData.attachments;
        newMessage.threadId = threadId;
        newMessage.userId = userId;
        newMessage.userName = userName;
        newMessage.previousMessages = previousMessages;
        return await this.inboxRepository.create(newMessage);
    }
    formatText(text) {
        return `EMAIL received for ${text}`;
    }
    async emailThreading() { }
    async sendEmailOrSmsByEventForCommission(value, payment) {
        const event = await this.notificationConfigurationRepository.getOne({ value });
        if (event) {
            const userPermissions = event.userPermission;
            let debtor = await this.debtorRepository.getById(payment.debtorId);
            for (const userPermission of userPermissions) {
                if (userPermission.email_allowed && userPermission.email_template) {
                    const template = await this.getTemplate(userPermission.email_template);
                    if (!template)
                        continue;
                    const allValues = await this.getValues(template.content);
                    let content = template.content;
                    if (allValues.length) {
                        let replacements = await this.getPopulatedObject(event, debtor, null, null, null, payment, null, allValues);
                        if (Object.keys(replacements).length) {
                            const nestedObject = await this.unflat(replacements);
                            const compiledHtml = handlebars_1.default.compile(content);
                            content = compiledHtml(nestedObject);
                        }
                    }
                    await this.sendEmail(process.env.defaultEmail, template.from ? template.from : process.env.defaultEmail, template.subject, content);
                }
                if (userPermission.sms_allowed && userPermission.sms_template) {
                    // const template = await this.getTemplate(userPermission.sms_template);
                    // if (!template) continue;
                    // const allValues = await this.getValues(template.content);
                    // if (!allValues.length) continue;
                    // let replacements = await this.getPopulatedObject(
                    //   event,
                    //   debtor,
                    //   null,
                    //   null,
                    //   null,
                    //   payment,
                    //   allValues
                    // );
                    // if (!Object.keys(replacements).length) continue;
                    // const nestedObject = await this.unflat(replacements);
                    // const compiledContent = handlebars.compile(template.content);
                    // const text = compiledContent(nestedObject);
                    // await this.sendSms(text, '');
                }
            }
        }
    }
    async getEmail(caseTemp, role) {
        switch (role) {
            case 'Admin':
                const users = await this.userRepository.getAllWithoutPagination({
                    role: role,
                });
                const emails = users.map(user => {
                    return user.email;
                });
                return emails?.length ? emails : null;
            case 'Debtor':
                return caseTemp?.debtor?.basicInformation?.email
                    ? caseTemp.debtor.basicInformation.email
                    : null;
            case 'Creditor':
                return caseTemp?.creditor?.basicInformation?.email
                    ? caseTemp.creditor.basicInformation.email
                    : null;
            case 'Case Manager':
                const manager = await this.userRepository.getById(caseTemp.managerId);
                return manager?.email ? manager.email : null;
            case 'Negotiator':
                const negotiator = await this.userRepository.getById(caseTemp.negotiatorId);
                return negotiator?.email ? negotiator.email : null;
        }
    }
    async getPhone(caseTemp, role) {
        switch (role) {
            case 'Admin':
                const users = await this.userRepository.getAllWithoutPagination({
                    role: role,
                });
                const phoneNumbers = users.map(user => {
                    return user.phone;
                });
                return phoneNumbers?.length ? phoneNumbers : null;
            case 'Debtor':
                return caseTemp?.debtor?.basicInformation?.phone
                    ? caseTemp.debtor.basicInformation.phone
                    : null;
            case 'Creditor':
                return caseTemp?.creditor?.basicInformation?.phone
                    ? caseTemp.creditor.basicInformation.phone
                    : null;
            case 'Case Manager':
                const manager = await this.userRepository.getById(caseTemp.managerId);
                return manager?.phone ? manager.phone : null;
            case 'Negotiator':
                const negotiator = await this.userRepository.getById(caseTemp.negotiatorId);
                return negotiator?.phone ? negotiator.phone : null;
            default:
                break;
        }
    }
    async unflat(replacements) {
        const nestedObject = {};
        Object.keys(replacements).forEach(key => {
            lodash_1.default.set(nestedObject, key, replacements[key]);
        });
        return nestedObject;
    }
    async getTemplate(id) {
        const result = await this.settingsRepository.getOne({
            notificationTemplates: {
                $elemMatch: {
                    templateId: id,
                },
            },
        }, undefined, 'notificationTemplates.$');
        return result?.notificationTemplates?.length
            ? result?.notificationTemplates[0]
            : null;
    }
    async initializeValues(caseId, paymentId, userId, taskId) {
        let debtor = null, creditor = null, user = null, payment = null, caseTemp = null, task = null;
        if (caseId) {
            const result = await this.caseRepository.getById(caseId, undefined, undefined, ['debtor', 'creditor']);
            caseTemp = result;
            debtor = result.debtor;
            creditor = result.creditor;
        }
        if (paymentId) {
            const result = await this.paymentRepository.getById(paymentId, undefined, undefined, {
                path: 'caseId',
                populate: ['debtor', 'creditor'],
            });
            payment = result;
            caseTemp = result.caseId;
            debtor = result.caseId?.debtor;
            creditor = result.caseId?.creditor;
        }
        if (userId) {
            user = await this.userRepository.getById(userId);
        }
        if (taskId)
            task = await this.taskRepository.getById(taskId);
        return [user, debtor, creditor, caseTemp, payment, task];
    }
    async getValues(html) {
        const regex = /\{\{([^}]+)\}\}/g;
        const matches = [];
        let match = [];
        while ((match = regex.exec(html)) !== null) {
            matches.push(match[1].trim());
        }
        return matches;
    }
    async getPopulatedObject(event, debtor, creditor, caseTemp, user, payment, task, keys) {
        // keys = ['debtor.basicInformation.fullName', 'case.totalDebt'];
        const populatedObj = {};
        for (const key of keys) {
            const [beforeDot, ...afterDot] = key.split('.');
            const joinedString = afterDot.join('.');
            switch (beforeDot) {
                case 'case':
                    populatedObj[key] = lodash_1.default.get(caseTemp, joinedString) ?? '';
                    break;
                case 'debtor':
                    populatedObj[key] = lodash_1.default.get(debtor, joinedString) ?? '';
                    break;
                case 'creditor':
                    populatedObj[key] = lodash_1.default.get(creditor, joinedString) ?? '';
                    break;
                case 'payment':
                    populatedObj[key] = lodash_1.default.get(payment, joinedString) ?? '';
                    break;
                case 'event':
                    populatedObj[key] = lodash_1.default.get(event, joinedString) ?? '';
                    break;
                case 'user':
                    populatedObj[key] = lodash_1.default.get(user, joinedString) ?? '';
                    break;
                case 'task':
                    populatedObj[key] = lodash_1.default.get(task, joinedString) ?? '';
                    break;
                default:
                    populatedObj[key] = '';
                    break;
            }
        }
        return populatedObj;
    }
    async sendEmail(to, from, subject, content, cc, attachments, caseId, threadId, userId, userName) {
        let headers = {};
        const threadCheck = await this.inboxRepository.getOne({
            threadId: threadId,
        });
        if (Array.isArray(cc) && cc.includes(String(to)))
            return [
                false,
                "'To' email address should not be included in the CC list.",
            ];
        const bin = await this.getVerifySender(from);
        console.log(bin);
        if (!bin[0])
            return [false, bin[1]];
        if (bin === 'debtor' && caseId) {
            const caseTemp = await this.caseRepository.getById(caseId, '_id', undefined, {
                path: 'debtor',
                select: [
                    'businessInformation.companyName',
                    'businessInformation.EIN',
                ],
            });
            if (caseTemp.debtor?.businessInformation?.companyName)
                subject += ` ${caseTemp.debtor.businessInformation.companyName}`;
            if (caseTemp.debtor?.businessInformation?.EIN)
                subject += ` ${caseTemp.debtor.businessInformation.EIN}`;
            const referenceHeader = `<caseId-${caseId}&userId-${userId}&userName-${userName}&threadId-${threadId}@yourdomain.com>`;
            headers['References'] = referenceHeader;
            // headers['In-Reply-To'] = referenceHeader;
            // headers['Message-ID'] = referenceHeader;
            console.log('This is Reference: ', headers['References']);
        }
        if (bin === 'user') {
            if (!threadCheck) {
                const user = await this.userRepository.getOne({ email: from }, '_id name', undefined);
                user
                    ? (subject += ` First Choice-DMS ${user.name}`)
                    : (subject += ` First Choice-DMS`);
            }
            const referenceHeader = `<caseId-${caseId}&userId-${userId}&userName-${userName}&threadId-${threadId}@yourdomain.com>`;
            headers['References'] = referenceHeader;
            // headers['In-Reply-To'] = referenceHeader;
            headers['Message-ID'] = referenceHeader;
            console.log('This is Reference: ', headers['References']);
        }
        // const thread = `<threadId-${threadId}@yourdomain.com>`;
        const msg = {
            to: to,
            from: from, // Use the email address or domain you verified above
            subject: subject,
            html: content,
        };
        if (Object.keys(headers).length)
            msg['headers'] = headers;
        if (cc?.length) {
            msg['cc'] = cc;
        }
        if (attachments?.length) {
            msg['attachments'] = attachments;
        }
        try {
            await mail_1.default.send(msg);
            return [true, `Your email is delivered successfully`];
        }
        catch (error) {
            console.log(error.response.body.errors);
            return [false, 'Could not send email'];
        }
    }
    async sendSms(body, phone, from) {
        try {
            const code = process.env.environment === 'prod' ? '+1' : '+92';
            phone = code + phone;
            const result = await this.client.messages.create({
                body: body,
                from: '+1' + from, //the phone number provided by Twillio
                to: phone, // your own phone number
            });
            if (result.sid) {
                return [true, `Your sms is delivered successfully`];
            }
            return [false, 'Could not send sms'];
        }
        catch (error) {
            console.log(error);
            return [false, error.message];
        }
    }
    async generatePdfFromHtml(htmlString) {
        const browser = await puppeteer_core_1.default.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(htmlString, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
    }
    async checkIfConfirmationEmail(subject, text) {
        const confirmationKeywords = [
            'confirmation',
            'forwarding confirmation',
            'automatically forward',
            'forward mail',
            'confirm request',
            'click the link to confirm',
        ];
        const checkSubject = confirmationKeywords.some(keyword => subject.toLowerCase().includes(keyword));
        const checkText = confirmationKeywords.some(keyword => text.toLowerCase().includes(keyword));
        if (checkSubject || checkText)
            return true;
        return false;
    }
    async getConfirmationLinkFromEmailText(text) {
        const linkRegex = /https:\/\/[^\s]+/g;
        const links = text.match(linkRegex);
        // Return the first match if found
        if (links && links.length > 0) {
            return links[0];
        }
        return null;
    }
    async getVerifySender(data) {
        const request = {
            url: `/v3/verified_senders`,
            method: 'GET',
        };
        const result = await client_1.default.request(request);
        let email = [];
        if (result[0]?.body?.results?.length) {
            email = result[0].body.results.filter(temp => {
                // console.log('result[0].body.results: ', result[0].body.results);
                return temp.from_email === data;
            });
        }
        console.log('email: ', email);
        if (!email?.length)
            return [false, 'User is not present on Send Grid'];
        let bin = '';
        if (email[0]?.nickname.includes('debtor') && email[0]?.verified)
            bin = 'debtor';
        if (!email[0]?.nickname.includes('debtor') && email[0]?.verified)
            bin = 'user';
        return bin ? bin : [false, 'User is not verified'];
    }
    async sendEmailIfDebtorGetsAdditionalDebt(cases, debtor, creditors) {
        const remaining = cases.reduce((sum, item) => sum + item.remaining, 0);
        if (remaining) {
            for (const creditor of creditors) {
                const content = `Dear ${creditor.creditorName},
  
        We hope this message finds you well.
        
        We are writing to inform you that the debtor, ${debtor.basicInformation.fullName}, has currently taken on debt from a total of ${cases.length} creditors. The total outstanding debt across these creditors amounts to ${remaining}.
        
        Please feel free to reach out if you require any further details or have any questions regarding this matter.
        
        Thank you for your attention.
        
        Best regards,
        First Choice Debt Solutions`;
                const to = creditor.creditorEmail;
                const from = process.env.defaultEmail;
                const subject = `Notification Regarding Debtor's Additional Debt`;
                await this.sendEmail(to, from, subject, content);
            }
        }
    }
    async sendEmailIfDebtorPaysDebt(caseTemp, debtor, creditors) {
        for (const creditor of creditors) {
            const content = `Dear ${creditor.creditorName},

      We are pleased to inform you that the debtor, ${debtor.basicInformation.fullName}, has successfully paid their debt. The total amount paid is ${caseTemp.remaining}.

      If you have any questions or require further details, feel free to reach out. We appreciate your continued cooperation.
            
      Thank you for your attention.
      
      Best regards,
      First Choice Debt Solutions`;
            const to = creditor.creditorEmail;
            const from = process.env.defaultEmail;
            const subject = `Notification Regarding Debtor's Paid Debt`;
            await case_util_1.default.addInHistory({
                Subject: subject,
                From: from,
                To: to,
                Content: content,
                Time: new Date(common_util_1.default.getCurrentDate()),
                Action: 'EMAIL',
            }, creditor.caseId);
            await this.sendEmail(to, from, subject, content);
        }
    }
    async percentageChangeEmail(incDec, posNeg, previousMonth, previousYear, currentMonth, currentYear, creditors, debtorName, previousSale, currentSale, percentage, caseId) {
        for (const creditor of creditors) {
            const content = `Dear ${creditor.creditorName},

      I hope this email finds you well.
      
      I wanted to provide you with an update on the sales performance of ${debtorName} for ${currentMonth}, ${currentYear}. We have observed a ${posNeg} change in sales compared to the previous month.
      
      Sales for ${currentMonth}, ${currentYear}: $${currentSale}
      Sales for ${previousMonth}, ${previousYear}: $${previousSale}
      Percentage Change: ${incDec} of ${percentage}%
      This growth reflects the recent business activities, and we are closely monitoring performance to ensure that all financial commitments are managed accordingly.
      
      If you have any questions or would like further details, feel free to reach out.
      
      Thank you for your continued partnership.
      
      Best regards,
      First Choice Debt Solutions`;
            const to = creditor.creditorEmail;
            const from = process.env.defaultEmail;
            const subject = `Notice of Sales Performance for ${currentMonth}, ${currentYear}`;
            await case_util_1.default.addInHistory({
                Subject: subject,
                From: from,
                To: to,
                Content: content,
                Time: new Date(common_util_1.default.getCurrentDate()),
                Action: 'EMAIL',
            }, caseId);
            await this.sendEmail(to, from, subject, content);
        }
    }
    async sendEmailToDebtorForInitialOverView(debtor, videoLink) {
        const content = `\t\t Dear ${debtor.basicInformation.fullName},

      We hope this message finds you well!

      We are excited to share a video that highlights the exclusive benefits tailored just for you. This video provides insights into how you can maximize your experience with us and take full advantage of what we offer.

       \nYou can watch the video here: ${videoLink}.\n\n

      \n If you have any questions or would like to discuss these benefits further, please do not hesitate to reach out. We are here to help! \n

           \nThank you for being a valued member of our community.\n 

      \tBest regards,\n 
      \tFirst Choice Debt Solutions`;
        const to = debtor.basicInformation?.email;
        const from = process.env.defaultEmail;
        const subject = `Discover Your Exclusive Benefits with DMS`;
        await this.sendEmail(to, from, subject, content);
    }
    async sendEmailPausePayment(userName, event, payments) {
        for (const payment of payments) {
            await this.sendEmailOrSmsByEvent(event, payment.caseId._id, '', userName);
        }
    }
    async upsertEmailThreading(data) {
        const existingThread = await this.emailThreadingRepository.getOne({
            threadId: data.threadId,
        });
        if (existingThread) {
            const updatedMessages = [
                data.previousMessages,
                ...existingThread.previousMessages,
            ];
            return await this.emailThreadingRepository.updateById(existingThread._id, {
                previousMessages: updatedMessages,
                isCompleted: false,
            });
        }
        else {
            const emailThreading = new emailThreading_repomodel_1.EmailThreading();
            const validatedEmail = dataCopier_util_1.DataCopier.copy(emailThreading, data);
            return await this.emailThreadingRepository.upsert({ threadId: data.threadId }, validatedEmail);
        }
    }
    async emailThreadingCount(populateFilter, userId) {
        const emailThreading = await this.emailThreadingRepository.getAllWithoutPagination({ isDeleted: { $ne: true }, userId: userId }, undefined, undefined, { _id: -1 }, populateFilter);
        const filteredThreads = emailThreading.filter((thread) => thread.firstInboxMessage);
        return filteredThreads.length;
    }
}
exports.default = new EmailUtil();
//# sourceMappingURL=email.util.js.map