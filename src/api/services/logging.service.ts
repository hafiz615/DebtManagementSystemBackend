import {Request} from 'express';
import constantsUtil from '../../utils/constants.util';
import UpdateLog from '../../database/models/updateLogs.model';
import Log from '../../database/models/logs.model';

class LoggingService {
  async getLogsByTraceId(req: Request) {
    const updateLogs = await UpdateLog.find({traceId: req.params.id});
    const traceLogs = await Log.find({traceId: req.params.id});
    const allLogs = [...traceLogs, ...updateLogs];
    if (!allLogs.length) {
      return [false, constantsUtil.notFoundMessage('logs')];
    }
    return [true, allLogs];
  }

  async getLogsByTrackingId(req: Request) {
    const updateLogs = await UpdateLog.find({logTrackingId: req.params.id});
    if (!updateLogs.length) {
      return [false, constantsUtil.notFoundMessage('logs')];
    }
    return [true, updateLogs];
  }
}

export default LoggingService;
