import {Request, Response} from 'express';
import UserService from '../../services/user.service';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';

class UserController {
  protected userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req: Request, res: Response) => {
    try {
      const response = await this.userService.createUser(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.CREATED).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.CREATED,
          data: response[1],
          message: constants.successRegisterMessage('User'),
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  signIn = async (req: Request, res: Response) => {
    try {
      const {email, password} = req.body;
      const response = await this.userService.signIn(email, password);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.Messages.SIGNIN_SUCCESSFULL,
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getUserById = async (req: Request, res: Response) => {
    try {
      const response = await this.userService.getUserById(req.params.id);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('User'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getUser = async (req: Request | any, res: Response) => {
    try {
      const response = await this.userService.getUser(
        req.body.email ? req.body.email : ''
      );
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('User'),
        })
      );
    } catch (error) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  updateUser = async (req: Request, res: Response) => {
    const response = await this.userService.updateUser(req);
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.successUpdateMessage('User'),
      })
    );
  };

  deleteUserById = async (req: Request, res: Response) => {
    const response = await this.userService.deleteUserById(req.params.id);
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.successDeleteMessage('User'),
      })
    );
  };

  verifyInvitationLink = async (req: Request, res: Response) => {
    const response = await this.userService.verifyInvitationLink(
      String(req.query.token) ? String(req.query.token) : ''
    );
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.Messages.VALID_LINK,
      })
    );
  };

  resendInvitationLink = async (req: Request, res: Response) => {
    const response = await this.userService.resendInvitationLink(
      req.body.email ? req.body.email : ''
    );
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.Messages.SEND_INVITATION_LINK_200,
      })
    );
  };
  updatePassword = async (req: Request, res: Response) => {
    const response = await this.userService.updatePassword(req);
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.successUpdateMessage('User'),
      })
    );
  };

  getAllUsers = async (req: Request, res: Response) => {
    const response = await this.userService.getAllUsers(req);
    if (!response[0]) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(response[1]));
    }
    return res.status(constants.CODE.OK).send(
      responseHelper.get2xxResponse({
        statusCode: constants.CODE.OK,
        data: response[1],
        message: constants.successFoundMessage('Users'),
      })
    );
  };
}

export default new UserController();
