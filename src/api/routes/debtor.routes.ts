import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import debtorController from '../controllers/debtor/debtor.controller';
import debtor from '../../middleware/validators/debtor.validate';
import multer from 'multer';
import debtorValidate from '../../middleware/validators/debtor.validate';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({storage});

router.post('/getDebtor', authorize.validateAuth, debtorController.getDebtor);
router.post(
  '/listing/details/:id',
  authorize.validateAuth,
  debtorController.listingDetails
);
router.post(
  '/listing/search',
  authorize.validateAuth,
  debtorController.searchListing
);
router.put(
  '/updateDebtor/:id',
  authorize.validateAuth,
  debtor.validateDebtor,
  debtorController.updateDebtor
);
// router.post(
//   '/createVault/:id',
//   authorize.validateAuth,
//   debtorController.createVault
// );
router.get(
  '/retryAuth/:id',
  authorize.validateAuth,
  debtorController.retryAuth
);
router.get(
  '/retryCapture/:id',
  authorize.validateAuth,
  debtorController.retryCapture
);
router.get(
  '/getAllDebtors',
  authorize.validateAuth,
  debtorController.getAllDebtors
);
router.post(
  '/createDebtor',
  authorize.validateAuth,
  debtor.createDebtor,
  debtorController.createDebtor
);
router.post(
  '/addDocumentsToDebtor/:id',
  authorize.validateAuth,
  debtor.addDocumentsToDebtor,
  debtorController.addDocumentsToDebtor
);
router.get(
  '/getLumpSumAmount/:id',
  authorize.validateAuth,
  debtorController.getLumpSumAmount
);

router.get(
  '/getFullProfitSettlement/:id',
  authorize.validateAuth,
  debtorController.getFullProfitSettlement
);

router.get(
  '/getLumpSumJustifications/:id',
  authorize.validateAuth,
  debtorController.getLumpSumJustifications
);

router.get(
  '/getFullProfitJustifications/:id',
  authorize.validateAuth,
  debtorController.getFullProfitJustifications
);
router.post(
  '/getExtractedFields/:id',
  authorize.validateAuth,
  debtorController.getExtractedFields
);

router.post(
  '/createMultipleDebtors',
  authorize.validateAuth,
  debtor.createMultipleDebtors,
  debtorController.createMultipleDebtors
);

router.get(
  '/getStatementsSummary/:id',
  authorize.validateAuth,
  debtorController.getStatementsSummary
);

router.get(
  '/getStatementsSummaryWithPf/:id',
  authorize.validateAuth,
  debtorController.getStatementsSummaryWithPf
);

router.get(
  '/getDailyCashFlows/:id',
  authorize.validateAuth,
  debtorController.getDailyCashFlows
);

router.put(
  '/updateDebtorBulk/:id',
  authorize.validateAuth,
  debtor.updateDebtorBulk,
  debtorController.updateDebtorBulk
);

router.post(
  '/addDebtorAccount/:id',
  authorize.validateAuth,
  debtor.addDebtorAccount,
  debtorController.addDebtorAccount
);

router.post(
  '/add-debtor-account/:id',
  debtor.addDebtorAccount,
  debtorController.addDebtorAccount
);
router.put(
  '/update-debtor-account/:id',
  debtor.updateDebtorAccount,
  debtorController.updateDebtorAccount
);
router.delete(
  '/delete-debtor-account/:id',
  debtor.deleteDebtorAccount,
  debtorController.deleteDebtorAccount
);
router.get(
  '/getDebtorSummery',
  authorize.validateAuth,
  debtorController.getDebtorSummery
);
router.post(
  '/saveWeeklyBudgetValues/:id',
  authorize.validateAuth,
  debtor.saveWeeklyBudgetValues,
  debtorController.saveWeeklyBudgetValues
);
router.post(
  '/getMcaAndFinancials',
  authorize.validateAuth,
  debtorController.getMcaAndFinancials
);

router.post(
  '/analyzeAndGetSettlementRanges/:id',
  authorize.validateAuth,
  debtorController.analyzeAndGetSettlementRanges
);

router.get(
  '/getSummeryVideo/:id',
  authorize.validateAuth,
  debtorController.generateVideoWithGenAi
);

router.post(
  '/addPaymentPlan/:id',
  authorize.validateAuth,
  debtorController.addPaymentPlan
);
router.post(
  '/addManualPayment',
  authorize.validateAuth,
  debtor.validateManualPayment,
  debtorController.addManualPayment
);

router.put(
  '/updateWeeklyBudget/:id',
  authorize.validateAuth,
  debtor.updateWeeklyBudget,
  debtorController.updateWeeklyBudget
);

router.get(
  '/getManualPayments/:id',
  authorize.validateAuth,
  debtorController.getManualPayments
);

router.post(
  '/revertPayments/:id',
  authorize.validateAuth,
  debtor.revertPayment,
  debtorController.revertPayments
);
// To Pass the Different Files in the Extracted Data
const uploadFields = upload.fields([
  {name: 'mcaDocuments'},
  {name: 'otherDocuments'},
  {name: 'bankStatementDocuments'},
  {name: 'lawsuitDocuments'},
]);

router.post(
  '/get-extracted-data',
  uploadFields,
  debtorController.getExtractFieldsAndDebtor
);

router.get(
  '/get-debtor-extracted-data/:id',
  debtorController.getDebtorExtractedFields
);

router.get('/getClientSyncEmail/:id', debtorController.getClientSyncEmail);

router.post(
  '/clientSync/:id',
  debtorValidate.syncDebtorEmail,
  debtorController.clientSync
);

router.get(
  '/client-financial-summary/:id',
  debtorController.clientFinancialSummary
);
export default router;
