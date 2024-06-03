import {Router} from 'express';
import userValidate from '../../middleware/validators/user.validate';
import userController from '../controllers/user/user.controller';
import authorize from '../../middleware/authorize.middleware';
const router = Router();

router.post(
  '/createUser',
  authorize.validateAuth,
  authorize.validateRole,
  userValidate.createUser,
  userController.createUser
);
router.post('/signIn', userValidate.signIn, userController.signIn);
router.get(
  '/getUserById/:id',
  authorize.validateAuth,
  authorize.validateRole,
  userController.getUserById
);
router.get('/getUser', userController.getUser);
router.put(
  '/updateUser',
  authorize.validateAuth,
  authorize.validateRole,
  userValidate.createUser,
  userController.updateUser
);
router.put('/updatePassword', userController.updatePassword);
router.put(
  '/resetPassword',
  authorize.validateAuth,
  userController.resetPassword
);
router.delete(
  '/deleteUserById/:id',
  authorize.validateAuth,
  authorize.validateRole,
  userController.deleteUserById
);
router.post('/verifyInvitationLink', userController.verifyInvitationLink);
router.post('/resendInvitationLink', userController.resendInvitationLink);
router.get('/getAllUsers', authorize.validateAuth, userController.getAllUsers);
router.post('/logout', authorize.validateAuth, userController.signOut);

export default router;
