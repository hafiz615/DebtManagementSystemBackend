import {Router} from 'express';
import inboxValidate from '../../middleware/validators/inbox.validate';
//import inboxController from '../controllers/inbox/inbox.controller';
import draftController from '../controllers/draft/draft.controller';
import authorize from '../../middleware/authorize.middleware';

const router = Router();

router.post(
  '/getAllDraftMessages',
  authorize.validateAuth,
  draftController.getAllDraftMessages
);

router.post(
  '/createEmailDraft/:caseId',
  authorize.validateAuth,
  draftController.createEmailDraft
);

export default router;
