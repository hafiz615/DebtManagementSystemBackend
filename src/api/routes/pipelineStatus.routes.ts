import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import pipelineStatusController from '../controllers/pipelineStatus/pipelineStatus.controller';
import pipelineStatusValidate from '../../middleware/validators/pipelineStatus.validate';
const router = Router();

router.post(
  '/createPipeline',
  pipelineStatusValidate.addPipeline,
  authorize.validateAuth,
  pipelineStatusController.createPipeline
);
router.get(
  '/getAllPipelines',
  authorize.validateAuth,
  pipelineStatusController.getAllPipelines
);
router.post(
  '/addStatusPipeline/:id',
  authorize.validateAuth,
  pipelineStatusController.addStatusPipeline
);
router.get(
  '/getPipelineById/:id',
  authorize.validateAuth,
  pipelineStatusController.getPipelineById
);
router.post(
  '/updatePipeline/:id',
  pipelineStatusValidate.addPipeline,
  authorize.validateAuth,
  pipelineStatusController.updatePipeline
);
router.delete(
  '/deletePipeline/:id',
  authorize.validateAuth,
  pipelineStatusController.deletePipeline
);

router.post(
  '/updateStatusPipeline/:id',
  pipelineStatusValidate.updateStatusPipeline,
  authorize.validateAuth,
  pipelineStatusController.updateStatusPipeline
);
router.delete(
  '/deleteStatusPipeline/:id',
  pipelineStatusValidate.deleteStatusPipeline,
  authorize.validateAuth,
  pipelineStatusController.deleteStatusPipeline
);

export default router;
