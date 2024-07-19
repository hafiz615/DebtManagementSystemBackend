import {Request, Response} from 'express';
import constants from '../../../utils/constants.util';
import responseHelper from '../../../utils/responseHelper.util';
import RolesPermissionsService from '../../services/rolesPermissions.service';
import commonUtil from '../../../utils/common.util';

class RolesPermissionsController {
  protected rolesPermissionsService: RolesPermissionsService;

  constructor() {
    this.rolesPermissionsService = new RolesPermissionsService();
  }

  createRole = async (req: Request, res: Response) => {
    try {
      //   const checkPermission = await commonUtil.checkPermission('addRole', req);
      //   if (!checkPermission)
      //     return res
      //       .status(constants.CODE.BAD_REQUEST)
      //       .send(
      //         responseHelper.get4xxResponse(
      //           'You do not have permission to perform this operation'
      //         )
      //       );
      const response = await this.rolesPermissionsService.createRole(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successAddMessage('Role'),
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getAllRoles = async (req: Request, res: Response) => {
    const checkPermission = await commonUtil.checkPermission('viewRoles', req);
    if (!checkPermission)
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(
          responseHelper.get4xxResponse(
            'You do not have permission to perform this operation'
          )
        );
    try {
      const response = await this.rolesPermissionsService.getAllRoles(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Roles'),
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getRoleById = async (req: Request, res: Response) => {
    try {
      const response = await this.rolesPermissionsService.getRoleById(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Role'),
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  getRoleByName = async (req: Request, res: Response) => {
    try {
      const response = await this.rolesPermissionsService.getRoleByName(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.OK)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successFoundMessage('Role'),
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  updateRole = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission('editRole', req);
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response = await this.rolesPermissionsService.updateRole(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successUpdateMessage('Role'),
        })
      );
    } catch (error: any) {
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };

  deleteRole = async (req: Request, res: Response) => {
    try {
      const checkPermission = await commonUtil.checkPermission(
        'deleteRole',
        req
      );
      if (!checkPermission)
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(
            responseHelper.get4xxResponse(
              'You do not have permission to perform this operation'
            )
          );
      const response = await this.rolesPermissionsService.deleteRole(req);
      if (!response[0]) {
        return res
          .status(constants.CODE.BAD_REQUEST)
          .send(responseHelper.get4xxResponse(response[1]));
      }
      return res.status(constants.CODE.OK).send(
        responseHelper.get2xxResponse({
          statusCode: constants.CODE.OK,
          data: response[1],
          message: constants.successDeleteMessage('Role'),
        })
      );
    } catch (error: any) {
      console.log(error);
      return res
        .status(constants.CODE.BAD_REQUEST)
        .send(responseHelper.get4xxResponse(constants.Messages.EXCEPTION));
    }
  };
}

export default new RolesPermissionsController();
