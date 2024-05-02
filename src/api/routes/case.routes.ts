import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import caseController from '../controllers/case/case.controller';
import caseValidate from '../../validators/case.validate';
const router = Router();

router.post(
  '/createCase',
  authorize.validateAuth,
  caseValidate.validateCase,
  caseController.createCase
);

router.get('/getAllCases', authorize.validateAuth, caseController.getAllCases);
router.get(
  '/getCaseById/:id',
  authorize.validateAuth,
  caseController.getCaseById
);

export default router;
