# Design Document

## Overview

The Pending Bills API Integration feature enhances the existing pending bills functionality by replacing static dummy data with dynamic data fetched from the backend API. The design maintains the existing user interface and user experience while introducing robust API integration, error handling, loading states, and retry mechanisms.

The integration follows the established patterns in the codebase, particularly mirroring the architecture used in the wallet service for consistency and maintainability.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Component  │───▶│   Service Layer  │───▶│   Backend API   │
│ (pending-bills) │    │ (orders-service) │    │ /customers/...  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Loading State  │    │  Error Handling  │    │  Data Transform │
│   Management    │    │   & Retry Logic  │    │   & Validation  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Component Mount**: Pending bills component loads and triggers API call
2. **Service Layer**: Orders service handles API communication with proper error handling
3. **Data Transformation**: Raw API response is transformed to match UI expectations
4. **State Management**: Component state is updated with loading, success, or error states
5. **UI Rendering**: Component renders appropriate UI based on current state

## Components and Interfaces

### 1. Orders Service (`src/api/orders-service.js`)

A new service class following the same patterns as the existing `WalletService`:

```javascript
class OrdersService {
  // Get customer's open orders/pending bills
  async getCustomerOpenOrders(customerId)
  
  // Error handling following wallet service patterns
  handleError(error, defaultMessage)
  
  // Retry logic for failed requests
  executeWithRetry(apiCall, maxRetries, baseDelay)
}
```

**Key Features:**
- Consistent error handling with standardized error responses
- Retry logic for network failures and server errors
- Proper logging for debugging
- Response transformation to match UI expectations

### 2. Enhanced Pending Bills Component (`src/elements/pending-bills.jsx`)

The existing component will be enhanced with:

**State Management:**
```javascript
const [slips, setSlips] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [retryCount, setRetryCount] = useState(0)
```

**API Integration:**
- Replace dummy data loading with API calls
- Implement loading states during data fetching
- Handle API errors gracefully with user-friendly messages
- Provide retry functionality for failed requests

**Data Transformation:**
- Transform API response to match existing UI data structure
- Ensure backward compatibility with existing UI interactions

### 3. Customer Context Integration

The service will integrate with the existing user context to obtain customer identification:

```javascript
// Potential customer ID sources (to be determined during implementation)
const user = useUser()
const customerId = user?.customer_id || user?.id
```

### 4. Loading and Error Components

**Loading State:**
- Skeleton loading animation matching the bill card structure
- Loading spinner for retry operations
- Progress indicators for long-running requests

**Error State:**
- User-friendly error messages
- Retry button for recoverable errors
- Network status indicators
- Fallback to cached data when available

## Data Models

### API Response Model

Actual structure from `{{base_url}}/customers/{{customer_id}}/open-orders`:

```javascript
{
  "respCode": 200,
  "message": "Open orders retrieved successfully.",
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_orders": 1,
    "total_pages": 1
  },
  "orders": [
    {
      "slip_id": "string",
      "slip_number": "string",
      "store_id": "string",
      "currency": "TZS",
      "lines": [
        {
          "item_id": "string",
          "description": "string",
          "quantity": "number",
          "unit_price": "number",
          "line_total": "number",
          "paid": "number",
          "remaining": "number"
        }
      ],
      "totals": {
        "subtotal": "number",
        "tax": "number",
        "discount": "number",
        "grand_total": "number",
        "paid": "number",
        "remaining": "number"
      },
      "status": "OPEN",
      "occurred_at": {
        "$date": "ISO 8601 timestamp"
      },
      "created_at": {
        "$date": "ISO 8601 timestamp"
      },
      "updated_at": {
        "$date": "ISO 8601 timestamp"
      }
    }
  ]
}
```

### UI Data Model

Transformed data structure for the UI (maintaining compatibility):

```javascript
{
  slip_id: order.slip_id,                    // Use slip_id directly
  slip_number: order.slip_number,            // Use slip_number directly
  created_at: order.created_at.$date,        // Extract date from MongoDB format
  grand_total: formatCurrency(order.totals.grand_total), // Format total as currency string
  items: order.lines.map(line => ({         // Transform lines to items
    item_id: line.item_id,
    item_name: line.description,             // Map description to item_name
    quantity: line.quantity,
    price_total: formatCurrency(line.line_total) // Format line total as currency
  }))
}
```

