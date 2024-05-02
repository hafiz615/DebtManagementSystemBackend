import {Router} from 'express';
import userValidate from '../../validators/user.validate';
import userController from '../controllers/user/user.controller';
import authorize from '../../middleware/authorize.middleware';
const router = Router();

router.post('/signIn', userValidate.signIn, userController.signIn);
router.get('/getUserById', authorize.validateAuth, userController.getUserById);
router.get('/getUser', userController.getUser);
router.put(
  '/updateUserById',
  authorize.validateAuth,
  userController.updateUser
);
router.put('/updateUser', userController.updateUser);
router.delete(
  '/deleteUserById',
  authorize.validateAuth,
  userController.deleteUserById
);

export default router;
