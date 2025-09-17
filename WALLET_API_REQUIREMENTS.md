# Wallet Dashboard API Requirements

## Overview
This document outlines all the API endpoints required for the Wallet Management Dashboard functionality. These endpoints are currently called by the frontend but need to be implemented in the backend.

## Required API Endpoints

### 1. Dashboard Statistics Endpoint
**Endpoint:** `GET /api/wallet/dashboard/stats`
**Used by:** Main dashboard cards
**Purpose:** Provides overview statistics for the wallet dashboard

#### Response Format:
```json
{
  "success": true,
  "stats": {
    "total_balance_cents": 1500000,          // Total wallet balance across all customers (in cents)
    "customers_with_balance": 142,           // Number of customers with positive wallet balance
    "open_credit_slips": 8,                  // Number of unpaid/open credit slips
    "recent_transactions_count": 23          // Number of transactions in last 7 days
  }
}
```

#### Implementation Notes:
- `total_balance_cents`: Sum of all positive wallet balances across all customers (convert to cents)
- `customers_with_balance`: Count of customers where wallet_balance > 0
- `open_credit_slips`: Count of credit slips with status 'OPEN' or 'PENDING'
- `recent_transactions_count`: Count of wallet transactions in last 7 days

---

### 2. Customers with Balance Endpoint
**Endpoint:** `GET /api/wallet/customers-with-balance`
**Used by:** "Customers with Balance" component on dashboard
**Purpose:** Returns list of customers who have positive wallet balances

#### Query Parameters:
- `limit` (optional): Number of customers to return (default: 10)

#### Response Format:
```json
{
  "success": true,
  "customers": [
    {
      "customer_id": "customer_123",
      "name": "John Doe",                    // Or "customer_name"
      "phone_number": "+255123456789",       // Or "phone"
      "wallet_balance_cents": 50000,         // Current wallet balance in cents
      "outstanding_cents": 25000,            // Outstanding credit slip balance (optional)
      "last_transaction": "2025-09-15T10:30:00Z"  // Or "last_transaction_date"
    }
  ]
}
```

#### Implementation Notes:
- Filter customers where wallet_balance > 0
- Order by wallet_balance DESC or last_transaction DESC
- Include customer's basic info and current wallet balance
- Convert amounts to cents for consistency

---

### 3. Recent Transactions Endpoint
**Endpoint:** `GET /api/wallet/transactions/recent`
**Used by:** "Recent Transactions" component on dashboard
**Purpose:** Returns recent wallet transaction activity

#### Query Parameters:
- `limit` (optional): Number of transactions to return (default: 10)

#### Response Format:
```json
{
  "success": true,
  "transactions": [
    {
      "entry_id": "txn_456",                 // Or "id"
      "entry_type": "PAYMENT",               // Or "type" - see transaction types below
      "direction": "CREDIT",                 // CREDIT or DEBIT (or calculate from amount)
      "customer_name": "Jane Smith",         // Customer name
      "amount_cents": 25000,                 // Transaction amount in cents (absolute value)
      "description": "Payment received",     // Optional - can be generated from type
      "occurred_at": "2025-09-17T14:20:00Z", // Or "created_at"
      "customer": {                          // Optional nested customer object
        "name": "Jane Smith"
      }
    }
  ]
}
```

#### Transaction Types:
- `PAYMENT`: Customer payment received
- `SALE_ON_CREDIT`: Credit slip created
- `CHANGE_TO_BALANCE`: Change stored in wallet
- `BALANCE_CONSUMPTION`: Wallet balance used to pay credit slip
- `DEPOSIT`: Direct deposit to wallet

#### Implementation Notes:
- Order by occurred_at/created_at DESC
- Include last 7-30 days of transactions
- Amounts should be in cents
- Direction can be calculated: positive amounts = CREDIT, negative = DEBIT

---

### 4. Error Response Format
All endpoints should return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Descriptive error message",
    "code": "ERROR_CODE",
    "details": "Additional error details (optional)"
  }
}
```

## Database Schema Considerations

### Expected Tables/Fields:
1. **Customers Table:**
   - `customer_id` or `id`
   - `name` or `customer_name`
   - `phone_number` or `phone`
   - `wallet_balance_cents` or similar

2. **Transactions/Wallet_Entries Table:**
   - `entry_id` or `id`
   - `customer_id`
   - `entry_type` or `type`
   - `amount_cents`
   - `direction` (or calculate from amount)
   - `description`
   - `occurred_at` or `created_at`

3. **Credit_Slips Table:**
   - `slip_id`
   - `customer_id`
   - `status` (OPEN, PAID, VOID)
   - `total_cents`
   - `created_at`

## Authentication & Authorization
- All endpoints require staff authentication
- Use existing staff token validation
- Return 401 for unauthorized requests
- Return 403 for insufficient permissions

## Performance Considerations
1. **Caching:** Consider caching dashboard stats for 5-10 minutes
2. **Indexing:** Add indexes on:
   - `wallet_balance_cents` for customers
   - `occurred_at/created_at` for transactions
   - `customer_id` for joins
3. **Pagination:** Implement proper pagination for larger datasets

## Testing Requirements
- Test with empty data (no customers, no transactions)
- Test with large datasets
- Test error scenarios (database down, invalid queries)
- Test with various date ranges

## Current Frontend Data Normalization
The frontend currently normalizes different field names, so any of these field variations will work:
- `customer_id` or `id`
- `name` or `customer_name` 
- `phone_number` or `phone`
- `wallet_balance_cents` or `balance_cents`
- `entry_id` or `id`
- `entry_type` or `type`
- `occurred_at` or `created_at`

This provides flexibility in your backend implementation.

## Priority Implementation Order
1. **Dashboard Stats** (highest priority - main dashboard cards)
2. **Customers with Balance** (medium priority - dashboard component)
3. **Recent Transactions** (medium priority - dashboard component)

## Sample SQL Queries (PostgreSQL)

### Dashboard Stats:
```sql
-- Total balance
SELECT COALESCE(SUM(wallet_balance_cents), 0) as total_balance_cents 
FROM customers 
WHERE wallet_balance_cents > 0;

-- Customers with balance
SELECT COUNT(*) as customers_with_balance 
FROM customers 
WHERE wallet_balance_cents > 0;

-- Open credit slips
SELECT COUNT(*) as open_credit_slips 
FROM credit_slips 
WHERE status IN ('OPEN', 'PENDING');

-- Recent transactions (last 7 days)
SELECT COUNT(*) as recent_transactions_count 
FROM wallet_transactions 
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### Customers with Balance:
```sql
SELECT 
  customer_id,
  name,
  phone_number,
  wallet_balance_cents,
  (SELECT COALESCE(SUM(remaining_balance_cents), 0) 
   FROM credit_slips 
   WHERE customer_id = c.customer_id AND status = 'OPEN') as outstanding_cents,
  last_transaction_date
FROM customers c
WHERE wallet_balance_cents > 0
ORDER BY wallet_balance_cents DESC
LIMIT $1;
```

### Recent Transactions:
```sql
SELECT 
  wt.entry_id,
  wt.entry_type,
  wt.amount_cents,
  wt.description,
  wt.created_at as occurred_at,
  c.name as customer_name,
  CASE WHEN wt.amount_cents > 0 THEN 'CREDIT' ELSE 'DEBIT' END as direction
FROM wallet_transactions wt
JOIN customers c ON wt.customer_id = c.customer_id
ORDER BY wt.created_at DESC
LIMIT $1;
```