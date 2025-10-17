# Customer Wallet System API Documentation

## Overview

The Customer Wallet System provides comprehensive financial management capabilities for tracking customer balances, credit slips, payments, and transaction history. The system operates independently of Loyverse orders and maintains an immutable ledger for all financial transactions.

## Base URL
```
https://your-domain.com/api/wallet
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "respCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

Error responses:
```json
{
  "respCode": 400,
  "message": "Error message",
  "details": "Additional error details"
}
```

## Endpoints

### 1. Create Credit Slip

Create a new credit slip for items taken but not fully paid.

**Endpoint:** `POST /api/wallet/credit-slips`  
**Authentication:** Required (JWT)  
**Role:** Any authenticated user

#### Request Body
```json
{
  "customer_id": "CUST001",
  "store_id": "STORE001",
  "currency": "USD",
  "lines": [
    {
      "item_id": "ITEM001",
      "description": "Coffee Beans 1kg",
      "quantity": 2,
      "unit_price_cents": 1500
    },
    {
      "item_id": "ITEM002",
      "description": "Milk 1L",
      "quantity": 1,
      "unit_price_cents": 300
    }
  ],
  "tax_cents": 330,
  "discount_cents": 100,
  "occurred_at": "2024-01-15T10:30:00Z"
}
```

#### Response (201 Created)
```json
{
  "respCode": 201,
  "message": "Credit slip created successfully",
  "slip_id": "65a1b2c3d4e5f6789012345",
  "slip_number": "CS-20240115103000-A1B2C3D4",
  "grand_total_cents": 3530
}
```

---

### 2. Process Payment

Record a payment and allocate it to credit slips and/or wallet.

**Endpoint:** `POST /api/wallet/payments`  
**Authentication:** Required (JWT)  
**Role:** Any authenticated user

#### Request Body
```json
{
  "customer_id": "CUST001",
  "store_id": "STORE001",
  "currency": "USD",
  "method": "CASH",
  "amount_cents": 4000,
  "allocations": [
    {
      "type": "slip",
      "slip_id": "65a1b2c3d4e5f6789012345",
      "applied_cents": 3530
    },
    {
      "type": "wallet",
      "applied_cents": 470
    }
  ],
  "occurred_at": "2024-01-15T10:35:00Z"
}
```

#### Response (200 OK)
```json
{
  "respCode": 200,
  "message": "Payment processed successfully",
  "payment_id": "65a1b2c3d4e5f6789012346",
  "applied_total": 3530,
  "wallet_topup": 470,
  "slip_results": [
    {
      "success": true,
      "allocated_amount": 3530,
      "new_status": "CLOSED",
      "remaining_total": 0
    }
  ]
}
```

---

### 3. Apply Wallet to Slip

Use customer's wallet balance to pay down a credit slip.

**Endpoint:** `POST /api/wallet/apply-wallet`  
**Authentication:** Required (JWT)  
**Role:** Customer (own wallet) or Staff (any wallet)

#### Request Body
```json
{
  "customer_id": "CUST001",
  "slip_id": "65a1b2c3d4e5f6789012345",
  "currency": "TZS"
}
```

#### Response (200 OK)
```json
{
  "respCode": 200,
  "message": "Applied 1500 cents from wallet to slip",
  "applied_cents": 1500,
  "slip_status": "PARTIALLY_PAID",
  "remaining_slip_balance": 2030
}
```

---

### 4. Store Change as Balance

Store customer change as wallet balance when exact change isn't available.

**Endpoint:** `POST /api/wallet/store-change`  
**Authentication:** Required (JWT)  
**Role:** Staff only

#### Request Body
```json
{
  "customer_id": "CUST001",
  "store_id": "STORE001",
  "currency": "USD",
  "change_cents": 250
}
```

#### Response (200 OK)
```json
{
  "respCode": 200,
  "message": "Successfully stored 250 cents as wallet balance",
  "wallet_added": 250
}
```

---

### 5. Get Customer Balance

Retrieve customer's current balance information.

**Endpoint:** `GET /api/wallet/balance/{customer_id}`  
**Authentication:** Required (JWT)  
**Role:** Customer (own balance) or Staff (any balance)

#### Query Parameters
- `currency` (optional): Specific currency code (USD, TZS, EUR). If omitted, returns all currencies.

#### Examples

**Single Currency:**
```
GET /api/wallet/balance/CUST001?currency=USD
```

**All Currencies:**
```
GET /api/wallet/balance/CUST001
```

#### Response - Single Currency (200 OK)
```json
{
  "respCode": 200,
  "message": "Balance retrieved successfully",
  "balance": {
    "customer_id": "CUST001",
    "currency": "USD",
    "balance_cents": 750,
    "wallet_cents": 750,
    "outstanding_cents": 0,
    "open_slips_count": 2,
    "open_slips_total": 0
  }
}
```

#### Response - All Currencies (200 OK)
```json
{
  "respCode": 200,
  "message": "Multi-currency balance retrieved successfully",
  "balance": {
    "customer_id": "CUST001",
    "currencies": [
      {
        "currency": "USD",
        "balance_cents": 750,
        "wallet_cents": 750,
        "outstanding_cents": 0,
        "open_slips_count": 0,
        "account_status": "ACTIVE"
      },
      {
        "currency": "TZS",
        "balance_cents": -50000,
        "wallet_cents": 0,
        "outstanding_cents": 50000,
        "open_slips_count": 1,
        "account_status": "ACTIVE"
      }
    ]
  }
}
```

---

### 6. Get Open Credit Slips

Retrieve customer's open and partially paid credit slips.

**Endpoint:** `GET /api/wallet/slips/{customer_id}`  
**Authentication:** Required (JWT)  
**Role:** Customer (own slips) or Staff (any slips)

#### Query Parameters
- `currency` (optional): Filter by currency code

#### Example
```
GET /api/wallet/slips/CUST001?currency=USD
```

#### Response (200 OK)
```json
{
  "respCode": 200,
  "message": "Open slips retrieved successfully",
  "customer_id": "CUST001",
  "currency": "USD",
  "slips_count": 2,
  "slips": [
    {
      "_id": "65a1b2c3d4e5f6789012345",
      "slip_number": "CS-20240115103000-A1B2C3D4",
      "customer_id": "CUST001",
      "store_id": "STORE001",
      "currency": "USD",
      "status": "PARTIALLY_PAID",
      "lines": [
        {
          "item_id": "ITEM001",
          "description": "Coffee Beans 1kg",
          "quantity": 2,
          "unit_price_cents": 1500,
          "line_total_cents": 3000,
          "paid_cents": 1500,
          "remaining_cents": 1500
        }
      ],
      "totals": {
        "subtotal_cents": 3000,
        "tax_cents": 300,
        "discount_cents": 0,
        "grand_total_cents": 3300,
        "paid_cents": 1500,
        "remaining_cents": 1800
      },
      "occurred_at": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

### 7. Get Transaction History

Retrieve paginated transaction history for a customer.

**Endpoint:** `GET /api/wallet/history/{customer_id}`  
**Authentication:** Required (JWT)  
**Role:** Customer (own history) or Staff (any history)

#### Query Parameters
- `currency` (required): Currency code
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20, max: 100)

#### Example
```
GET /api/wallet/history/CUST001?currency=USD&page=1&per_page=10
```

#### Response (200 OK)
```json
{
  "respCode": 200,
  "message": "Transaction history retrieved successfully",
  "customer_id": "CUST001",
  "currency": "USD",
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total_entries": 25,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "entries": [
    {
      "entry_id": "65a1b2c3d4e5f6789012347",
      "entry_type": "PAYMENT",
      "direction": "CREDIT",
      "amount_cents": 470,
      "occurred_at": "2024-01-15T10:35:00Z",
      "description": "Payment 65a1b2c3d4e5f6789012346 - slip allocations",
      "source": {
        "type": "payment",
        "payment_id": "65a1b2c3d4e5f6789012346",
        "store_id": "STORE001"
      },
      "created_at": "2024-01-15T10:35:00Z"
    },
    {
      "entry_id": "65a1b2c3d4e5f6789012348",
      "entry_type": "SALE_ON_CREDIT",
      "direction": "DEBIT",
      "amount_cents": 3530,
      "occurred_at": "2024-01-15T10:30:00Z",
      "description": "Credit slip CS-20240115103000-A1B2C3D4 - 2 items",
      "source": {
        "type": "slip",
        "slip_id": "65a1b2c3d4e5f6789012345",
        "slip_number": "CS-20240115103000-A1B2C3D4",
        "store_id": "STORE001"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 8. Get Audit Trail (Staff Only)

Retrieve audit trail for wallet operations.

**Endpoint:** `GET /api/wallet/audit-trail`  
**Authentication:** Required (JWT)  
**Role:** Staff only

#### Query Parameters
- `customer_id` (optional): Filter by customer ID
- `operation_type` (optional): Filter by operation type
- `start_date` (optional): Filter by start date (ISO format)
- `end_date` (optional): Filter by end date (ISO format)
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 50, max: 100)

#### Example
```
GET /api/wallet/audit-trail?customer_id=CUST001&operation_type=PAYMENT_PROCESSED&page=1&per_page=20
```

#### Response (200 OK)
```json
{
  "respCode": 200,
  "message": "Audit trail retrieved successfully",
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_entries": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "entries": [
    {
      "audit_id": "65a1b2c3d4e5f6789012349",
      "timestamp": "2024-01-15T10:35:00Z",
      "operation_type": "PAYMENT_PROCESSED",
      "customer_id": "CUST001",
      "amount_cents": 4000,
      "currency": "USD",
      "user_id": "cashier123",
      "user_role": "staff",
      "operation_data": {
        "payment_id": "65a1b2c3d4e5f6789012346",
        "method": "CASH",
        "allocations": [...],
        "slip_allocations": 3530,
        "wallet_allocations": 470
      },
      "request_info": {
        "method": "POST",
        "endpoint": "wallet.process_payment",
        "remote_addr": "192.168.1.100",
        "user_agent": "Mozilla/5.0..."
      }
    }
  ]
}
```

---

## Data Models

### Balance Calculation Formula
```
balance = SUM(CREDIT entries) - SUM(DEBIT entries)
wallet_cents = max(balance, 0)
outstanding_cents = max(-balance, 0)
```

### Entry Types and Directions
- **SALE_ON_CREDIT** → DEBIT (increases debt)
- **PAYMENT** → CREDIT (reduces debt)
- **DEPOSIT** → CREDIT (adds to wallet)
- **CHANGE_TO_BALANCE** → CREDIT (adds to wallet)
- **BALANCE_CONSUMPTION** → DEBIT (uses wallet balance)

### Credit Slip Statuses
- **OPEN**: No payments made
- **PARTIALLY_PAID**: Some payments made, balance remaining
- **CLOSED**: Fully paid
- **VOID**: Cancelled/voided

### Payment Methods
- **CASH**
- **CARD**
- **MOBILE**
- **BANK_TRANSFER**

### Supported Currencies
- **USD** (US Dollar)
- **TZS** (Tanzanian Shilling)
- **EUR** (Euro)

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `INSUFFICIENT_WALLET_BALANCE` | 400 | Not enough wallet balance |
| `INVALID_SLIP_STATUS` | 400 | Cannot modify closed/void slip |
| `PAYMENT_ALLOCATION_ERROR` | 400 | Allocation exceeds payment amount |
| `CUSTOMER_ACCOUNT_NOT_FOUND` | 404 | Customer account doesn't exist |
| `CREDIT_SLIP_NOT_FOUND` | 404 | Credit slip doesn't exist |
| `UNAUTHORIZED_ACCESS` | 403 | Insufficient permissions |
| `DUPLICATE_IDEMPOTENCY_KEY` | 409 | Duplicate transaction |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Usage Examples

### Frontend Integration Examples

#### 1. Create Credit Slip (JavaScript/React)
```javascript
const createCreditSlip = async (slipData) => {
  try {
    const response = await fetch('/api/wallet/credit-slips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getJwtToken()}`
      },
      body: JSON.stringify(slipData)
    });
    
    const result = await response.json();
    
    if (result.respCode === 201) {
      console.log('Credit slip created:', result.slip_number);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error creating credit slip:', error);
    throw error;
  }
};
```

#### 2. Get Customer Balance (JavaScript/React)
```javascript
const getCustomerBalance = async (customerId, currency = null) => {
  try {
    const url = currency 
      ? `/api/wallet/balance/${customerId}?currency=${currency}`
      : `/api/wallet/balance/${customerId}`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${getJwtToken()}`
      }
    });
    
    const result = await response.json();
    
    if (result.respCode === 200) {
      return result.balance;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};
```

#### 3. Process Payment (JavaScript/React)
```javascript
const processPayment = async (paymentData) => {
  try {
    const response = await fetch('/api/wallet/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getJwtToken()}`
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.respCode === 200) {
      console.log('Payment processed:', result.payment_id);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
```

#### 4. Search for Customers
EndPoint:: {{base_url}}/customers/search?id=675ab2c25855c2ccc099e056
Response:: {
    "respCode": 200,
    "message": "Customer retrieved successfully.",
    "customer": {
        "_id": "675ab2c25855c2ccc099e056",
        "name": "Fredy Sabuni",
        "email": "fredmalack15@gmail.com",
        "phone_number": "+255714276333",
        "date_of_birth": "1991-11-06",
        "city": "Dar es Salaam",
        "region": "East",
        "total_points": 5955,
        "loyverse_id": "3aefb338-3621-4108-85ba-8f3e0dd917b1",
        "address": null,
        "country_code": null,
        "created_at": "2024-12-12T09:54:11.000Z",
        "customer_code": null,
        "deleted_at": null,
        "first_visit": "2025-01-25T14:04:15.000Z",
        "last_visit": "2025-08-12T17:59:46.000Z",
        "note": null,
        "postal_code": null,
        "total_spent": 585500,
        "total_visits": 30,
        "updated_at": {
            "$date": "2025-09-05T14:08:13.633Z"
        },
        "nickname": "Fredy",
        "id": "3aefb338-3621-4108-85ba-8f3e0dd917b1",
        "permanent_deletion_at": null
    }
}

#### 5. Get Products on adding credit
Endpoint:: {{base_url}}/api/products/all
Response::
{
    "respBody": {
        "items": [
            {
                "id": "5044851e-4257-450d-8346-7ee84c69e405",
                "handle": "chai-latte",
                "reference_id": null,
                "item_name": "Chai Latte",
                "description": null,
                "track_stock": false,
                "sold_by_weight": false,
                "is_composite": false,
                "use_production": false,
                "category_id": "9b8c3400-9910-499e-9742-6656d6380e68",
                "components": [],
                "primary_supplier_id": null,
                "tax_ids": [],
                "modifier_ids": [],
                "form": "CIRCLE",
                "color": "GREY",
                "image_url": "https://api.loyverse.com/image/5044851e-4257-450d-8346-7ee84c69e405",
                "option1_name": null,
                "option2_name": null,
                "option3_name": null,
                "created_at": "2025-09-05T17:53:56.000Z",
                "updated_at": "2025-09-05T17:54:09.000Z",
                "deleted_at": null,
                "variants": [
                    {
                        "variant_id": "567cb782-0542-4903-ada5-97f642a12ca2",
                        "item_id": "5044851e-4257-450d-8346-7ee84c69e405",
                        "sku": "10066",
                        "reference_variant_id": null,
                        "option1_value": null,
                        "option2_value": null,
                        "option3_value": null,
                        "barcode": null,
                        "cost": 0,
                        "purchase_cost": null,
                        "default_pricing_type": "FIXED",
                        "default_price": 7000,
                        "stores": [
                            {
                                "store_id": "12ef2669-a257-4937-a680-08a4f96c382d",
                                "pricing_type": "FIXED",
                                "price": 7000,
                                "available_for_sale": true,
                                "optimal_stock": null,
                                "low_stock": null
                            },
                            {
                                "store_id": "0b6a7964-c7ac-487d-8045-9a6421dbb274",
                                "pricing_type": "FIXED",
                                "price": 7000,
                                "available_for_sale": false,
                                "optimal_stock": null,
                                "low_stock": null
                            }
                        ],
                        "created_at": "2025-09-05T17:53:56.000Z",
                        "updated_at": "2025-09-05T17:54:09.000Z",
                        "deleted_at": null
                    }
                ]
            },]}}


---

## Testing

### Sample Test Data

#### Test Customer
```json
{
  "customer_id": "TEST_CUST_001",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+255123456789"
}
```

#### Test Credit Slip
```json
{
  "customer_id": "TEST_CUST_001",
  "store_id": "TEST_STORE_001",
  "currency": "USD",
  "lines": [
    {
      "item_id": "TEST_ITEM_001",
      "description": "Test Product",
      "quantity": 1,
      "unit_price_cents": 1000
    }
  ],
  "tax_cents": 100,
  "discount_cents": 0
}
```

---

## Notes for Frontend Developer

1. **All amounts are in cents** - Convert to display currency (divide by 100)
2. **Dates are in ISO format** - Use proper date parsing/formatting
3. **JWT token required** - Implement proper authentication flow
4. **Role-based access** - Check user roles for appropriate UI elements
5. **Error handling** - Always handle API errors gracefully
6. **Pagination** - Implement pagination for transaction history
7. **Real-time updates** - Consider implementing WebSocket for balance updates
8. **Offline support** - Consider caching for offline scenarios

This API provides complete wallet functionality for your application. Let me know if you need any clarification or additional examples!