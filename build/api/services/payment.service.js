"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_util_1 = __importDefault(require("../../utils/common.util"));
const constants_util_1 = __importDefault(require("../../utils/constants.util"));
const payment_util_1 = __importDefault(require("../../utils/payment.util"));
const case_repository_1 = require("../repository/case/case.repository");
const payment_repository_1 = require("../repository/payment/payment.repository");
class PaymentService {
    constructor() {
        this.paymentRepository = new payment_repository_1.PaymentRepository();
        this.caseRepository = new case_repository_1.CaseRepository();
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
    async getHomePayments(days) {
        if (!days)
            days = 3;
        let currentDate = common_util_1.default.getCurrentDate();
        const payments = await this.getAllPayments(currentDate, days);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments);
        return [true, paymentsObj];
    }
    async getAllPayments(currentDate, days) {
        const startDate = new Date(new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000).toUTCString();
        return await this.paymentRepository.getAll({
            $and: [
                {
                    $or: [
                        { captured: 'Failed' },
                        { authorized: 'Failed' },
                        { authorized: 'Success' },
                        { captured: 'Success' },
                        { status: 'Upcoming' },
                    ],
                },
                {
                    dueDate: {
                        $gte: startDate,
                        $lte: currentDate,
                    },
                },
            ],
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
            populate: {
                path: 'debtor',
                select: ['basicInformation.fullName', 'basicInformation.SSID'],
            },
        });
    }
    async getCasePayments(id) {
        const payments = await this.getAllPaymentsByCaseId(id);
        if (!payments.length) {
            return [false, constants_util_1.default.notFoundMessage('Payments')];
        }
        const paymentsObj = await payment_util_1.default.getFilteredPayments(payments);
        return [true, paymentsObj];
    }
    async getAllPaymentsByCaseId(id) {
        return await this.paymentRepository.getAll({
            caseId: id,
        }, 'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status', undefined, { createdAt: -1 }, {
            path: 'caseId',
            select: ['_id', 'caseOwner', 'totalDebt'],
            populate: {
                path: 'debtor',
                select: ['basicInformation.fullName', 'basicInformation.SSID'],
            },
        });
    }
}
exports.default = PaymentService;
//# sourceMappingURL=payment.service.js.map