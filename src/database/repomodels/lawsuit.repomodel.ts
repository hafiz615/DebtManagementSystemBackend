import commonUtil from '../../utils/common.util';

export class Lawsuit {
  lawfirmId = null;
  attorneyId = null;
  debtorId = null;
  userId = null;
  creditorId = null;
  lawsuitStatus = false;
  lawsuitPaidAmount = 0;
  lawsuitPaidCount = 0;
  lawsuitReceiveAmount = 0;
  lawsuitReceiveCount = 0;
  lawfirmCompanyName = '';
  defendentCompanyName = '';
  plantiffCompanyName = '';
  logTrackingId = '';
  balance = 0;
  intervals = Array<{
    amount: 0;
    startDate: '';
    frequency: 0;
    timePeriod: '';
  }>();
  isExempt = false;
  attorneyPaymentsProceed = false;
  lawsuitDate = commonUtil.getCurrentDate();
  createdAt = commonUtil.getCurrentDate();
  updatedAt = commonUtil.getCurrentDate();
}
