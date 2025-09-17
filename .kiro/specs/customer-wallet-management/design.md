# Design Document

## Overview

The Customer Wallet Management System is designed as a clean, intuitive interface integrated into the existing staff dashboard. The system follows the established design patterns using the existing component library (Headless UI with Tailwind CSS) and maintains consistency with the current staff portal UI/UX.

The system provides a dedicated wallet section in the staff dashboard with simple, action-oriented interfaces for managing customer credits, payments, and balances. All operations are performed through straightforward forms with immediate feedback and clear success/error states.

## Architecture

### Component Structure
```
src/pages/staff/
├── wallet/
│   ├── wallet-dashboard.jsx          # Main wallet dashboard
│   ├── customer-search.jsx           # Customer search and balance view
│   ├── create-credit-slip.jsx        # Create credit slip form
│   ├── process-payment.jsx           # Process payment form
│   ├── store-change.jsx              # Store change form
│   ├── transaction-history.jsx       # Transaction history view
│   └── components/
│       ├── customer-balance-card.jsx # Customer balance display
│       ├── credit-slip-card.jsx      # Credit slip display
│       ├── transaction-item.jsx      # Transaction history item
│       └── wallet-stats.jsx          # Wallet statistics
```

### API Integration
- Utilizes existing `axiosInstance` from `src/api/axios.jsx`
- All API calls use the wallet endpoints documented in `wallet.md`
- JWT authentication handled automatically by existing interceptors
- Error handling follows existing patterns with user-friendly messages

### Navigation Integration
The wallet functionality will be added to the existing staff dashboard sidebar as a new menu item with sub-navigation for different wallet operations.

## Components and Interfaces

### 1. Wallet Dashboard (`wallet-dashboard.jsx`)
**Purpose:** Main landing page for wallet operations with overview statistics and quick actions.

**Key Features:**
- Overview cards showing total customers with balances, total wallet amounts, pending credit slips
- Quick action buttons for common operations
- Recent transactions list
- Search bar for quick customer lookup

**UI Elements:**
- Statistics cards (similar to existing dashboard cards)
- Action button grid
- Recent activity table
- Search input with customer suggestions

### 2. Customer Search (`customer-search.jsx`)
**Purpose:** Search and display customer wallet information.

**Key Features:**
- Customer search by ID or phone number
- Display customer balance information
- Show open credit slips
- Quick action buttons for wallet operations

**UI Elements:**
- Search input with autocomplete
- Customer profile card
- Balance display cards (wallet balance, outstanding amounts)
- Open credit slips table
- Action buttons (Add Credit, Process Payment, etc.)

### 3. Create Credit Slip (`create-credit-slip.jsx`)
**Purpose:** Form to create new credit slips for items taken on credit.

**Key Features:**
- Customer selection
- Product selection with quantities
- Automatic total calculation
- Tax and discount handling

**UI Elements:**
- Customer search/select dropdown
- Product selection with search
- Quantity inputs
- Price display and calculation
- Tax/discount inputs
- Total summary
- Submit button with loading state

### 4. Process Payment (`process-payment.jsx`)
**Purpose:** Form to process customer payments and allocate to credit slips or wallet.

**Key Features:**
- Customer selection
- Payment amount input
- Payment method selection
- Allocation to credit slips and/or wallet
- Automatic allocation suggestions

**UI Elements:**
- Customer search/select
- Payment amount input
- Payment method radio buttons
- Credit slip allocation table
- Wallet allocation input
- Allocation summary
- Submit button

### 5. Store Change (`store-change.jsx`)
**Purpose:** Simple form to store customer change as wallet balance.

**Key Features:**
- Customer selection
- Change amount input
- Immediate wallet balance update

**UI Elements:**
- Customer search/select
- Amount input
- Current balance display
- Submit button
- Success confirmation

### 6. Transaction History (`transaction-history.jsx`)
**Purpose:** Display paginated transaction history for customers.

**Key Features:**
- Customer selection
- Paginated transaction list
- Transaction filtering
- Export functionality

**UI Elements:**
- Customer search/select
- Date range picker
- Transaction type filter
- Paginated table
- Export button

## Data Models

