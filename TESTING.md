# Wallet Management System - Testing Documentation

## Overview

This document outlines the comprehensive testing strategy implemented for the Customer Wallet Management System. The testing suite ensures reliability, maintainability, and correctness of all wallet-related functionality.

## Testing Framework

- **Test Runner**: Vitest (fast, Vite-native testing framework)
- **Component Testing**: React Testing Library
- **User Interaction**: @testing-library/user-event
- **Assertions**: Vitest's built-in expect API
- **Coverage**: V8 coverage provider
- **Environment**: jsdom (browser-like environment)

## Test Structure

### 1. Unit Tests

#### Currency Utilities (`src/utils/__tests__/currency.test.js`)
Tests the core currency formatting and validation functions:

```javascript
// Example test cases
- formatTZS() with various input types and options
- parseTZSToCents() with different string formats
- validateTZSInput() with edge cases and error conditions
- Currency calculation functions (add, subtract, percentage)
- Transaction amount formatting with direction indicators
```

**Coverage Goals**: 95%+ line coverage
**Key Test Areas**:
- Null/undefined handling
- Edge cases (negative numbers, very large amounts)
- Format options (compact, grouping, decimal places)
- Input validation and error messages

#### Wallet Service (`src/api/__tests__/wallet-service.test.js`)
Tests the API service layer methods:

```javascript
// Example test cases
- createCreditSlip() success and error scenarios
- processPayment() with different allocation strategies
- getCustomerBalance() with various customer states
- Error handling for different HTTP status codes
- Retry logic for network failures
```

**Coverage Goals**: 90%+ line coverage
**Key Test Areas**:
- API method functionality
- Error response handling
- Response data formatting
- Retry mechanisms
- Authentication handling

### 2. Integration Tests

#### Wallet Service Integration (`src/api/__tests__/wallet-service.integration.test.js`)
Tests end-to-end workflows:

```javascript
// Example workflows
- Complete credit slip creation and payment process
- Change storage and wallet application workflow
- Multi-step customer transaction scenarios
- Error recovery and retry scenarios
```

**Coverage Goals**: 85%+ workflow coverage
**Key Test Areas**:
- Cross-method interactions
- Data consistency across operations
- Error propagation through workflows
- API response chaining

### 3. Component Tests

#### Wallet Summary Widget (`src/pages/staff/wallet/components/__tests__/wallet-summary-widget.test.jsx`)
Tests the dashboard overview widget:

```javascript
// Example test cases
- Loading state display
- Statistics rendering with proper formatting
- Navigation to different wallet pages
- Error state handling and retry functionality
- Trend indicators and styling
```

**Coverage Goals**: 80%+ component coverage
**Key Test Areas**:
- Rendering states (loading, success, error)
- User interactions and navigation
- Data display and formatting
- Accessibility compliance

#### Wallet Activity Widget (`src/pages/staff/wallet/components/__tests__/wallet-activity-widget.test.jsx`)
Tests the recent activity display:

```javascript
// Example test cases
- Activity list rendering with proper icons
- Time formatting (relative timestamps)
- Transaction amount display with +/- indicators
- Refresh functionality
- Empty state handling
```

#### Form Validation (`src/pages/staff/wallet/components/__tests__/form-validation.test.jsx`)
Tests form validation logic:

```javascript
// Example test cases
- Required field validation
- Currency amount validation
- Email format validation
- Phone number format validation (Tanzania-specific)
- Real-time validation feedback
```

### 4. Page Tests

#### Customer Search (`src/pages/staff/wallet/__tests__/customer-search.test.jsx`)
Tests the customer search functionality:

```javascript
// Example test cases
- Search form submission and validation
- Customer data display after successful search
- Error handling for customer not found
- Quick action navigation
- Credit slip display and wallet application
```

**Coverage Goals**: 75%+ page coverage
**Key Test Areas**:
- User workflows
- Form interactions
- Navigation between pages
- Error states and recovery
- Modal interactions

## Test Utilities and Mocks

### Mock Providers (`src/test/utils.jsx`)
Provides consistent mocking for:
- User authentication context
- Staff permissions
- Wallet service responses
- Navigation functions
- Form submissions

### Test Data Generators
Helper functions for creating realistic test data:
```javascript
generateMockCustomer(overrides = {})
generateMockCreditSlip(overrides = {})
generateMockTransaction(overrides = {})
```

