import {Request, Response} from 'express';
import EmailThreadingService from '../../../api/services/emailThreading.service';
import responseHelper from '../../../utils/responseHelper.util';

class EmailThreadingController {
  protected emailThreadingService: EmailThreadingService;

  constructor() {
    this.emailThreadingService = new EmailThreadingService();
  }
}

export default new EmailThreadingController();
