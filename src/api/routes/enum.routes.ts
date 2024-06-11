import {Router} from 'express';
import authorize from '../../middleware/authorize.middleware';
import enumController from '../controllers/enum/enum.controller';
const router = Router();

router.post('/createEnum', authorize.validateAuth, enumController.createEnum);
router.get('/getAllEnums', authorize.validateAuth, enumController.getAllEnums);
router.get(
  '/getEnumByTarget',
  authorize.validateAuth,
  enumController.getEnumByTarget
);

export default router;
