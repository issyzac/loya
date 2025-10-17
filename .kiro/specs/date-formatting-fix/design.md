# Design Document

## Overview

This design addresses the invalid date display issues in the customer wallet interface by implementing a robust, centralized date formatting system. The solution focuses on creating a defensive date utility that gracefully handles invalid inputs and provides consistent formatting across all wallet components.

## Architecture

### Core Components

1. **Date Formatting Utility** (`src/utils/date-formatter.js`)
   - Central utility for all date formatting operations
   - Defensive programming approach with fallback values
   - Support for multiple date/time display formats

2. **Enhanced Customer Wallet Service** 
   - Updated to use the new date formatting utility
   - Improved error handling for date processing
   - Consistent date formatting in API response transformation

3. **Updated UI Components**
   - Customer wallet dashboard, transaction history, and insights components
   - Consistent use of the date formatting utility
   - Improved user experience with meaningful fallback messages

## Components and Interfaces

### Date Formatting Utility Interface

```javascript
// Core formatting functions
formatDate(dateValue, options = {})
formatTime(dateValue, options = {})
formatDateTime(dateValue, options = {})
formatRelativeDate(dateValue)
isValidDate(dateValue)

// Specialized wallet formatting
formatTransactionDate(dateValue)
formatTransactionTime(dateValue)
formatCreditSlipAge(createdAt)
```

### Input Validation Strategy

The utility will handle various input types:
- Valid Date objects
- Valid date strings (ISO 8601, etc.)
- Timestamps (numbers)
- null/undefined values
- Invalid date strings
- Empty strings

### Fallback Strategy

- **Date fields**: "N/A" or "Date unavailable"
- **Time fields**: "Time unavailable" 
- **Relative dates**: "Unknown age"
- **Last activity**: "No recent activity"

## Data Models

### Date Formatting Options

```javascript
const DateFormatOptions = {
  format: 'short' | 'long' | 'numeric',
  includeTime: boolean,
  fallbackText: string,
  locale: string // default: 'en-US'
}
```

### Enhanced Transaction Entry

```javascript
const EnhancedTransactionEntry = {
  // Existing fields...
  formatted_date: string,        // "12/25/2023" or "Date unavailable"
  formatted_time: string,        // "2:30 PM" or "Time unavailable"
  formatted_datetime: string,    // "12/25/2023 at 2:30 PM"
  is_date_valid: boolean,        // For conditional rendering
  raw_occurred_at: string        // Original date value for debugging
}
```

## Error Handling

### Date Validation Approach

1. **Input Sanitization**: Check for null, undefined, empty strings
2. **Date Object Creation**: Safely create Date objects with try-catch
3. **Validity Check**: Use `isNaN(date.getTime())` to verify valid dates
4. **Fallback Application**: Return appropriate fallback text for invalid dates

### Error Logging Strategy

- Log invalid date values for debugging (development only)
- Track frequency of invalid dates for monitoring
- Provide context about where invalid dates originate

## Testing Strategy

### Unit Tests for Date Utility

1. **Valid Date Inputs**
   - ISO 8601 strings
   - Date objects
   - Timestamps
   - Various date formats

2. **Invalid Date Inputs**
   - null/undefined values
   - Empty strings
   - Invalid date strings
   - Non-date objects

3. **Edge Cases**
   - Very old dates
   - Future dates
   - Timezone handling
   - Locale-specific formatting

### Integration Tests

1. **Transaction History Component**
   - Verify proper fallback display for invalid dates
   - Test sorting with mixed valid/invalid dates
   - Confirm consistent formatting across entries

2. **Wallet Dashboard Component**
   - Test activity summary with invalid last transaction date
   - Verify credit slip age calculations with invalid dates
   - Check insights generation with mixed date validity

### User Experience Tests

1. **Visual Consistency**
   - All date fields use consistent formatting
   - Fallback messages are user-friendly
   - No "Invalid Date" text appears anywhere

2. **Functionality Preservation**
   - Filtering still works with invalid dates
   - Sorting handles invalid dates gracefully
   - Performance is not significantly impacted

## Implementation Approach

### Phase 1: Create Date Utility
- Implement core date formatting functions
- Add comprehensive input validation
- Include unit tests for all scenarios

### Phase 2: Update Service Layer
- Modify customer-wallet-service.js to use new utility
- Update transaction formatting logic
- Add date validation to API response processing

### Phase 3: Update UI Components
- Replace direct Date() calls with utility functions
- Update transaction history component
- Update wallet dashboard and insights components

### Phase 4: Testing and Validation
- Run comprehensive tests
- Verify no "Invalid Date" displays remain
- Test with various data scenarios

## Performance Considerations

- **Caching**: Cache formatted dates for repeated use
- **Lazy Formatting**: Only format dates when needed for display
- **Minimal Overhead**: Keep utility functions lightweight
- **Memory Management**: Avoid creating unnecessary Date objects

## Backward Compatibility

- Maintain existing API response structure
- Add new formatted fields without removing old ones
- Ensure existing components continue to work during transition
- Provide migration path for other components using date formatting