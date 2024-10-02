import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import bulkUploadController from '../controllers/bulkUpload/bulkUpload.controller';
bulkUploadController;
const router = Router();

router.get(
  '/bulkUploadAnalytics',
  authorize.validateAuth,
  bulkUploadController.getBulkUploadAnalytics
);

router.get(
  '/getBulkCasesDetails/:id',
  authorize.validateAuth,
  bulkUploadController.getBulkCasesDetails
);

router.get(
  '/processBulkCronJob',
  authorize.validateAuth,
  bulkUploadController.processBulkCronJob
);
export default router;
