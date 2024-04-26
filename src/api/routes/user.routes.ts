import {Router} from 'express';
import userValidate from '../../validators/user.validate';
import userController from '../controllers/user/user.controller';
import authorize from '../../middleware/authorize.middleware';
const router = Router();

router.post('/createUser', userValidate.createUser, userController.createUser);
router.post('/signIn', userValidate.signIn, userController.signIn);
router.get('/getUserById', authorize.validateAuth, userController.getUserById);
router.get('/getUser', userController.getUser);
router.put(
  '/updateUserById',
  authorize.validateAuth,
  userController.updateUser
);
router.put('/updatePassword', userController.updatePassword);
router.delete(
  '/deleteUserById',
  authorize.validateAuth,
  userController.deleteUserById
);
router.post('/verifyInvitationLink', userController.verifyInvitationLink);
router.post('/resendInvitationLink', userController.resendInvitationLink);

export default router;
