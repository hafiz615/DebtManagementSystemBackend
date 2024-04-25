import {Request, Response} from 'express';
import UserService from '../../services/user.service';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';

class UserController {
  protected userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

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

  getUserById = async (req: Request | any, res: Response) => {
    try {
      const response = await this.userService.getUserById();
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
    const response = await this.userService.deleteUserById();
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
}

export default new UserController();
