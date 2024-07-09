import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import caseController from '../controllers/case/case.controller';
import caseValidate from '../../middleware/validators/case.validate';
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
router.put(
  '/updateCase/:id',
  authorize.validateAuth,
  caseValidate.updateCase,
  caseController.updateCase
);
router.put(
  '/updateCaseAbout/:id',
  authorize.validateAuth,
  caseValidate.validateCaseAbout,
  caseController.updateCaseAbout
);
router.delete(
  '/deleteCase/:id',
  authorize.validateAuth,
  caseController.deleteCase
);

export default router;
