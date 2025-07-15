"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authorize_middleware_1 = __importDefault(require("../../middleware/authorize.middleware"));
const debtor_controller_1 = __importDefault(require("../controllers/debtor/debtor.controller"));
const debtor_validate_1 = __importDefault(require("../../middleware/validators/debtor.validate"));
const multer_1 = __importDefault(require("multer"));
const debtor_validate_2 = __importDefault(require("../../middleware/validators/debtor.validate"));
const router = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.post('/getDebtor', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtor);
router.post('/listing/details/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.listingDetails);
router.post('/listing/search', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.searchListing);
router.put('/updateDebtor/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.validateDebtor, debtor_controller_1.default.updateDebtor);
// router.post(
//   '/createVault/:id',
//   authorize.validateAuth,
//   debtorController.createVault
// );
router.post('/retryAuth/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.retryPayment, debtor_controller_1.default.retryAuth);
router.post('/retryCapture/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.retryPayment, debtor_controller_1.default.retryCapture);
router.get('/getAllDebtors', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getAllDebtors);
router.post('/createDebtor', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.createDebtor, debtor_controller_1.default.createDebtor);
router.post('/addDocumentsToDebtor/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.addDocumentsToDebtor, debtor_controller_1.default.addDocumentsToDebtor);
router.get('/getLumpSumAmount/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getLumpSumAmount);
router.get('/getFullProfitSettlement/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getFullProfitSettlement);
router.get('/getLumpSumJustifications/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getLumpSumJustifications);
router.get('/getFullProfitJustifications/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getFullProfitJustifications);
router.post('/getExtractedFields/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getExtractedFields);
router.post('/createMultipleDebtors', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.createMultipleDebtors, debtor_controller_1.default.createMultipleDebtors);
router.get('/getStatementsSummary/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getStatementsSummary);
router.get('/getStatementsSummaryWithPf/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getStatementsSummaryWithPf);
router.get('/getDailyCashFlows/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDailyCashFlows);
router.put('/updateDebtorBulk/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.updateDebtorBulk, debtor_controller_1.default.updateDebtorBulk);
router.post('/addDebtorAccount/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.addDebtorAccount, debtor_controller_1.default.addDebtorAccount);
router.post('/add-debtor-account/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.addDebtorAccount, debtor_controller_1.default.addDebtorAccount);
router.put('/update-debtor-account/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.updateDebtorAccount, debtor_controller_1.default.updateDebtorAccount);
router.delete('/delete-debtor-account/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.deleteDebtorAccountDebtorPortal, debtor_controller_1.default.deleteDebtorAccount);
router.get('/getDebtorSummery', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtorSummery);
router.post('/saveWeeklyBudgetValues/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.saveWeeklyBudgetValues, debtor_controller_1.default.saveWeeklyBudgetValues);
router.post('/getMcaAndFinancials', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getMcaAndFinancials);
router.post('/analyzeAndGetSettlementRanges/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.analyzeAndGetSettlementRanges);
router.get('/getSummeryVideo/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.generateVideoWithGenAi);
router.post('/addPaymentPlan/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.addPaymentPlan);
router.post('/addManualPayment', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.validateManualPayment, debtor_controller_1.default.addManualPayment);
router.put('/updateWeeklyBudget/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.updateWeeklyBudget, debtor_controller_1.default.updateWeeklyBudget);
router.get('/getManualPayments/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getManualPayments);
router.post('/revertPayments/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.revertPayment, debtor_controller_1.default.revertPayments);
// To Pass the Different Files in the Extracted Data
const uploadFields = upload.fields([
    { name: 'mcaDocuments' },
    { name: 'otherDocuments' },
    { name: 'bankStatementDocuments' },
    { name: 'lawsuitDocuments' },
]);
router.post('/get-extracted-data', authorize_middleware_1.default.validateAuth, uploadFields, debtor_controller_1.default.getExtractFieldsAndDebtor);
router.get('/get-debtor-extracted-data/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtorExtractedFields);
router.get('/getClientSyncEmail/:id', debtor_controller_1.default.getClientSyncEmail);
router.post('/clientSync/:id', debtor_validate_2.default.syncDebtorEmail, debtor_controller_1.default.clientSync);
router.get('/client-financial-summary/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.clientFinancialSummary);
router.post('/create-invoice', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.addDebtorInvoice, debtor_controller_1.default.addDebtorInvoice);
router.post('/pauseDebtorPayments/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.pauseDebtorPayments);
router.get('/getDebtorPayments/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtorPayments);
router.get('/getToken/:id', debtor_controller_1.default.getToken);
router.post('/getTopPayees/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.getTopPayees, debtor_controller_1.default.getTopPayees);
router.post('/updateCommision/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.updateCommisionPercentage, debtor_controller_1.default.updateCommisionPercentage);
router.get('/debtorCreditorPaymentPlanDetail/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.debtorCreditorPaymentPlanDetail);
router.delete('/deleteDebtorAccount/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.deleteDebtorAccount);
router.put('/updateServiceFee/:id', authorize_middleware_1.default.validateAuth, debtor_validate_1.default.updateServiceFee, debtor_controller_1.default.updateServiceFee);
router.get('/getDebtorAccounts/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtorAccounts);
router.get('/get-debtor-accounts/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.getDebtorAccounts);
router.post('/makeAccountPrimary/:id', authorize_middleware_1.default.validateAuth, debtor_controller_1.default.makeAccountPrimary);
exports.default = router;
//# sourceMappingURL=debtor.routes.js.map