### Custom Render Function
```javascript
renderWithProviders(ui, options = {})
```
Renders components with necessary context providers.

## Running Tests

### Development Workflow
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run wallet-specific test suite
npm run test:wallet

# Generate coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui
```

### Continuous Integration
Tests are configured to run in CI environments with:
- Deterministic results
- No external dependencies
- Fast execution (< 30 seconds for full suite)
- Clear failure reporting

## Coverage Requirements

### Minimum Coverage Targets
- **Utility Functions**: 95%
- **Service Layer**: 90%
- **Components**: 80%
- **Pages**: 75%
- **Integration Workflows**: 85%

### Coverage Reports
Generated in multiple formats:
- HTML report: `coverage/index.html`
- JSON data: `coverage/coverage-final.json`
- Terminal summary during test runs

## Testing Best Practices

### 1. Test Behavior, Not Implementation
```javascript
// Good: Tests user-visible behavior
it('should display customer balance after search', async () => {
  await user.type(searchInput, 'CUST001')
  await user.click(searchButton)
  expect(screen.getByText('TZS 1,234.56')).toBeInTheDocument()
})

// Avoid: Testing internal state
it('should set loading state to true', () => {
  // Don't test internal component state directly
})
```

### 2. Use Descriptive Test Names
```javascript
// Good: Clear description of what's being tested
it('should show error message when customer search fails')

// Avoid: Vague descriptions
it('should handle errors')
```

### 3. Test Edge Cases
```javascript
// Test boundary conditions
expect(formatTZS(0)).toBe('TZS 0')
expect(formatTZS(-1)).toBe('TZS -0.01')
expect(formatTZS(null)).toBe('TZS 0')
expect(formatTZS(undefined)).toBe('TZS 0')
```

### 4. Keep Tests Independent
```javascript
beforeEach(() => {
  vi.clearAllMocks()
  // Reset any global state
})
```

### 5. Use Realistic Test Data
```javascript
const mockCustomer = {
  customer_id: 'CUST001',
  customer_name: 'John Doe',
  phone: '+255712345678', // Valid Tanzania format
  email: 'john@example.com'
}
```

## Accessibility Testing

Tests include checks for:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast considerations

```javascript
it('should be accessible', () => {
  render(<CustomerSearch />)
  
  // Check for proper form structure
  expect(screen.getByRole('form')).toBeInTheDocument()
  
  // Check for proper button roles
  expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  
  // Check for proper heading structure
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})
```

## Performance Testing Considerations

While not implemented in the current suite, future performance tests should cover:
- Component render times
- API response handling efficiency
- Memory leak detection
- Large dataset handling

## Debugging Tests

### Common Issues and Solutions

1. **Async Operations**
```javascript
// Use waitFor for async state changes
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
})
```

2. **User Events**
```javascript
// Use userEvent for realistic interactions
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'text')
```

3. **Mock Cleanup**
```javascript
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})
```

### Debug Tools
- `screen.debug()` - Print current DOM state
- `screen.logTestingPlaygroundURL()` - Get testing playground URL
- Test UI mode for interactive debugging
- Coverage reports to identify untested paths

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**
   - Screenshot comparison for UI consistency
   - Cross-browser visual testing

2. **End-to-End Testing**
   - Playwright integration for full user journeys
   - Real browser testing

3. **Performance Benchmarking**
   - Component render performance metrics
   - API response time monitoring

4. **Automated Accessibility Audits**
   - axe-core integration
   - WCAG compliance checking

5. **Cross-Browser Testing**
   - BrowserStack integration
   - Mobile device testing

## Maintenance

### Regular Tasks
- Review and update test data monthly
- Check for deprecated testing patterns
- Update mocks when API changes
- Monitor coverage trends
- Review and refactor slow tests

### When Adding New Features
1. Write tests before implementation (TDD approach)
2. Ensure new code meets coverage requirements
3. Update integration tests for new workflows
4. Add accessibility tests for new UI components
5. Update documentation and examples

## Conclusion

This comprehensive testing strategy ensures the wallet management system is reliable, maintainable, and user-friendly. The combination of unit, integration, and component tests provides confidence in the system's correctness while the accessibility and performance considerations ensure a quality user experience.

Regular maintenance and continuous improvement of the test suite will help maintain code quality as the system evolves.