### Customer Balance Display
```javascript
{
  customer_id: "CUST001",
  customer_name: "John Doe",
  phone: "+255123456789",
  currency: "TZS",
  balance_cents: 75000,        // 750 TZS
  wallet_cents: 75000,         // Available credit
  outstanding_cents: 0,        // Amount owed
  open_slips_count: 0,
  account_status: "ACTIVE"
}
```

### Credit Slip Display
```javascript
{
  slip_id: "65a1b2c3d4e5f6789012345",
  slip_number: "CS-20240115103000-A1B2C3D4",
  customer_name: "John Doe",
  status: "OPEN",
  grand_total_cents: 350000,   // 3,500 TZS
  paid_cents: 0,
  remaining_cents: 350000,
  items_count: 3,
  created_at: "2024-01-15T10:30:00Z"
}
```

### Transaction Display
```javascript
{
  entry_id: "65a1b2c3d4e5f6789012347",
  entry_type: "PAYMENT",
  direction: "CREDIT",
  amount_cents: 50000,         // 500 TZS
  description: "Payment for slip CS-...",
  occurred_at: "2024-01-15T10:35:00Z",
  staff_member: "Jane Smith"
}
```

## Error Handling

### API Error Responses
All API errors will be handled consistently with user-friendly messages:

- **Validation Errors:** Highlight specific form fields with error messages
- **Not Found Errors:** Display "Customer/Slip not found" with suggestion to search again
- **Insufficient Balance:** Show current balance and required amount
- **Network Errors:** Display retry option with offline indicator
- **Authentication Errors:** Redirect to login with session expired message

### Form Validation
- Real-time validation for required fields
- Amount validation (positive numbers, proper formatting)
- Customer existence validation
- Payment allocation validation (not exceeding payment amount)

## Testing Strategy

### Unit Testing
- Component rendering tests
- Form validation logic
- Currency formatting functions
- API response handling
- Error state management

### Integration Testing
- API endpoint integration
- Authentication flow
- Navigation between wallet pages
- Data persistence and updates

### User Acceptance Testing
- Staff workflow testing
- Performance testing with realistic data volumes
- Mobile responsiveness testing
- Accessibility compliance testing

## Implementation Approach

### Phase 1: Core Infrastructure
1. Set up wallet routing and navigation
2. Create base components and layouts
3. Implement API service layer
4. Add wallet menu to staff dashboard

### Phase 2: Basic Operations
1. Customer search and balance display
2. Create credit slip functionality
3. Process payment functionality
4. Store change functionality

### Phase 3: Advanced Features
1. Transaction history with pagination
2. Wallet statistics and reporting
3. Audit trail access
4. Enhanced search and filtering

### Phase 4: Polish and Optimization
1. Loading states and animations
2. Error handling improvements
3. Performance optimizations
4. Mobile responsiveness
5. Accessibility enhancements

## UI/UX Design Principles

### Simplicity
- Clean, uncluttered interfaces
- Single-purpose pages with clear objectives
- Minimal clicks to complete common tasks
- Consistent navigation patterns

### Immediate Feedback
- Loading indicators for all async operations
- Success/error messages with clear actions
- Real-time form validation
- Visual confirmation of completed actions

### Consistency
- Use existing component library and design tokens
- Follow established color schemes and typography
- Maintain consistent spacing and layout patterns
- Reuse existing icons and visual elements

### Efficiency
- Quick customer search with autocomplete
- Smart defaults and suggestions
- Keyboard shortcuts for power users
- Bulk operations where appropriate

## Security Considerations

### Authentication
- All wallet operations require staff authentication
- JWT tokens handled by existing authentication system
- Automatic token refresh and session management

### Authorization
- Role-based access control for sensitive operations
- Audit trail for all wallet modifications
- Staff member identification in all transactions

### Data Protection
- Sensitive customer data handled securely
- No client-side storage of financial information
- Secure API communication with proper error handling

## Performance Considerations

### Data Loading
- Lazy loading for transaction history
- Pagination for large datasets
- Caching of frequently accessed customer data
- Optimistic updates for better perceived performance

### API Optimization
- Debounced search queries
- Request deduplication
- Proper error retry mechanisms
- Connection pooling and timeout handling

## Accessibility

### WCAG Compliance
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- High contrast color schemes
- Focus management and indicators

### Usability
- Clear error messages and instructions
- Consistent navigation patterns
- Responsive design for various screen sizes
- Touch-friendly interface elements