### Error Response Model

Standardized error structure following wallet service patterns:

```javascript
{
  success: false,
  error: {
    message: "string",
    code: "string", 
    severity: "error|warning|info",
    isRetryable: "boolean",
    timestamp: "ISO 8601 timestamp",
    originalError: "Error object"
  }
}
```

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeouts
   - DNS resolution failures
   - Network unavailability
   - **Handling**: Show retry option, cache last successful data

2. **Authentication Errors**
   - Invalid or expired tokens
   - Unauthorized access
   - **Handling**: Redirect to login, clear invalid tokens

3. **Server Errors**
   - 5xx status codes
   - API unavailability
   - **Handling**: Show retry option, exponential backoff

4. **Client Errors**
   - Invalid customer ID
   - Malformed requests
   - **Handling**: Show user-friendly message, log for debugging

5. **Data Errors**
   - Invalid response format
   - Missing required fields
   - **Handling**: Show generic error, fallback to empty state

### Error Recovery Strategies

1. **Automatic Retry**
   - Network errors: 3 retries with exponential backoff
   - Server errors: 2 retries with linear backoff
   - Client errors: No automatic retry

2. **Manual Retry**
   - Retry button for all recoverable errors
   - Clear error state before retry attempt
   - Track retry attempts to prevent infinite loops

3. **Graceful Degradation**
   - Show cached data when available
   - Provide offline indicators
   - Maintain core functionality where possible

4. **User Feedback**
   - Clear, actionable error messages
   - Progress indicators during retry
   - Success confirmation after recovery

## Testing Strategy

### Unit Tests

1. **Orders Service Tests**
   - API call success scenarios
   - Error handling for different error types
   - Data transformation accuracy
   - Retry logic functionality

2. **Component Tests**
   - Loading state rendering
   - Error state rendering
   - Data display accuracy
   - User interaction handling

3. **Integration Tests**
   - End-to-end API integration
   - Error recovery flows
   - State management accuracy
   - UI interaction flows

### Test Data

1. **Mock API Responses**
   - Successful responses with various data scenarios
   - Error responses for different error types
   - Edge cases (empty data, malformed responses)

2. **Component Test Scenarios**
   - Loading states
   - Error states with retry options
   - Success states with data
   - Empty states

### Testing Tools

- Jest for unit testing
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking
- Custom test utilities for common scenarios

## Implementation Considerations

### Performance

1. **Caching Strategy**
   - Cache successful responses for offline access
   - Implement cache invalidation on data changes
   - Use session storage for temporary caching

2. **Request Optimization**
   - Debounce rapid successive requests
   - Cancel pending requests on component unmount
   - Implement request deduplication

3. **Loading Optimization**
   - Show skeleton loading for better perceived performance
   - Implement progressive loading for large datasets
   - Use optimistic updates where appropriate

### Security

1. **Authentication**
   - Validate customer tokens before API calls
   - Handle token refresh automatically
   - Secure customer ID transmission

2. **Data Validation**
   - Validate API responses before processing
   - Sanitize data before display
   - Handle malicious or malformed data gracefully

3. **Error Information**
   - Avoid exposing sensitive error details to users
   - Log detailed errors for debugging
   - Implement proper error boundaries

### Accessibility

1. **Loading States**
   - Provide screen reader announcements for loading
   - Use proper ARIA labels for loading indicators
   - Maintain focus management during state changes

2. **Error States**
   - Announce errors to screen readers
   - Provide keyboard navigation for retry actions
   - Use proper color contrast for error indicators

3. **Data Display**
   - Maintain existing accessibility features
   - Ensure proper heading hierarchy
   - Provide alternative text for visual indicators

### Backward Compatibility

1. **Data Structure**
   - Maintain existing data structure for UI components
   - Transform API responses to match expected format
   - Provide fallback for missing data fields

2. **Component Interface**
   - Keep existing component props and methods
   - Maintain existing event handlers
   - Preserve existing styling and layout

3. **State Management**
   - Integrate with existing app state patterns
   - Maintain compatibility with existing providers
   - Preserve existing user interaction flows