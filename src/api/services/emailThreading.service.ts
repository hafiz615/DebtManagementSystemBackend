import {Request} from 'express';
import {EmailThreadingRepository} from '../repository/emailThreading/emailThreading.repository';
import {IEmailThreading} from '../../database/interfaces/emailThreading.interface';

class EmailThreadingService {
  private emailThreadingRepository: EmailThreadingRepository;

  constructor() {
    this.emailThreadingRepository = new EmailThreadingRepository();
  }
}

export default EmailThreadingService;
