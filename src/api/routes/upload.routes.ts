import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import multer from 'multer';
import uploadController from '../controllers/upload/upload.controller';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({storage});

router.post(
  '/files',
  authorize.validateAuth,
  upload.array('files'),
  uploadController.uploadFiles
);

export default router;
