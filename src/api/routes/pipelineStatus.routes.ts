import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import pipelineStatusController from '../controllers/pipelineStatus/pipelineStatus.controller';
import pipelineStatusValidate from '../../middleware/validators/pipelineStatus.validate';
const router = Router();

router.post(
  '/createPipeline',
  authorize.validateAuth,
  pipelineStatusValidate.addPipeline,
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
  pipelineStatusValidate.addStatusPipeline,
  pipelineStatusController.addStatusPipeline
);
router.get(
  '/getPipelineById/:id',
  authorize.validateAuth,
  pipelineStatusController.getPipelineById
);
router.post(
  '/updatePipeline/:id',
  authorize.validateAuth,
  pipelineStatusValidate.addPipeline,
  pipelineStatusController.updatePipeline
);
router.delete(
  '/deletePipeline/:id',
  authorize.validateAuth,
  pipelineStatusController.deletePipeline
);

router.post(
  '/updateStatusPipeline/:id',
  authorize.validateAuth,
  pipelineStatusValidate.updateStatusPipeline,
  pipelineStatusController.updateStatusPipeline
);
router.post(
  '/deleteStatusPipeline/:id',
  authorize.validateAuth,
  pipelineStatusValidate.deleteStatusPipeline,
  pipelineStatusController.deleteStatusPipeline
);

export default router;
