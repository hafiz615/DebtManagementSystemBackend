import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import caseValidate from '../../middleware/validators/case.validate';
import emailController from '../controllers/email/email.controller';
import multer from 'multer';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {fieldSize: 50 * 1024 * 1024},
});

const sendEmailFields = upload.fields([
  {name: 'sendTo'},
  {name: 'from'},
  {name: 'content'},
  {name: 'subject'},
  {name: 'cc'},
  {name: 'files'},
  {name: 'signedUrls'},
]);

router.post(
  '/sendSmsEmailDebtorCreditor/:id',
  authorize.validateAuth,
  sendEmailFields,
  caseValidate.sendSmsEmailDebtorCreditor,
  emailController.sendSmsEmailDebtorCreditor
); // not in current use

router.post('/sendGridParseEmail', upload.any(), emailController.sendGridEmail);
router.get('/getAllLinks', authorize.validateAuth, emailController.getAllLinks);
router.delete(
  '/deleteLink/:id',
  authorize.validateAuth,
  emailController.linkVerified
);

router.post(
  '/threading',
  authorize.validateAuth,
  emailController.emailThreading
);

router.get(
  '/eachThreadingMails/:id',
  authorize.validateAuth,
  emailController.eachThreadingMails
);

export default router;
