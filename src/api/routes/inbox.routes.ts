import {Router} from 'express';
import inboxValidate from '../../middleware/validators/inbox.validate';
import inboxController from '../controllers/inbox/inbox.controller';
import authorize from '../../middleware/authorize.middleware';
import caseValidate from '../../middleware/validators/case.validate';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({storage});

const draftEmailFields = upload.fields([
  {name: 'sendTo'},
  {name: 'from'},
  {name: 'caseId'},
  {name: 'content'},
  {name: 'subject'},
  {name: 'cc'},
  {name: 'files'},
]);

const router = Router();

router.post(
  '/getAllMessages',
  authorize.validateAuth,
  inboxController.getAllMessages
);

router.put(
  '/markAsRead/:id',
  authorize.validateAuth,
  inboxController.markAsRead
);

router.post(
  '/createEmailDraft',
  authorize.validateAuth,
  draftEmailFields,
  inboxController.createEmailDraft
);

router.delete(
  '/deleteDraftEmail/:id',
  authorize.validateAuth,
  inboxController.deleteDraftEmail
);

router.put(
  '/updateDraftEmail/:id',
  authorize.validateAuth,
  draftEmailFields,
  inboxController.updateDraftEmail
);

router.post(
  '/createDraft',
  authorize.validateAuth,
  inboxController.createDraft
);

router.delete(
  '/deleteDraft/:id',
  authorize.validateAuth,
  inboxController.deleteDraftEmail
);

router.put(
  '/updateDraft/:id',
  authorize.validateAuth,
  inboxController.updateDraftSms
);

router.put(
  '/inboxStatus/:id',
  authorize.validateAuth,
  inboxController.inboxStatus
);

router.post('/getSms', authorize.validateAuth, inboxController.getSms);

export default router;
