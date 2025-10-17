# Wallet Component Testing Suite

This directory contains comprehensive tests for the Customer Wallet Management System components.

## Test Structure

```
src/
├── test/
│   ├── setup.js                 # Test environment setup
│   ├── utils.jsx                # Test utilities and mocks
│   └── README.md               # This file
├── utils/__tests__/
│   └── currency.test.js        # Currency utility tests
├── api/__tests__/
│   ├── wallet-service.test.js  # Wallet service unit tests
│   └── wallet-service.integration.test.js  # Integration tests
└── pages/staff/wallet/
    ├── __tests__/
    │   └── customer-search.test.jsx  # Customer search component tests
    └── components/__tests__/
        ├── wallet-summary-widget.test.jsx    # Widget tests
        ├── wallet-activity-widget.test.jsx   # Activity widget tests
        └── form-validation.test.jsx          # Form validation tests
```

## Running Tests

### All Tests
```bash
npm test
# or
yarn test
```

### Watch Mode
```bash
npm run test:watch
# or
yarn test:watch
```

### Coverage Report
```bash
npm run test:coverage
# or
yarn test:coverage
```

### UI Mode (Interactive)
```bash
npm run test:ui
# or
yarn test:ui
```

## Test Categories

### 1. Unit Tests
- **Currency Utilities** (`src/utils/__tests__/currency.test.js`)
  - Currency formatting functions
  - Input validation
  - Amount calculations
  - Error handling

- **Wallet Service** (`src/api/__tests__/wallet-service.test.js`)
  - API method functionality
  - Error handling
  - Response formatting
  - Retry logic

### 2. Component Tests
- **Wallet Summary Widget** (`src/pages/staff/wallet/components/__tests__/wallet-summary-widget.test.jsx`)
  - Rendering states (loading, success, error)
  - User interactions
  - Navigation functionality
  - Data display

- **Wallet Activity Widget** (`src/pages/staff/wallet/components/__tests__/wallet-activity-widget.test.jsx`)
  - Activity list rendering
  - Time formatting
  - User interactions
  - Real-time updates

- **Form Validation** (`src/pages/staff/wallet/components/__tests__/form-validation.test.jsx`)
  - Input validation rules
  - Error message display
  - Real-time validation
  - Form submission

### 3. Page Tests
- **Customer Search** (`src/pages/staff/wallet/__tests__/customer-search.test.jsx`)
  - Search functionality
  - Customer data display
  - Quick actions
  - Error handling
  - Navigation

### 4. Integration Tests
- **Wallet Service Integration** (`src/api/__tests__/wallet-service.integration.test.js`)
  - End-to-end workflows
  - API error scenarios
  - Response formatting
  - Audit trail functionality

## Test Utilities

### Mock Providers
The test suite includes mock providers for:
- User authentication context
- Staff permissions
- Wallet service responses
- Navigation functions

### Test Data Generators
Helper functions to generate consistent test data:
- `generateMockCustomer()`
- `generateMockCreditSlip()`
- `generateMockTransaction()`

### Custom Render Function
`renderWithProviders()` - Renders components with necessary context providers

## Coverage Goals

The test suite aims for:
- **90%+ line coverage** for utility functions
- **85%+ line coverage** for service layers
- **80%+ line coverage** for UI components
- **100% coverage** for critical wallet operations

## Test Patterns

### 1. Arrange-Act-Assert (AAA)
```javascript
it('should format currency correctly', () => {
  // Arrange
  const cents = 12345
  
  // Act
  const result = formatTZS(cents)
  
  // Assert
  expect(result).toBe('TZS 123.45')
})
```

### 2. User-Centric Testing
```javascript
it('should allow user to search for customer', async () => {
  const user = userEvent.setup()
  render(<CustomerSearch />)
  
  await user.type(screen.getByPlaceholderText('Enter customer ID...'), 'CUST001')
  await user.click(screen.getByText('Search'))
  
  expect(screen.getByText('John Doe')).toBeInTheDocument()
})
```

### 3. Error Boundary Testing
```javascript
it('should handle API errors gracefully', async () => {
  mockWalletService.searchCustomer.mockRejectedValue(new Error('Network error'))
  
  render(<CustomerSearch />)
  // ... trigger search
  
  expect(screen.getByText('Network error')).toBeInTheDocument()
})
```

## Accessibility Testing

Tests include accessibility checks for:
- Proper ARIA labels
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast (through visual regression)

## Performance Testing

Performance considerations tested:
- Component render times
- API response handling
- Memory leaks in long-running components
- Debounced search functionality

## Mocking Strategy

### API Mocking
- Mock axios instance for consistent API responses
- Separate mocks for success/error scenarios
- Realistic response data structure

### Component Mocking
- Mock heavy dependencies (charts, complex widgets)
- Preserve component interfaces
- Test component interactions

### Browser API Mocking
- localStorage
- window.location
- console methods (to reduce test noise)

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on user interactions and outcomes
   - Avoid testing internal component state directly

2. **Use Descriptive Test Names**
   - Clearly describe what is being tested
   - Include expected behavior

3. **Keep Tests Independent**
   - Each test should be able to run in isolation
   - Clean up after each test

4. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Boundary values

5. **Maintain Test Data**
   - Use factories for consistent test data
   - Keep test data realistic but minimal

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies
- Deterministic results
- Fast execution
- Clear failure messages

## Debugging Tests

### Common Issues
1. **Async Operations**: Use `waitFor()` for async state changes
2. **User Events**: Use `userEvent` instead of `fireEvent` for realistic interactions
3. **Mocking**: Ensure mocks are properly cleared between tests
4. **Timing**: Add appropriate delays for animations/transitions

### Debug Tools
- `screen.debug()` - Print current DOM state
- `logRoles()` - Show available accessibility roles
- Test UI mode for interactive debugging
- Coverage reports to identify untested code paths

## Future Enhancements

Planned test improvements:
- Visual regression testing
- E2E tests with Playwright
- Performance benchmarking
- Automated accessibility audits
- Cross-browser testing matrix