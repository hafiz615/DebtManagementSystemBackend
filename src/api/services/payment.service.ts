import {ICase, IInterval} from '../../database/interfaces/case.interface';
import {IPayment} from '../../database/interfaces/payment.interface';
import commonUtil from '../../utils/common.util';
import constants from '../../utils/constants.util';
import paymentUtil from '../../utils/payment.util';
import {CaseRepository} from '../repository/case/case.repository';
import {PaymentRepository} from '../repository/payment/payment.repository';
import {APIContracts, APIControllers} from 'authorizenet';

class PaymentService {
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
  }

  //   async authorization() {
  //     var merchantAuthenticationType =
  //       new APIContracts.MerchantAuthenticationType();
  //     merchantAuthenticationType.setName('');
  //     merchantAuthenticationType.setTransactionKey('');

  //     var creditCard = new APIContracts.CreditCardType();
  //     creditCard.setCardNumber('4242424242424242');
  //     creditCard.setExpirationDate('0835');
  //     creditCard.setCardCode('999');

  //     var paymentType = new APIContracts.PaymentType();

  //     var billTo = new APIContracts.CustomerAddressType();
  //     billTo.setFirstName('Ellen');
  //     billTo.setLastName('Johnson');
  //     billTo.setCompany('Souveniropolis');
  //     billTo.setAddress('14 Main Street');
  //     billTo.setCity('Pecan Springs');
  //     billTo.setState('TX');
  //     billTo.setZip('44628');
  //     billTo.setCountry('USA');

  //     var transactionRequestType = new APIContracts.TransactionRequestType();
  //     transactionRequestType.setTransactionType(
  //       APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION
  //     );
  //     transactionRequestType.setPayment(paymentType);
  //     transactionRequestType.setAmount(5);
  //     transactionRequestType.setBillTo(billTo);

  //     var createRequest = new APIContracts.CreateTransactionRequest();
  //     createRequest.setMerchantAuthentication(merchantAuthenticationType);
  //     createRequest.setTransactionRequest(transactionRequestType);

  //     var ctrl = new APIControllers.CreateTransactionController(
  //       createRequest.getJSON()
  //     );

  //     ctrl.execute(function () {
  //       var apiResponse = ctrl.getResponse();

  //       var response = new APIContracts.CreateTransactionResponse(apiResponse);

  //       //pretty print response
  //       console.log(JSON.stringify(response, null, 2));

  //       if (response != null) {
  //         if (
  //           response.getMessages().getResultCode() ==
  //           APIContracts.MessageTypeEnum.OK
  //         ) {
  //           if (response.getTransactionResponse().getMessages() != null) {
  //             console.log(
  //               'Successfully created transaction with Transaction ID: ' +
  //                 response.getTransactionResponse().getTransId()
  //             );
  //             console.log(
  //               'Response Code: ' +
  //                 response.getTransactionResponse().getResponseCode()
  //             );
  //             console.log(
  //               'Message Code: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getMessages()
  //                   .getMessage()[0]
  //                   .getCode()
  //             );
  //             console.log(
  //               'Description: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getMessages()
  //                   .getMessage()[0]
  //                   .getDescription()
  //             );
  //           } else {
  //             console.log('Failed Transaction.');
  //             if (response.getTransactionResponse().getErrors() != null) {
  //               console.log(
  //                 'Error Code: ' +
  //                   response
  //                     .getTransactionResponse()
  //                     .getErrors()
  //                     .getError()[0]
  //                     .getErrorCode()
  //               );
  //               console.log(
  //                 'Error message: ' +
  //                   response
  //                     .getTransactionResponse()
  //                     .getErrors()
  //                     .getError()[0]
  //                     .getErrorText()
  //               );
  //             }
  //           }
  //         } else {
  //           console.log('Failed Transaction.');
  //           if (
  //             response.getTransactionResponse() != null &&
  //             response.getTransactionResponse().getErrors() != null
  //           ) {
  //             console.log(
  //               'Error Code: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getErrors()
  //                   .getError()[0]
  //                   .getErrorCode()
  //             );
  //             console.log(
  //               'Error message: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getErrors()
  //                   .getError()[0]
  //                   .getErrorText()
  //             );
  //           } else {
  //             console.log(
  //               'Error Code: ' + response.getMessages().getMessage()[0].getCode()
  //             );
  //             console.log(
  //               'Error message: ' +
  //                 response.getMessages().getMessage()[0].getText()
  //             );
  //           }
  //         }
  //       } else {
  //         console.log('Null Response.');
  //       }
  //     });
  //   }

  //   async capture() {
  //     var merchantAuthenticationType =
  //       new APIContracts.MerchantAuthenticationType();
  //     merchantAuthenticationType.setName('');
  //     merchantAuthenticationType.setTransactionKey('');

  //     var transactionRequestType = new APIContracts.TransactionRequestType();
  //     transactionRequestType.setTransactionType(
  //       APIContracts.TransactionTypeEnum.PRIORAUTHCAPTURETRANSACTION
  //     );
  //     transactionRequestType.setRefTransId('');

  //     var createRequest = new APIContracts.CreateTransactionRequest();
  //     createRequest.setMerchantAuthentication(merchantAuthenticationType);
  //     createRequest.setTransactionRequest(transactionRequestType);

  //     //pretty print request
  //     console.log(JSON.stringify(createRequest.getJSON(), null, 2));

  //     var ctrl = new APIControllers.CreateTransactionController(
  //       createRequest.getJSON()
  //     );

  //     ctrl.execute(function () {
  //       var apiResponse = ctrl.getResponse();

  //       var response = new APIContracts.CreateTransactionResponse(apiResponse);

  //       //pretty print response
  //       console.log(JSON.stringify(response, null, 2));

  //       if (response != null) {
  //         if (
  //           response.getMessages().getResultCode() ==
  //           APIContracts.MessageTypeEnum.OK
  //         ) {
  //           if (response.getTransactionResponse().getMessages() != null) {
  //             console.log(
  //               'Successfully created transaction with Transaction ID: ' +
  //                 response.getTransactionResponse().getTransId()
  //             );
  //             console.log(
  //               'Response Code: ' +
  //                 response.getTransactionResponse().getResponseCode()
  //             );
  //             console.log(
  //               'Message Code: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getMessages()
  //                   .getMessage()[0]
  //                   .getCode()
  //             );
  //             console.log(
  //               'Description: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getMessages()
  //                   .getMessage()[0]
  //                   .getDescription()
  //             );
  //           } else {
  //             console.log('Failed Transaction.');
  //             if (response.getTransactionResponse().getErrors() != null) {
  //               console.log(
  //                 'Error Code: ' +
  //                   response
  //                     .getTransactionResponse()
  //                     .getErrors()
  //                     .getError()[0]
  //                     .getErrorCode()
  //               );
  //               console.log(
  //                 'Error message: ' +
  //                   response
  //                     .getTransactionResponse()
  //                     .getErrors()
  //                     .getError()[0]
  //                     .getErrorText()
  //               );
  //             }
  //           }
  //         } else {
  //           console.log('Failed Transaction. ');
  //           if (
  //             response.getTransactionResponse() != null &&
  //             response.getTransactionResponse().getErrors() != null
  //           ) {
  //             console.log(
  //               'Error Code: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getErrors()
  //                   .getError()[0]
  //                   .getErrorCode()
  //             );
  //             console.log(
  //               'Error message: ' +
  //                 response
  //                   .getTransactionResponse()
  //                   .getErrors()
  //                   .getError()[0]
  //                   .getErrorText()
  //             );
  //           } else {
  //             console.log(
  //               'Error Code: ' + response.getMessages().getMessage()[0].getCode()
  //             );
  //             console.log(
  //               'Error message: ' +
  //                 response.getMessages().getMessage()[0].getText()
  //             );
  //           }
  //         }
  //       } else {
  //         console.log('Null Response.');
  //       }
  //     });
  //   }
  async getHomePayments(days: number): Promise<[boolean, {} | string]> {
    if (!days) days = 3;
    let currentDate = commonUtil.getCurrentDate();
    const payments: IPayment[] = await this.getAllPayments(currentDate, days);
    const cases = await this.getUpcomingPaymentsQuery(currentDate, days);
    if (!payments.length && !cases.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    const paymentsObj = await paymentUtil.getFilteredPayments(payments);
    const upcomingPayments = await paymentUtil.getFilteredUpcomingPayments(
      cases,
      currentDate
    );
    paymentsObj['upcomingPayments'] = upcomingPayments;
    return [true, paymentsObj];
  }

  private async getAllPayments(currentDate: string, days: number) {
    const startDate = new Date(
      new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
    );
    return await this.paymentRepository.getAll<IPayment>(
      {
        $and: [
          {
            $or: [
              {captured: 'failed'},
              {authorized: 'failed'},
              {authorized: 'success'},
              {captured: 'success'},
            ],
          },
          {dueDate: {$lte: startDate}},
        ],
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured',
      undefined,
      {createdAt: -1},
      {
        path: 'caseId',
        select: '_id',
        populate: {
          path: 'debtor',
          select: ['basicInformation.fullName', 'basicInformation.SSID'],
        },
      }
    );
  }

  private async getUpcomingPaymentsQuery(
    currentDate: string,
    days: number
  ): Promise<ICase[]> {
    const endDate = new Date(
      new Date(currentDate).getTime() + days * 24 * 60 * 60 * 1000
    ).toUTCString();
    return await this.caseRepository.getAll<ICase>(
      {
        intervals: {
          $elemMatch: {startDate: {$gt: currentDate, $lte: endDate}},
        },
      },
      undefined,
      undefined,
      undefined,
      {
        path: 'debtor',
        select: 'basicInformation.fullName basicInformation.SSID',
      }
    );
  }

  async getCaseUpcomingPayments(
    id: string
  ): Promise<[boolean, ICase[] | string]> {
    const tempCase = await this.caseRepository.getById<ICase>(
      id,
      undefined,
      undefined,
      {
        path: 'debtor',
        select: 'basicInformation.fullName basicInformation.SSID',
      }
    );
    const upcomingPayments =
      await paymentUtil.getFilteredUpcomingPaymentsCase(tempCase);
    if (!upcomingPayments.length) {
      return [false, constants.notFoundMessage('Upcoming payments')];
    }
    return [true, upcomingPayments];
  }
}

export default PaymentService;
