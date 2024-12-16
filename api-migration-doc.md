# EasyPayDirect API Migration Guide
**Migration from Paynote to EasyPayDirect Payment Processing**

## Table of Contents
1. [Overview](#overview)
2. [Authentication Changes](#authentication)
3. [API Endpoint Mapping](#endpoints)
4. [Implementation Changes](#implementation)
5. [Data Schema Updates](#schema)
6. [Testing Guidelines](#testing)

## Overview
This document outlines the migration process from Paynote to EasyPayDirect payment processing system. The migration involves updating API endpoints, authentication methods, and data structures to align with EasyPayDirect's requirements.

## Authentication
### Current (Paynote)
```
Authorization: secretKey
```

### New (EasyPayDirect)
```
ApiKey: your_api_key
Content-Type: application/json
```

### Environment Variables Update
```
# Remove
PAYNOTE_URL=
PAYNOTE_SECRET_KEY=

# Add
EASY_PAY_DIRECT_URL=https://api.easypaydirect.com/v1
EASY_PAY_DIRECT_API_KEY=your_api_key
```

## API Endpoint Mapping

### Customer Management

#### Create Customer
**Paynote**
- Endpoint: `/user`
- Method: POST
- Payload:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

**EasyPayDirect**
- Endpoint: `/v1/customers`
- Method: POST
- Documentation: [Create Customer](https://docs.easypaydirect.com/api/v1#/Customer/post_customers)
- Payload:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "customer_type": "individual"
}
```

#### Get Customer
**Paynote**
- Endpoint: `/user/:id`
- Method: GET

**EasyPayDirect**
- Endpoint: `/v1/customers/{customer_id}`
- Method: GET
- Documentation: [Get Customer](https://docs.easypaydirect.com/api/v1#/Customer/get_customers__customer_id_)

#### Update Customer
**Paynote**
- Endpoint: `/user/{id}/update`
- Method: POST

**EasyPayDirect**
- Endpoint: `/v1/customers/{customer_id}`
- Method: PUT
- Documentation: [Update Customer](https://docs.easypaydirect.com/api/v1#/Customer/put_customers__customer_id_)

### Payment Processing

#### Create Payment
**Paynote**
- Endpoint: `/check/send`
- Method: POST
- Payload:
```json
{
  "recipient": "user_id",
  "amount": 100.00,
  "description": "Payment description"
}
```

**EasyPayDirect**
- Endpoint: `/v1/transactions`
- Method: POST
- Documentation: [Create Transaction](https://docs.easypaydirect.com/api/v1#/Transaction/post_transactions)
- Payload:
```json
{
  "customer_id": "cust_123",
  "amount": 100.00,
  "currency": "USD",
  "description": "Payment description",
  "payment_method_id": "pm_123",
  "transaction_type": "sale"
}
```

#### Get Payment Status
**Paynote**
- Endpoint: `/check/:checkId`
- Method: GET

**EasyPayDirect**
- Endpoint: `/v1/transactions/{transaction_id}`
- Method: GET
- Documentation: [Get Transaction](https://docs.easypaydirect.com/api/v1#/Transaction/get_transactions__transaction_id_)

### Payment Methods

#### Add Payment Method
**Paynote**
- Endpoint: `/funding-source`
- Method: POST

**EasyPayDirect**
- Endpoint: `/v1/payment-methods`
- Method: POST
- Documentation: [Create Payment Method](https://docs.easypaydirect.com/api/v1#/Payment%20Method/post_payment_methods)
- Sample ACH Payload:
```json
{
  "customer_id": "cust_123",
  "payment_type": "ach",
  "account_number": "123456789",
  "routing_number": "123456789",
  "account_type": "checking"
}
```
- Sample Card Payload:
```json
{
  "customer_id": "cust_123",
  "payment_type": "credit_card",
  "card_number": "4111111111111111",
  "expiration_month": "12",
  "expiration_year": "2025",
  "cvv": "123"
}
```

## Implementation Changes

### Database Schema Updates
```typescript
// Current
interface ICreditor {
  paynoteUserId?: string;
  // other fields
}

// New
interface ICreditor {
  easyPayDirectCustomerId?: string;
  // other fields
}

// New Payment Method Interface
interface IPaymentMethod {
  id: string;
  type: 'ach' | 'credit_card';
  customerId: string;
  last4: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Implementation Differences

1. Payment Method Handling
   - EasyPayDirect requires payment methods to be created before processing payments
   - No separate verification process for ACH accounts
   - Support for both ACH and credit card payments

2. Transaction Processing
   - Direct payment processing instead of check-based system
   - Immediate transaction status available
   - Support for various transaction types (sale, auth, capture, void, refund)

3. Error Handling
   - More detailed error responses
   - Specific error codes for different scenarios
   - Enhanced validation requirements

## Testing Guidelines

1. Test Environment Setup
   ```typescript
   // Update environment variables for test
   EASY_PAY_DIRECT_URL=https://api-sandbox.easypaydirect.com/v1
   EASY_PAY_DIRECT_API_KEY=your_test_api_key
   ```

2. Test Cases
   - Customer Creation
   - Payment Method Addition (ACH & Card)
   - Transaction Processing
   - Error Scenarios
   - Refund Processing
   - Void Transactions

3. Test Card Numbers
   ```
   Visa: 4111111111111111
   Mastercard: 5555555555554444
   Test Mode ACH: Use any valid routing number
   ```

## Support and Resources
- [EasyPayDirect API Documentation](https://docs.easypaydirect.com/api/v1)
- [API Support](https://support.easypaydirect.com)
- [Integration Guide](https://docs.easypaydirect.com/docs)

