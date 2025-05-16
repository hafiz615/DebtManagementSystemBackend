import {Request} from 'express';
import {ICase, IInterval} from '../../database/interfaces/case.interface';
import {IPayment} from '../../database/interfaces/payment.interface';
import commonUtil from '../../utils/common.util';
import constants from '../../utils/constants.util';
import paymentUtil from '../../utils/payment.util';
import {CaseRepository} from '../repository/case/case.repository';
import {PaymentRepository} from '../repository/payment/payment.repository';
import axios from 'axios';
import axiosInstance from '../../utils/axiosInstanceInterceptor';
import {CreditorRepository} from '../repository/creditor/creditor.repository';
import {ICreditor} from '../../database/interfaces/creditor.interface';
import paynoteUtil from '../../utils/paynote.util';
import {decrypt, encrypt} from 'n-krypta';
import dotenv from 'dotenv';
import constantsUtil from '../../utils/constants.util';
import emailUtil from '../../utils/email.util';
import creditorUtil from '../../utils/creditor.util';
import {DebtorRepository} from '../repository/debtor/debtor.repository';
import {IDebtor} from '../../database/interfaces/debtor.interface';
import caseUtil from '../../utils/case.util';
import googleDriveUtil from '../../utils/googleDrive.util';
import {IAttorney} from '../../database/interfaces/attorney.interface';
import {AttorneyRepository} from '../repository/attorney/attorney.repository';
import {LawfirmRepository} from '../repository/lawfirm/lawfirm.repository';
import {ILawsuit} from '../../database/interfaces/lawsuit.interface';
import {LawsuitRepository} from '../repository/lawsuit/lawsuit.repository';
import lawsuitUtil from '../../utils/lawsuit.util';
import {v4} from 'uuid';
dotenv.config();
class PaymentService {
  private paymentRepository: PaymentRepository;
  private caseRepository: CaseRepository;
  private creditorReposiotry: CreditorRepository;
  private debtorRepository: DebtorRepository;
  private attorneyReposiotry: AttorneyRepository;
  private lawsuitRepository: LawsuitRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.caseRepository = new CaseRepository();
    this.creditorReposiotry = new CreditorRepository();
    this.debtorRepository = new DebtorRepository();
    this.attorneyReposiotry = new AttorneyRepository();
    this.lawsuitRepository = new LawsuitRepository();
  }

  async getHomePayments(req: Request): Promise<[boolean, {} | string]> {
    let arrayName = String(req.query.arrayName);
    let days = Number(req.query.days);
    let counts = {};
    let filters = {
      caseId: {$eq: null},
      isDeleted: false,
    };
    let upcomingFilter = null;
    let dueDateFilter = null;
    if (days) {
      dueDateFilter = await this.getDaysFilterDueDate(days);
      upcomingFilter = await this.getDaysFilterUpcoming(days);
    }
    if (arrayName === 'default') {
      counts = await this.getCountForAllPaymentsStatus(
        {...filters},
        upcomingFilter,
        dueDateFilter
      );
    }
    const populatedFiltersResult = await this.populateFilterHomePayments(
      {...filters},
      req,
      upcomingFilter,
      dueDateFilter
    );
    let page = populatedFiltersResult.page;
    let limit = populatedFiltersResult.limit;
    const finalFilters = populatedFiltersResult.filters;
    const payments = await this.getAllPayments(
      req,
      finalFilters,
      page,
      limit,
      upcomingFilter,
      dueDateFilter
    );
    // if (!payments.length) {
    //   return [false, constants.notFoundMessage('Payments')];
    // }
    // const paymentsObj = await paymentUtil.getFilteredPayments(
    //   payments,
    //   arrayName
    // );
    if (
      arrayName !== 'default' &&
      req.query.filters !== 'true' &&
      req.query.search !== 'true'
    ) {
      const count =
        await this.paymentRepository.getCount<IPayment>(finalFilters);
      counts[arrayName] = count;
    }
    if (
      arrayName !== 'default' &&
      (req.query.filters === 'true' || req.query.search === 'true')
    ) {
      if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page) ? Number(req.query.page) : page;
      }
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
      }
      if (payments[arrayName]) {
        payments[arrayName] = await paymentUtil.searchAndFilterHomePayments(
          payments[arrayName],
          req
        );
        counts[arrayName] = payments[arrayName]?.length;
        payments[arrayName] = payments[arrayName]?.slice(
          (page - 1) * limit,
          page * limit
        );
      }
    }
    // const successPayments = structuredClone(paymentsObj.successPayments);
    // for (const payment of successPayments) {
    //   payment.transactionType = 'ACH';
    //   payment.paymentGateway = 'Paynote';
    // }
    // paymentsObj.successPayments = successPayments;
    return [
      true,
      {
        payments: payments,
        counts: counts,
      },
    ];
  }

  async getCreditorSuccessfulPayments(
    req: Request
  ): Promise<[boolean, {} | string]> {
    let days = Number(req.query.days);
    let counts = {};
    let filters = {
      caseId: {$ne: null},
      isDeleted: false,
      $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
    };
    if (days) {
      filters = await this.getDaysFilterPopulated(filters, days);
    }
    const populatedFiltersResult = await this.populateFilterCreditor(
      {...filters},
      req,
      'sendViaPaynote',
      'Success'
    );
    let page = populatedFiltersResult.page;
    let limit = populatedFiltersResult.limit;
    let finalFilters = populatedFiltersResult.filters;
    let payments: any = await this.getAllPaymentsQuery(
      finalFilters,
      page,
      limit
    );
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    // const paymentsObj = await paymentUtil.getFilteredPayments(
    //   payments,
    //   'successPayments'
    // );
    payments = await paymentUtil.getFilteredPaymentsCreditor(payments);

    if (req.query.filters !== 'true' && req.query.search !== 'true') {
      const count =
        await this.paymentRepository.getCount<IPayment>(finalFilters);
      console.log(finalFilters, 'hehehehe');
      counts['successPayments'] = count;
    }
    if (req.query.filters === 'true' || req.query.search === 'true') {
      if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page) ? Number(req.query.page) : page;
      }
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
      }
      payments = await paymentUtil.searchAndFilterHomePayments(payments, req);
      counts['successPayments'] = payments?.length;
      payments = payments?.slice((page - 1) * limit, page * limit);
    }
    // const successPayments = structuredClone(paymentsObj.successPayments);

    // paymentsObj.successPayments = successPayments;
    return [
      true,
      {
        payments: payments,
        counts: counts,
      },
    ];
  }

  async getCreditorUpcomingPayments(
    req: Request
  ): Promise<[boolean, {} | string]> {
    let days = Number(req.query.days);
    let counts = {};
    let filters = {
      caseId: {$ne: null},
      isDeleted: false,
      $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
    };
    if (days) {
      let upcomingFilter = await this.getDaysFilterUpcoming(days);
      filters['dueDate'] = upcomingFilter;
    }
    const populatedFiltersResult = await this.populateFilterCreditor(
      {...filters},
      req,
      'status',
      'Upcoming'
    );
    let page = populatedFiltersResult.page;
    let limit = populatedFiltersResult.limit;
    const finalFilters = populatedFiltersResult.filters;
    let payments: any = await this.getAllPaymentsQuery(
      finalFilters,
      page,
      limit
    );
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    // const paymentsObj = await paymentUtil.getFilteredPayments(
    //   payments,
    //   'successPayments'
    // );
    payments = await paymentUtil.getFilteredPaymentsCreditor(payments);
    if (req.query.filters !== 'true' && req.query.search !== 'true') {
      const count =
        await this.paymentRepository.getCount<IPayment>(finalFilters);
      counts['creditorUpcomingPayments'] = count;
    }
    if (req.query.filters === 'true' || req.query.search === 'true') {
      if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page) ? Number(req.query.page) : page;
      }
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
      }
      payments = await paymentUtil.searchAndFilterHomePayments(payments, req);
      counts['creditorUpcomingPayments'] = payments?.length;
      payments = payments?.slice((page - 1) * limit, page * limit);
    }

    return [
      true,
      {
        payments: payments,
        counts: counts,
      },
    ];
  }

  async populateFilterHomePayments(
    filters: any,
    req: Request,
    upcomingFilter: any,
    dueDateFilter: any
  ) {
    let page = 1;
    let limit = 5;
    let arrayName = String(req.query.arrayName);
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    let filtersApply: any;
    if (req.query.filters === 'true') {
      page = 0;
      limit = 0;
      filtersApply = req.body.filters;
      if (filtersApply?.dueDate) {
        filters['dueDate'] = {
          $gte: filtersApply.dueDate.start,
          $lte: filtersApply.dueDate.end,
        };
      }
      if (filtersApply?.tryDate) {
        filters['reschedule'] = {
          $gte: filtersApply.tryDate.start,
          $lte: filtersApply.tryDate.end,
        };
      }
    }
    if (req.query.search === 'true') {
      page = 0;
      limit = 0;
    }
    if (arrayName !== 'default') {
      switch (arrayName) {
        case 'failedCaptures':
          filters['captured'] = 'Failed';
          if (dueDateFilter) filters['dueDate'] = dueDateFilter;
          break;
        // case 'successPayments':
        //   filters['sendViaPaynote'] = 'Success';
        //   filters['caseId'] = {$ne: null};
        //   break;
        case 'successCaptures':
          filters['captured'] = 'Success';
          if (dueDateFilter) filters['dueDate'] = dueDateFilter;
          break;
        case 'failedAuthorizations':
          filters['authorized'] = 'Failed';
          if (dueDateFilter) filters['authorizedDate'] = dueDateFilter;
          break;
        case 'successAuthorizations':
          filters['authorized'] = 'Success';
          if (dueDateFilter) filters['authorizedDate'] = dueDateFilter;
          break;
        case 'upcomingPayments':
          filters['status'] = 'Upcoming';
          if (upcomingFilter) filters['dueDate'] = upcomingFilter;
          break;
        default:
          filters['authorized'] = 'Failed';
          if (dueDateFilter) filters['dueDate'] = upcomingFilter;
          break;
      }
    }
    return {filters, page, limit};
  }

  async populateFilterCreditor(
    filters: any,
    req: Request,
    name: string,
    status: string
  ) {
    let page = 1;
    let limit = 5;
    if (req.query.page && !isNaN(Number(req.query.page))) {
      page = Number(req.query.page) ? Number(req.query.page) : page;
    }
    if (req.query.limit && !isNaN(Number(req.query.limit))) {
      limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
    }
    let filtersApply: any;
    if (req.query.filters === 'true') {
      page = 0;
      limit = 0;
      filtersApply = req.body.filters;
      if (filtersApply?.dueDate) {
        filters['dueDate'] = {
          $gte: filtersApply.dueDate.start,
          $lte: filtersApply.dueDate.end,
        };
      }
      if (filtersApply?.tryDate) {
        filters['reschedule'] = {
          $gte: filtersApply.tryDate.start,
          $lte: filtersApply.tryDate.end,
        };
      }
    }
    if (req.query.search === 'true') {
      page = 0;
      limit = 0;
    }
    filters[name] = status;
    return {filters, page, limit};
  }

  async getDaysFilterPopulated(filters: any, days: number) {
    if (days) {
      let currentDate = commonUtil.getCurrentDate();
      const startDate = new Date(
        new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
      ).toUTCString();
      filters['dueDate'] = {
        $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(currentDate).setUTCHours(0, 0, 0, 0)),
      };
    }
    return filters;
  }

  async getDaysFilterUpcoming(days: number) {
    if (days) {
      let currentDate = commonUtil.getCurrentDate();
      const tillDate = new Date(
        new Date(currentDate).getTime() + days * 24 * 60 * 60 * 1000
      ).toUTCString();
      return {
        $gte: new Date(new Date(currentDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(tillDate).setUTCHours(0, 0, 0, 0)),
      };
    }
    return null;
  }

  async getDaysFilterDueDate(days: number) {
    if (days) {
      let currentDate = commonUtil.getCurrentDate();
      const startDate = new Date(
        new Date(currentDate).getTime() - days * 24 * 60 * 60 * 1000
      ).toUTCString();
      return {
        $gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        $lte: new Date(new Date(currentDate).setUTCHours(0, 0, 0, 0)),
      };
    }
    return null;
  }

  async getAllPayments(
    req: Request,
    filters: any,
    page: number,
    limit: number,
    upcomingFilter: any,
    dueDateFilter: any
  ) {
    let failedCaptures = [],
      successCaptures = [],
      successPayments = [],
      failedAuthorizations = [],
      successAuthorizations = [],
      upcomingPayments = [];
    const arrayName = String(req.query.arrayName);
    if (arrayName === 'default') {
      const failedAuth = {...filters};
      failedAuth['authorized'] = 'Failed';
      if (dueDateFilter) failedAuth['authorizedDate'] = dueDateFilter;
      failedAuthorizations = await this.getAllPaymentsQuery(
        failedAuth,
        page,
        limit
      );
      const failedCapture = {...filters};
      failedCapture['captured'] = 'Failed';
      if (dueDateFilter) failedCapture['dueDate'] = dueDateFilter;
      failedCaptures = await this.getAllPaymentsQuery(
        failedCapture,
        page,
        limit
      );
      const successAuth = {...filters};
      successAuth['authorized'] = 'Success';
      successAuth['paymentMode'] = {$ne: 'Direct Post'};
      if (dueDateFilter) successAuth['authorizedDate'] = dueDateFilter;
      successAuthorizations = await this.getAllPaymentsQuery(
        successAuth,
        page,
        limit
      );
      const successCapture = {...filters};
      successCapture['captured'] = 'Success';
      if (dueDateFilter) successCapture['dueDate'] = dueDateFilter;
      successCaptures = await this.getAllPaymentsQuery(
        successCapture,
        page,
        limit
      );
      const upcoming = {...filters};
      upcoming['status'] = 'Upcoming';
      if (upcomingFilter) upcoming['dueDate'] = upcomingFilter;
      upcomingPayments = await this.getAllPaymentsQuery(upcoming, page, limit);

      // const successPayments = {...filters};
      // successPayments['sendViaPaynote'] = 'Success';
      // successPayments['caseId'] = {$ne: null};
      // const getSuccessPayments = await this.getAllPaymentsQuery(
      //   successPayments,
      //   page,
      //   limit
      // );

      // const mergedArray = [
      //   ...getFailedAuthPayments,
      //   ...getFailedCapturePayments,
      //   ...getSuccessAuthPayments,
      //   ...getSuccessCapturePayments,
      //   ...getUpcomingPayments,
      //   // ...getSuccessPayments,
      // ];
      return {
        failedCaptures: failedCaptures,
        successPayments: successPayments,
        failedAuthorizations: failedAuthorizations,
        successAuthorizations: successAuthorizations,
        upcomingPayments: upcomingPayments,
        successCaptures: successCaptures,
      };
      // return await this.getUniquePayments(mergedArray);
    }
    return {[arrayName]: await this.getAllPaymentsQuery(filters, page, limit)};
  }

  async getUniquePayments(payments: IPayment[]) {
    const uniqueObjects = payments.reduce((acc, current) => {
      const id = current._id.toString(); // Convert ObjectId to string to ensure proper comparison
      if (!acc.has(id)) {
        acc.set(id, current);
      }
      return acc;
    }, new Map());

    return Array.from(uniqueObjects.values());
  }

  async getAllPaymentsQuery(filters: any, page: number, limit: number) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      filters,
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status sendViaPaynote debtorTransId transactionType paymentGateway debtorName debtorId creditorName',
      undefined,
      {createdAt: -1},
      {
        path: 'caseId',
        select: ['_id', 'caseOwner', 'totalDebt'],
      },
      undefined,
      page,
      limit
    );
  }

  async getCountForAllPaymentsStatus(
    filters: any,
    upcomingFilter: any,
    dueDateFilter: any
  ) {
    const failedAuth = {...filters};
    failedAuth['authorized'] = 'Failed';
    failedAuth['authorizedDate'] = dueDateFilter;
    const failedCapture = {...filters};
    failedCapture['captured'] = 'Failed';
    failedCapture['dueDate'] = dueDateFilter;
    const successAuth = {...filters};
    successAuth['authorized'] = 'Success';
    successAuth['authorizedDate'] = dueDateFilter;
    const successCapture = {...filters};
    successCapture['captured'] = 'Success';
    successCapture['dueDate'] = dueDateFilter;
    const upcoming = {...filters};
    upcoming['status'] = 'Upcoming';
    upcoming['dueDate'] = upcomingFilter;
    // const successPaynote = {...filters};
    // successPaynote['sendViaPaynote'] = 'Success';
    // successPaynote['caseId'] = {$ne: null};
    const successAuthorizations =
      await this.paymentRepository.getCount<IPayment>(successAuth);
    const failedCaptures =
      await this.paymentRepository.getCount<IPayment>(failedCapture);
    const failedAuthorizations =
      await this.paymentRepository.getCount<IPayment>(failedAuth);
    const successCaptures =
      await this.paymentRepository.getCount<IPayment>(successCapture);
    console.log(upcoming, 'upcoming');
    const upcomingPayments =
      await this.paymentRepository.getCount<IPayment>(upcoming);
    // const successPayments =
    //   await this.paymentRepository.getCount<IPayment>(successPaynote);
    return {
      failedAuthorizations: failedAuthorizations,
      // successPayments: successPayments,
      successAuthorizations: successAuthorizations,
      failedCaptures: failedCaptures,
      successCaptures: successCaptures,
      upcomingPayments: upcomingPayments,
    };
  }

  async getCasePayments(req: Request): Promise<[boolean, {} | string]> {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) return [false, constants.notFoundMessage('case')];
    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const paymentsPrevious: IPayment[] = await this.getPreviousPaymentsByCaseId(
      req.params.id
    );
    const paymentsUpcoming: IPayment[] = await this.getUpcomingPaymentsByCaseId(
      req.params.id,
      pageLimit.page,
      pageLimit.limit
    );
    const paymentsUpcomingCount = await this.getUpcomingPaymentsByCaseIdCount(
      req.params.id
    );

    const paymentsObj = await paymentUtil.getFilteredPayments(
      paymentsPrevious,
      'default'
    );
    const upcomingPaymentsObj = await paymentUtil.getFilteredPayments(
      paymentsUpcoming,
      'upcomingPayments'
    );
    let paidAmount = 0,
      upcomingAmount = 0,
      failedAmount = 0;
    paidAmount = paymentsObj.successPayments.reduce(
      (acc: any, payment: {amount: any}) => acc + payment.amount,
      0
    );
    upcomingAmount = paymentsObj.upcomingPayments.reduce(
      (acc: any, payment: {amount: any}) => acc + payment.amount,
      0
    );
    failedAmount = paymentsObj.failedCaptures.reduce(
      (acc: any, payment: {amount: any}) => acc + payment.amount,
      0
    );
    const failedAuth = paymentsObj.failedAuthorizations.map((obj: any) => ({
      ...obj,
      type: 'authorization',
    }));

    // Adding type to each object in successCapture array
    const failedCapture = paymentsObj.failedCaptures.map((obj: any) => ({
      ...obj,
      type: 'capture',
    }));

    const successAuth = paymentsObj.successAuthorizations
      .filter(payment => payment.paymentMode !== 'Direct Post')
      .map((obj: any) => ({
        ...obj,
        type: 'authorization',
      }));

    // Adding type to each object in successCapture array
    const successCapture = paymentsObj.successCaptures.map((obj: any) => ({
      ...obj,
      type: 'capture',
    }));

    // Merging the arrays
    const mergedArray = [
      ...successAuth,
      ...failedAuth,
      ...successCapture,
      ...failedCapture,
    ];
    const paymentCounts = {
      failedCaptures: paymentsObj.failedCaptures.length,
      successCaptures: paymentsObj.successCaptures.length,
      failedAuthorizations: paymentsObj.failedAuthorizations.length,
      successAuthorizations: successAuth.length,
      successPayments: paymentsObj.successPayments.length,
      paidAmount: paidAmount,
      remainingAmount: parseFloat((upcomingAmount + failedAmount).toFixed(2)),
    };
    mergedArray.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
    upcomingPaymentsObj.upcomingPayments.sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const paginatedArray = mergedArray.slice(
      (pageLimit.page - 1) * pageLimit.limit,
      pageLimit.page * pageLimit.limit
    );
    return [
      true,
      {
        transactions: {
          previous: paginatedArray,
          upcomingPayments: upcomingPaymentsObj.upcomingPayments,
          previousCount: mergedArray.length,
          upcomingCount: paymentsUpcomingCount,
        },
        paymentCounts: paymentCounts,
      },
    ];
  }

  async getAllUpcomingPayments(req: Request): Promise<[boolean, {} | string]> {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('case')];
    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const payments: IPayment[] = await this.getAllPaymentsByDebtor(
      req.params.id,
      pageLimit.page,
      pageLimit.limit
    );
    const paymentsCount = await this.getAllPaymentsByDebtorCount(req.params.id);
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }
    // const paymentsObj = await paymentUtil.getFilteredPayments(
    //   payments,
    //   'default'
    // );
    return [
      true,
      {
        transactions: {
          upcomingPayments: payments,
          totalCount: paymentsCount,
        },
      },
    ];
  }

  async getCommissionPayments(req: Request): Promise<[boolean, {} | string]> {
    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const paymentsPrevious: IPayment[] =
      await this.getPreviousCommissionPayments();
    const paymentsUpcoming: IPayment[] =
      await this.getUpcomingCommissionPayments(pageLimit.page, pageLimit.limit);
    const paymentsUpcomingCount =
      await this.getUpcomingCommissionPaymentsCount();
    // const newPaymentsArray = paymentsPrevious.concat(paymentsUpcoming);
    const paymentsObj =
      await paymentUtil.getFilteredCommissionPayments(paymentsPrevious);
    const upcomingPaymentsObj =
      await paymentUtil.getFilteredCommissionPayments(paymentsUpcoming);
    const failedAuth = paymentsObj.failedAuthorizations.map((obj: any) => ({
      ...obj,
      type: 'authorization',
    }));

    // Adding type to each object in successCapture array
    const failedCapture = paymentsObj.failedCaptures.map((obj: any) => ({
      ...obj,
      type: 'payment',
    }));

    const successAuth = paymentsObj.successAuthorizations.map((obj: any) => ({
      ...obj,
      type: 'authorization',
    }));

    // Adding type to each object in successCapture array
    const successCapture = paymentsObj.successCaptures.map((obj: any) => ({
      ...obj,
      type: 'payment',
    }));

    // Merging the arrays
    const mergedArray = [
      ...successAuth,
      ...failedAuth,
      ...successCapture,
      ...failedCapture,
    ];
    mergedArray.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
    upcomingPaymentsObj.upcomingPayments.sort(
      (a: any, b: any) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const paginatedArray = mergedArray.slice(
      (pageLimit.page - 1) * pageLimit.limit,
      pageLimit.page * pageLimit.limit
    );
    return [
      true,
      {
        transactions: {
          previous: paginatedArray,
          upcomingPayments: upcomingPaymentsObj.upcomingPayments,
          previousCount: mergedArray.length,
          upcomingCount: paymentsUpcomingCount,
        },
      },
    ];
  }

  private async getAllPaymentsByDebtor(
    id: string,
    page: number,
    limit: number
  ) {
    return await this.paymentRepository.getAll<IPayment>(
      {
        debtorId: id,
        caseId: {$ne: null},
        $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
        isDeleted: false,
        status: 'Upcoming',
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status creditorName debtorName',
      undefined,
      {createdAt: -1},
      undefined,
      undefined,
      page,
      limit
    );
  }

  private async getAllPaymentsByDebtorCount(id: string) {
    return await this.paymentRepository.getCount<IPayment>({
      debtorId: id,
      caseId: {$ne: null},
      $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
      isDeleted: false,
      status: 'Upcoming',
    });
  }

  private async getPreviousPaymentsByCaseId(id: string) {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        caseId: id,
        isDeleted: false,
        authorized: {$in: ['Success', 'Failed']},
        captured: {$in: ['Success', 'Failed']},
        $or: [{lawsuitId: {$exists: false}}, {lawsuitId: null}],
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured failedReasonPaynote rescheduled status debtorTransId transactionType paymentGateway debtorName paymentMode',
      undefined,
      {createdAt: -1},
      {
        path: 'caseId',
        select: ['_id', 'caseOwner', 'totalDebt'],
        populate: [
          {
            path: 'debtor',
            select: ['basicInformation.fullName', 'basicInformation.SSID'],
          },
          {
            path: 'creditor',
            select: ['basicInformation.fullName'],
          },
        ],
      }
    );
  }

  private async getUpcomingPaymentsByCaseId(
    id: string,
    page: number,
    limit: number
  ) {
    return await this.paymentRepository.getAll<IPayment>(
      {
        caseId: id,
        isDeleted: false,
        $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
        status: 'Upcoming',
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured failedReasonPaynote rescheduled status debtorTransId transactionType paymentGateway debtorName',
      undefined,
      {createdAt: -1},
      {
        path: 'caseId',
        select: ['_id', 'caseOwner', 'totalDebt'],
        populate: [
          {
            path: 'debtor',
            select: ['basicInformation.fullName', 'basicInformation.SSID'],
          },
          {
            path: 'creditor',
            select: ['basicInformation.fullName'],
          },
        ],
      },
      undefined,
      page,
      limit
    );
  }

  private async getAttorneyPayments(page: number, limit: number, filter: any) {
    return await this.paymentRepository.getAll<IPayment>(
      filter,
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured failedReasonPaynote rescheduled status debtorTransId transactionType paymentGateway debtorName creditorName sendViaPaynote',
      undefined,
      undefined,
      {
        path: 'caseId',
        select: ['_id'],
      },
      undefined,
      page,
      limit
    );
  }

  private async getAttorneyPaymentsCount(filter: any) {
    return await this.paymentRepository.getCount<IPayment>(filter);
  }

  private async getUpcomingPaymentsByCaseIdCount(id: string) {
    return await this.paymentRepository.getCount<IPayment>({
      caseId: id,
      $or: [{lawsuitId: {$exists: false}}, {lawsuitId: {$eq: null}}],
      isDeleted: false,
      status: 'Upcoming',
    });
  }

  private async getPreviousCommissionPayments() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        caseId: null,
        isDeleted: false,
        status: {$ne: 'Upcoming'},
        paymentMode: {$ne: 'Link'},
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status transactionType paymentGateway',
      undefined,
      {createdAt: -1}
    );
  }

  private async getUpcomingCommissionPayments(page: number, limit: number) {
    return await this.paymentRepository.getAll<IPayment>(
      {
        caseId: null,
        isDeleted: false,
        status: 'Upcoming',
        paymentMode: {$ne: 'Link'},
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status transactionType paymentGateway',
      undefined,
      {createdAt: -1},
      undefined,
      undefined,
      page,
      limit
    );
  }

  private async getUpcomingCommissionPaymentsCount() {
    return await this.paymentRepository.getCount<IPayment>({
      caseId: null,
      isDeleted: false,
      status: 'Upcoming',
    });
  }

  private async getSuccessCommissionPaymentsWithCaseId() {
    return await this.paymentRepository.getAllWithoutPagination<IPayment>(
      {
        caseId: {$ne: null},
        isDeleted: false,
        captured: 'Success',
        commission: {$gt: 0},
      },
      'authorized captured amount dueDate failedReasonAuthorization failedReasonCaptured rescheduled status',
      undefined,
      {createdAt: -1}
    );
  }

  async authorizeCreditCard(
    amount: number,
    customer_vault_id: string,
    platform: string
  ) {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const params = {
      security_key: urlSecurityKey.securityKey,
      customer_vault_id: customer_vault_id,
      type: 'auth',
      amount: amount,
    };
    console.log(params);

    try {
      const response = await axiosInstance.get(url, {params});
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error making request:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }
  async captureCreditCard(
    customer_vault_id: string,
    transactionId: string,
    platform: string
  ) {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const params = {
      security_key: urlSecurityKey.securityKey,
      customer_vault_id: customer_vault_id,
      transaction_id: transactionId,
      stored_credential_indicator: 'used',
      type: 'capture',
    };

    try {
      const response = await axiosInstance.get(url, {params});
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error making request:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }

  async achCredit(customer_vault_id: string, amount: number, platform: string) {
    const urlSecurityKey =
      await commonUtil.getUrlAndSecurityKeyPlatform(platform);
    const url = urlSecurityKey.url;
    const params = {
      security_key: urlSecurityKey.securityKey,
      customer_vault_id: customer_vault_id,
      stored_credential_indicator: 'used',
      type: 'sale',
      amount: amount,
      payment: 'check',
    };

    try {
      const response = await axiosInstance.get(url, {params});
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error making request:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    }
  }

  async addAccount(req: Request) {
    const type = req.body.platform;
    const data = req.body.data;

    switch (type) {
      case 'Seamlesschex':
        const user: any = await commonUtil.getUserByType(
          req.params.id,
          'debtor'
        );

        if (!user.obj) {
          return [false, 'Debtor not found'];
        }

        const decryptedData = commonUtil.getDecryptedData(data);

        const routingNoExist = user.obj?.seamlesschexRountingIds?.includes(
          decryptedData.bankRouting
        );
        if (routingNoExist) return [false, 'Routing Number already Exist.'];

        const updatedDebtor = await this.debtorRepository.updateById<IDebtor>(
          user.obj._id,
          {
            $push: {
              accounts: {
                $each: [
                  {
                    paymentType: 'ACH',
                    customerAccount: data,
                    platform: 'Seamlesschex',
                  },
                ],
              },
              seamlesschexRountingIds: {$each: [decryptedData.bankRouting]},
            },
            updatedAt: commonUtil.getCurrentDate(),
          }
        );

        if (!updatedDebtor)
          return [false, constantsUtil.failureUpdateMessage('Debtor')];
        return [true, 'Account added successfully'];

      case 'Paynote':
        req.query.type = 'debtor';
        const paynoteAccount = await this.addAccountACHDetails(req, true);
        if (!paynoteAccount[0]) return [false, paynoteAccount[1]];
        return [true, 'Account added successfully'];
    }
    return [true, 'Account added successfully'];
  }

  async addAccountACHDetails(req: Request, addAccount?: boolean) {
    const reqTemp: any = req;
    const type = reqTemp.query.type;
    const user: any = await commonUtil.getUserByType(req.params.id, type);
    if (!user.obj) return [false, constants.notFoundMessage('user')];
    const {name, email}: any = await commonUtil.getUserDetails(user.obj);
    const createCustomer = await paynoteUtil.createCustomer(
      user.obj._id,
      name,
      email,
      user.model,
      true
    );
    if (createCustomer.error)
      return [false, constantsUtil.failureAddMessage('Account')];

    console.log('data: ', createCustomer);
    const data = req.body.data;
    const paymentObj = commonUtil.getDecryptedData(data);
    const fundingSource = await paynoteUtil.addFundingSource(
      paymentObj,
      createCustomer.user.user_id
    );

    console.log('fundingSource:', fundingSource);

    if (fundingSource?.error) {
      let message = '';
      if (fundingSource?.messages) {
        message = fundingSource.messages[0];
      } else {
        message = fundingSource.message;
      }
      return [false, message];
    }
    const sourceId = fundingSource.funding_source.source_id;

    if (addAccount) {
      const initialVerify = await paynoteUtil.initiateFundingSourceVerifcation(
        sourceId,
        createCustomer.user.user_id
      );
      console.log('initialVerify', initialVerify);
      if (initialVerify.error) return [false, initialVerify.message];

      const verifyFundingSource =
        await paynoteUtil.verifyFundingSource(sourceId);
      if (verifyFundingSource.error)
        return [false, verifyFundingSource.message];

      const updatedDebtor = await paynoteUtil.addPaynoteAccount(
        user.obj._id,
        createCustomer.user.user_id,
        sourceId
      );
      if (!updatedDebtor)
        return [false, constantsUtil.failureUpdateMessage('Debtor')];
      return [true, 'Account added successfully'];
    }

    return [true, constants.successAddMessage('ACH details')];
  }

  async addACHDetails(req: Request) {
    const reqTemp: any = req;
    const type = reqTemp.query.type;
    const user: any = await commonUtil.getUserByType(req.params.id, type);
    if (!user.obj) return [false, constants.notFoundMessage('user')];
    const {name, email}: any = await commonUtil.getUserDetails(user.obj);
    if (!user.obj.paynoteUserId) {
      const data = await paynoteUtil.createCustomer(
        user.obj._id,
        name,
        email,
        user.model
      );
      if (data.error) return [false, data.message];
      console.log('data: ', data);
    }
    const data = req.body.data;
    const paymentObj = commonUtil.getDecryptedData(data);
    const updatedUser: any = await commonUtil.getUserByType(
      req.params.id,
      type
    );

    const fundingSource = await paynoteUtil.addFundingSource(
      paymentObj,
      updatedUser.obj.paynoteUserId
    );
    if (fundingSource?.error) {
      let message = '';
      if (fundingSource?.messages) {
        message = fundingSource.messages[0];
      } else {
        message = fundingSource.message;
      }
      return [false, message];
    }
    const sourceId = fundingSource.funding_source.source_id;
    user.model.updateById(user.obj._id, {
      paynoteSourceId: fundingSource.funding_source.source_id,
      paynoteSourceVerified: true,
    });
    // paynoteUtil.initiateFundingSourceVerifcation(
    //   sourceId,
    //   creditor.paynoteUserId
    // );
    // paynoteUtil.verifyFundingSource(sourceId);
    return [true, constants.successAddMessage('ACH details')];
  }

  async updateACHDetails(req: Request) {
    const reqTemp: any = req;
    const type = reqTemp.query.type;

    const user: any = await commonUtil.getUserByType(req.params.id, type);
    if (!user.obj) return [false, constants.notFoundMessage(`${type}`)];
    const data = req.body.data;
    const paymentObj = commonUtil.getDecryptedData(data);

    const fundingSource = await paynoteUtil.updateFundingSource(
      paymentObj,
      user
    );

    if (fundingSource?.error) {
      let message = '';
      if (fundingSource?.messages) {
        message = fundingSource.messages[0];
      } else {
        message = fundingSource.message;
      }
      return [false, message];
    }
    return [true, constants.successUpdateMessage('ACH details')];
  }

  async sendPaymentPaynote(req: Request) {
    const paymentId = req.params.id;
    const payment: any = await this.paymentRepository.getById<IPayment>(
      paymentId,
      undefined,
      undefined,
      {
        path: 'caseId',
        select: ['_id', 'caseCode', 'remaining', 'creditorPaymentsProceed'],
        populate: [
          {
            path: 'creditor',
            select: [
              'paynoteSourceId',
              'paynoteUserId',
              'basicInformation.fullName',
              'businessInformation.companyName',
            ],
          },
          {
            path: 'debtor',
            select: [
              '_id',
              'basicInformation.fullName',
              'businessInformation.companyName',
            ],
          },
        ],
      }
    );
    const interval = {
      unit: 'days',
      value: 1,
      maxRetry: 2,
    };
    if (!payment) {
      return [false, constantsUtil.notFoundMessage('payment')];
    }
    if (!payment.caseId?.creditor?.paynoteUserId) {
      return [false, 'User not added in paynote!'];
    }
    if (!payment.caseId?.creditorPaymentsProceed) {
      return [false, 'Funds transfer for this creditor is paused'];
    }
    if (!payment.caseId?.creditor?.basicInformation?.fullName) {
      return [false, 'Creditor name is required'];
    }
    if (!payment.caseId?.debtor?.businessInformation?.companyName) {
      return [false, 'Debtor company name is required'];
    }
    if (payment.status === 'Success') {
      return [false, 'Payment already send'];
    }
    if (payment.caseId.creditor.paynoteUserId) {
      // const paynoteCustomer = await paynoteUtil.getCustomer(
      //   payment.caseId.creditor
      // );
      // if (paynoteCustomer.user.status === 'unverified')
      //   return [false, 'User is unverified for payments'];
      const paymentResult = await paynoteUtil.sendPayment(payment);
      if (paymentResult?.message === 'Server Error')
        return [false, constants.Messages.PAYNOTE_SERVER_ERROR];
      if (paymentResult.error) {
        let message = '';
        if (paymentResult?.messages) {
          message = paymentResult.messages[0];
        } else {
          message = paymentResult.message;
        }
        const retry = payment.retriesAuth + 1;
        const value = interval.value * retry;
        const retryDate = this.getRetryDate(
          interval.unit,
          value,
          payment.dueDate
        );
        await this.paymentRepository.updateById<IPayment>(payment._id, {
          sendViaPaynote: 'Failed',
          rescheduled: retryDate,
          failedReasonPaynote: message,
        });
        emailUtil.sendEmailOrSmsByEvent('failed_payment', '', payment._id, '');
        return [false, message];
      }

      emailUtil.sendEmailOrSmsByEvent(
        'successful_payment',
        '',
        payment._id,
        ''
      );
      await this.paymentRepository.updateById<IPayment>(payment._id, {
        paynoteCheckId: paymentResult.check.check_id,
        sendViaPaynote: 'Success',
        status: 'Success',
      });
      const updatedCase = await this.caseRepository.updateById<ICase>(
        payment.caseId._id,
        {$inc: {remainingAmountPaid: payment.amount}}
      );
      if (updatedCase.remaining === updatedCase.remainingAmountPaid) {
        const creditors = await creditorUtil.getCreditorsEmailForDebtor(
          String(payment.caseId.debtor._id),
          String(payment.caseId.creditor._id)
        );
        emailUtil.sendEmailIfDebtorPaysDebt(
          payment.caseId,
          payment.caseId.debtor,
          creditors
        );
      }
    }
    return [true, 'Payment Successfull'];
  }

  getRetryDate(unit: string, value: number, dueDate: string) {
    const dueDateTemp = new Date(dueDate);
    let thresholdDate = new Date(dueDateTemp);
    switch (unit) {
      case 'hours':
        thresholdDate.setHours(dueDateTemp.getHours() + value);
        break;
      case 'days':
        thresholdDate.setDate(dueDateTemp.getDate() + value);
        break;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
    return thresholdDate.toUTCString();
  }

  async cancelCasePaymentPlan(req: Request) {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) return [false, constants.notFoundMessage('case')];
    const updateCase = await this.caseRepository.updateById<ICase>(
      req.params.id,
      {
        intervals: [],
        isExempt: false,
      }
    );
    const updatePayments = await this.paymentRepository.updateMany<IPayment>(
      {
        caseId: req.params.id,
        authorized: {$in: ['Pending', 'Failed']},
        $or: [{lawsuitId: {$exists: false}}, {lawsuitId: null}],
      },
      {
        isDeleted: true,
      }
    );
    // const updateDebtor = await this.debtorReposiotry.updateById<IPayment>(
    //   String(caseTemp.debtor),
    //   {
    //     weeklyCommission: 0,
    //   }
    // );
    if (!updateCase || !updatePayments)
      return [false, 'Failed to cancel payment plan'];
    return [true, 'Payment plan cancelled successfully'];
  }

  async cancelDebtorPaymentPlan(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const updateDebtor = await this.debtorRepository.updateById<IDebtor>(
      req.params.id,
      {
        intervals: [],
        isExempt: false,
        paymentPauseCount: 0,
        lastPaymentPauseDate: '',
        paymentAmountCount: 0,
        lastPaymentAmountDate: '',
      }
    );
    const updatePayments = await this.paymentRepository.updateMany<IPayment>(
      {
        debtorId: req.params.id,
        $or: [{authorized: 'Pending'}, {authorized: 'Failed'}],
        caseId: {$eq: null},
        paymentMode: {$ne: 'Link'},
      },
      {
        isDeleted: true,
      }
    );
    if (!updateDebtor || !updatePayments)
      return [false, 'Failed to cancel payment plan'];
    return [true, 'Payment plan cancelled successfully'];
  }

  async cancelAllDebtorPaymentPlan(req: Request) {
    const debtor = await this.debtorRepository.getById<IDebtor>(req.params.id);
    if (!debtor) return [false, constants.notFoundMessage('debtor')];
    const updateDebtor = await this.debtorRepository.updateById<IDebtor>(
      req.params.id,
      {
        intervals: [],
        isExempt: false,
        paymentPauseCount: 0,
        lastPaymentPauseDate: '',
        paymentAmountCount: 0,
        lastPaymentAmountDate: '',
      }
    );
    const updateCommisionPayments =
      await this.paymentRepository.updateMany<IPayment>(
        {
          debtorId: req.params.id,
          $or: [{authorized: 'Pending'}, {authorized: 'Failed'}],
          caseId: {$eq: null},
          transactionType: {$ne: 'Link'},
        },
        {
          isDeleted: true,
        }
      );

    const debtorCases =
      await this.caseRepository.getAllWithoutPagination<ICase>({
        debtor: req.params.id,
        isDeleted: {$ne: true},
      });

    if (!debtorCases) return [false, constants.notFoundMessage('case')];
    for (const caseTemp of debtorCases) {
      const updateCase = await this.caseRepository.updateById<ICase>(
        caseTemp._id,
        {
          intervals: [],
          isExempt: false,
        }
      );
      const updateCreditorPayments =
        await this.paymentRepository.updateMany<IPayment>(
          {
            caseId: caseTemp._id,
            $or: [{authorized: 'Pending'}, {authorized: 'Failed'}],
          },
          {
            isDeleted: true,
          }
        );
    }

    return [true, 'Payment plan cancelled successfully'];
  }

  async getRelatedPayments(req: Request) {
    let payments: IPayment[] =
      await this.paymentRepository.getAllWithoutPagination<IPayment>(
        {
          debtorTransId: req.params.id,
        },
        undefined,
        undefined,
        {_id: -1}
      );

    if (!payments.length) {
      return [false, constants.notFoundMessage('payments')];
    }

    const groupedByTransId = payments.reduce((acc, item) => {
      if (!acc[item.debtorTransId]) {
        acc[item.debtorTransId] = [];
      }
      acc[item.debtorTransId].push(item);
      return acc;
    }, {});

    return [true, groupedByTransId];
  }

  async updatePaymentLinkStatus(req: Request) {
    const payment: any = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: req.params.token,
    });
    if (!payment) return [false, constants.notFoundMessage('payment link')];
    await this.paymentRepository.updateByOne<IPayment>(
      {debtorTransId: req.params.token},
      {status: req.body.status}
    );
    let results = null;
    let caseIds = null;
    if (req.body.status === 'Success') {
      const debtor = await this.debtorRepository.getOne<IDebtor>({
        _id: payment.debtorId,
      });

      const creditorNames = await caseUtil.getCreditorNames(
        debtor,
        debtor.extractedFields
      );

      const caseTemp = await googleDriveUtil.mapCreditorsCases(
        debtor.extractedFields,
        creditorNames
      );

      for (const bin of caseTemp) {
        bin['platform'] = true;
        bin.creditor.platform = true;
      }

      results = await caseUtil.createCreditorsCases(
        {data: caseTemp},
        '',
        '',
        payment.debtorId
      );
      const caseList = Array.isArray(results[1]) ? results[1] : results;
      caseIds = caseList.map(result => ({
        caseId: result._id,
        caseCode: result.caseCode,
        debtorId: result.debtor,
        creditorId: result.creditor,
      }));
    }

    return [true, caseIds];
  }

  async getPaymentLinkStatus(req: Request) {
    const payment = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: req.params.token,
    });
    if (!payment) return [false, constants.notFoundMessage('status')];
    return [true, {status: payment.status}];
  }

  async updatePaymentInvoiceStatus(req: Request) {
    const payment: any = await this.paymentRepository.getOne<IPayment>({
      debtorTransId: req.params.token,
    });
    if (!payment) return [false, constants.notFoundMessage('payment Invoice')];
    await this.paymentRepository.updateByOne<IPayment>(
      {debtorTransId: req.params.token},
      {status: req.body.status}
    );
    let results = null;
    let caseIds = null;
    if (req.body.status === 'Success') {
      const debtor = await this.debtorRepository.getOne<IDebtor>({
        _id: payment.debtorId,
      });

      const creditorNames = await caseUtil.getCreditorNames(
        debtor,
        debtor.extractedFields
      );

      const caseTemp = await googleDriveUtil.mapCreditorsCases(
        debtor.extractedFields,
        creditorNames
      );

      for (const bin of caseTemp) {
        bin['platform'] = true;
        bin.creditor.platform = true;
      }

      results = await caseUtil.createCreditorsCases(
        {data: caseTemp},
        '',
        '',
        payment.debtorId
      );
      const caseList = Array.isArray(results[1]) ? results[1] : results;
      caseIds = caseList.map(result => ({
        caseId: result._id,
        caseCode: result.caseCode,
        debtorId: result.debtor,
        creditorId: result.creditor,
      }));
    }

    return [true, caseIds];
  }

  async addPaymentPlan(req: Request) {
    let findCase: any = await this.caseRepository.getById<ICase>(
      req.body.caseId,
      undefined,
      undefined,
      [{path: 'creditor'}, {path: 'debtor'}]
    );

    if (!findCase) {
      return [false, constants.notFoundMessage('Case')];
    }

    let lawsuit = await this.lawsuitRepository.getOne<ILawsuit>({
      debtorId: findCase.debtor,
      creditorId: findCase.creditor._id,
      isDeleted: {$ne: true},
    });
    if (!lawsuit) {
      return [false, constants.notFoundMessage('Lawsuit')];
    }
    if (lawsuit.intervals && lawsuit.intervals.length)
      return [false, constants.alreadyExistsMessage('Payment plan')];

    req.body._id = req.body.caseId;
    req.body.debtor = findCase.debtor._id;
    // req.body.attorneyId = req.params.id;
    req.body.lawsuitId = lawsuit._id;
    lawsuit = await this.lawsuitRepository.updateByOne<ILawsuit>(
      {
        // attorneyId: req.params.id,
        debtorId: findCase.debtor,
        creditorId: findCase.creditor._id,
        isDeleted: {$ne: true},
      },
      {
        intervals: req.body.intervals,
        isExempt: req.body.isExempt,
      }
    );
    console.log(lawsuit);
    req.body.intervals = lawsuit.intervals;
    req.body.debtorName = findCase.debtor.basicInformation.fullName;
    req.body.creditorName = findCase.creditor.basicInformation.fullName;
    caseUtil.createPayment(req.body);

    return [true, constants.successAddMessage('Payment plan')];
  }

  async updatePaymentDate(req: Request) {
    let payment = await this.paymentRepository.getById<IPayment>(req.params.id);

    if (!payment) return [false, constants.notFoundMessage('payment')];

    let updatedPayment = await this.paymentRepository.updateById<IPayment>(
      req.params.id,
      {
        dueDate: req.body.date,
      }
    );

    if (!updatedPayment)
      return [false, constants.failureUpdateMessage('payment')];

    return [true, []];
  }

  async checkInvoice(req: Request) {
    if (req.body.event_type === 'transaction.sale.success') {
      const payment = await this.paymentRepository.getOne<IPayment>({
        debtorTransId: req.body.event_body.transaction_id,
      });
      if (!payment)
        return [false, constants.notFoundMessage('payment invoice')];
      await this.paymentRepository.updateByOne<IPayment>(
        {
          debtorTransId: req.body.event_body.transaction_id,
          transactionType: req.body.event_body.transaction_type,
        },
        {status: 'Success'}
      );
      let results = null;
      let caseIds = null;
      const debtor = await this.debtorRepository.getOne<IDebtor>({
        _id: payment.debtorId,
      });

      const creditorNames = await caseUtil.getCreditorNames(
        debtor,
        debtor.extractedFields
      );

      const caseTemp = await googleDriveUtil.mapCreditorsCases(
        debtor.extractedFields,
        creditorNames
      );

      for (const bin of caseTemp) {
        bin['platform'] = true;
        bin.creditor.platform = true;
      }

      results = await caseUtil.createCreditorsCases(
        {data: caseTemp},
        '',
        '',
        payment.debtorId
      );
      const caseList = Array.isArray(results[1]) ? results[1] : [];
      console.log(caseList, 'caseList');
      caseIds = caseList.map(result => ({
        caseId: result._id,
        caseCode: result.caseCode,
        debtorId: result.debtor,
        creditorId: result.creditor,
      }));
      console.log(caseIds, 'caseIds');
      let caseIdTemp = caseList.map(result => result._id);
      console.log(caseIdTemp, 'caseIdTemp');
      let caseData = await caseUtil.getCaseCreditorPartialData(caseIdTemp);
      console.log(caseData);

      return [
        true,
        {
          casesCreated: caseData,
          invoiceData: {
            invoiceId: payment.debtorTransId,
            transactionType: req.body.event_body.transaction_type,
            paymentGateway: payment.paymentGateway,
            status: 'Success',
          },
          debtorId: payment.debtorId,
        },
      ];
    }

    if (req.body.event_type === 'transaction.sale.failed') {
      const payment = await this.paymentRepository.getOne<IPayment>({
        debtorTransId: req.body.event_body.transaction_id,
      });
      if (!payment)
        return [false, constants.notFoundMessage('payment invoice')];
      await this.paymentRepository.updateByOne<IPayment>(
        {debtorTransId: req.body.event_body.transaction_id},
        {status: 'Failed'}
      );
      return [
        true,
        {
          casesCreated: [],
          invoiceData: {
            invoiceId: payment.debtorTransId,
            transactionType: payment.transactionType,
            paymentGateway: payment.paymentGateway,
            status: 'Failed',
          },
          debtorId: payment.debtorId,
        },
      ];
    }
    return [true, []];
  }

  async getInstantPayment(req: Request) {
    const debtor: IDebtor = await this.debtorRepository.getById<IDebtor>(
      req.params.id
    );
    if (!debtor) [false, constants.notFoundMessage('debtor')];

    let payment = await this.paymentRepository.getOne<IPayment>({
      debtorId: req.params.id,
      caseId: null,
      status: 'Upcoming',
      isDeleted: false,
    });

    if (!payment) return [false, constants.notFoundMessage('payment')];
    let amount = 0;
    let legalFeeAmount = 0;
    let serviceFeeAmount = 0;
    let otherPayments: IPayment[] = [];
    if (!payment.caseId) {
      otherPayments = await paymentUtil.getOtherPayments(payment);
      legalFeeAmount = await lawsuitUtil.getTotalLegalFee(otherPayments);
      serviceFeeAmount = await lawsuitUtil.getTotalServiceFee(
        otherPayments.length ? [otherPayments[0]] : otherPayments
      );
      amount = payment.amount;
    }
    const response: any = await paymentUtil.getInstantPayment(
      amount,
      debtor,
      payment
    );
    if (response[0]) {
      const concatedPayments = otherPayments.concat(payment);
      const paymentObj = response[1];
      paymentObj['legalFee'] = legalFeeAmount;
      paymentObj['serviceFee'] = serviceFeeAmount;
      paymentObj['paymentReference'] = v4();
      paymentObj['paymentReferenceBool'] = true;
      for (const payment of concatedPayments) {
        await this.paymentRepository.updateById<IPayment>(
          payment._id,
          paymentObj
        );
      }
    }
    if (!response[0])
      return [
        false,
        response[1]?.failedReasonAuthorization || 'Unable to get payment',
      ];
    return response;
  }

  async getCaseAttorneyPayments(req: Request) {
    const caseTemp = await this.caseRepository.getById<ICase>(req.params.id);
    if (!caseTemp) return [false, constants.notFoundMessage('case')];
    const pageLimit = await commonUtil.getPageAndLimit(1, 10, req);
    const lawSuit = await this.lawsuitRepository.getOne<ILawsuit>({
      debtorId: caseTemp.debtor,
      creditorId: caseTemp.creditor,
      isDeleted: {$ne: true},
    });
    if (!lawSuit) return [false, constants.notFoundMessage('lawsuit')];
    const filters = {
      caseId: caseTemp._id,
      lawsuitId: lawSuit._id,
      isDeleted: false,
    };
    const sendViaPaynoteFilter = {
      ...filters,
      $or: [{sendViaPaynote: 'Success'}, {sendViaPaynote: 'Failed'}],
    };
    const upcomingFilter = {
      ...filters,
      status: 'Upcoming',
    };
    const payments: IPayment[] = await this.getAttorneyPayments(
      pageLimit.page,
      pageLimit.limit,
      sendViaPaynoteFilter
    );
    const paymentsUpcoming: IPayment[] = await this.getAttorneyPayments(
      pageLimit.page,
      pageLimit.limit,
      upcomingFilter
    );
    const paymentsUpcomingCount =
      await this.getAttorneyPaymentsCount(upcomingFilter);
    const paymentsCount =
      await this.getAttorneyPaymentsCount(sendViaPaynoteFilter);
    return [
      true,
      {
        payments,
        paymentsUpcoming,
        paymentsUpcomingCount,
        paymentsCount,
      },
    ];
  }

  async paynoteWebhook(req: Request) {
    console.log(req.body, 'req.body');
    return paynoteUtil.paynoteWebhook(req.body);
  }

  async getClientPendingChecks(req: Request): Promise<[boolean, {} | string]> {
    let days = Number(req.query.days);
    let counts = {};
    let filters = {
      caseId: {$eq: null},
      paymentMode: 'Direct Post',
      checkStatus: 'Pending',
      isDeleted: false,
    };
    if (days) {
      filters = await this.getDaysFilterPopulated(filters, days);
    }
    const populatedFiltersResult = await this.populateFilterCreditor(
      {...filters},
      req,
      'captured',
      'Pending'
    );
    let page = populatedFiltersResult.page;
    let limit = populatedFiltersResult.limit;
    let finalFilters = populatedFiltersResult.filters;
    let payments: any = await this.getAllPaymentsQuery(
      finalFilters,
      page,
      limit
    );
    if (!payments.length) {
      return [false, constants.notFoundMessage('Payments')];
    }

    if (req.query.filters !== 'true' && req.query.search !== 'true') {
      const count =
        await this.paymentRepository.getCount<IPayment>(finalFilters);
      counts['pendingCheckPayments'] = count;
    }
    if (req.query.filters === 'true' || req.query.search === 'true') {
      if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page) ? Number(req.query.page) : page;
      }
      if (req.query.limit && !isNaN(Number(req.query.limit))) {
        limit = Number(req.query.limit) ? Number(req.query.limit) : limit;
      }
      payments = await paymentUtil.searchAndFilterHomePayments(payments, req);
      counts['pendingCheckPayments'] = payments?.length;
      payments = payments?.slice((page - 1) * limit, page * limit);
    }
    return [
      true,
      {
        pendingCheckPayments: payments,
        counts: counts,
      },
    ];
  }
}

export default PaymentService;
