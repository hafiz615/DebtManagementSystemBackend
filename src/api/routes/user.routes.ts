import {Router} from 'express';
import userValidate from '../../middleware/validators/user.validate';
import userController from '../controllers/user/user.controller';
import authorize from '../../middleware/authorize.middleware';
const router = Router();

router.post(
  '/createUser',
  authorize.validateAuth,
  // authorize.validateRole,
  userValidate.createUser,
  userController.createUser
);
router.post('/signIn', userValidate.signIn, userController.signIn);
router.get(
  '/getUserById/:id',
  authorize.validateAuth,
  // authorize.validateRole,
  userController.getUserById
);
router.get('/getUser', userController.getUser);
router.put(
  '/updateUser',
  authorize.validateAuth,
  // authorize.validateRole,
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
  // authorize.validateRole,
  userController.deleteUserById
);
router.post('/verifyInvitationLink', userController.verifyInvitationLink);
router.post(
  '/resendInvitationLink',
  authorize.validateAuth,
  userController.resendInvitationLink
);
router.post('/getAllUsers', authorize.validateAuth, userController.getAllUsers);
router.post('/logout', authorize.validateAuth, userController.signOut);
router.post('/dashboard', authorize.validateAuth, userController.dashboard);
router.post(
  '/addSenderIdentity/:id',
  authorize.validateAuth,
  userValidate.addSenderIdentity,
  userController.addSenderIdentity
);
router.post(
  '/verifySenderIdentity',
  authorize.validateAuth,
  userValidate.verifySenderIdentity,
  userController.verifySenderIdentity
);

router.post('/forgotPassword', userController.forgotPasswordLink);

router.put('/forgotPasswordUpdate', userController.forgotPasswordUpdate);

router.get(
  '/getVerifySenders/:id',
  authorize.validateAuth,
  userController.getVerifySenders
);

router.post(
  '/thirdPartySignIn',
  userValidate.thirdPartySignIn,
  userController.thirdPartySignIn
);

router.post(
  '/addUserSender',
  authorize.validateAuth,
  userValidate.addSenderIdentity,
  userController.addUserSender
);

router.get('/getUsers', authorize.validateAuth, userController.getUsers);
router.get(
  '/usersByRole',
  authorize.validateAuth,
  userController.getUsersByRole
);

export default router;
