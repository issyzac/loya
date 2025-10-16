# Design Document

## Overview

The Customer Wallet Interface is designed as a customer-facing section integrated into the existing customer portal. The system leverages the existing wallet APIs and follows established design patterns using the current component library (Headless UI with Tailwind CSS) to maintain consistency with the existing customer interface.

The interface provides customers with a clean, mobile-first dashboard to view their wallet balance, outstanding credit slips, and transaction history. The centerpiece is a visual balance status card with color coding that immediately communicates the customer's financial status.

## Architecture

### Component Structure
```
src/elements/
├── customer-wallet-dashboard.jsx     # Main wallet dashboard for customers
├── customer-balance-status-card.jsx  # Visual balance status card with color coding
└── customer-wallet-insights.jsx      # Spending insights and patterns

src/pages/
├── customer-wallet-page.jsx          # Full page wrapper for wallet interface

src/api/
├── customer-wallet-service.js        # Customer-specific wallet API service
```

### Tabbed Interface Design

**Tab Navigation:**
```javascript
const tabs = [
  { id: 'overview', name: 'Overview', icon: '💰' },
  { id: 'transactions', name: 'Transactions', icon: '📊' },
  { id: 'insights', name: 'Insights', icon: '📈' }
];
```

**Tab Content Organization:**
- **Overview Tab**: Balance status card, pending bills summary, recent activity preview
- **Transactions Tab**: Full transaction history component with filtering and pagination
- **Insights Tab**: Wallet insights component with spending patterns and analytics

**Mobile Tab Design:**
- Horizontal scrollable tab bar for small screens
- Active tab indicator with color coding
- Smooth transitions between tab content
- Consistent padding and spacing across tabs

### Integration Points
- **Existing APIs**: Utilizes existing `wallet-service.js` with customer-specific wrapper
- **Authentication**: Leverages existing JWT authentication from `UserProvider`
- **Customer ID Resolution**: Uses same logic as `pending-bills.jsx` for consistent customer identification
- **Navigation**: Integrates with existing customer navigation patterns
- **Pending Bills**: Links to existing `pending-bills.jsx` component
- **Design System**: Uses existing component library and design tokens
- **Tab Components**: Reuses existing transaction history and insights components within tabs

### Data Flow
```
Customer Login → JWT Token → Customer ID Resolution → Wallet API Calls → UI Updates
```

## Components and Interfaces

### 1. Customer Wallet Dashboard (`customer-wallet-dashboard.jsx`)
**Purpose:** Main landing page for customer wallet with balance overview and quick navigation.

**Key Features:**
- Balance status card with color-coded visual indicators
- Summary of outstanding credit slips with link to pending bills
- Recent transaction highlights
- Quick insights about spending patterns

**UI Elements:**
- Hero balance status card (prominent, color-coded)
- Summary cards for credit slips and recent activity
- Navigation links to detailed views
- Mobile-optimized layout

**Color Coding Logic:**
```javascript
const getBalanceCardStyle = (walletCents, outstandingCents) => {
  const netBalance = walletCents - outstandingCents;
  
  if (outstandingCents > 0 && netBalance <= 0) {
    // Customer owes money - yellowish hue
    return {
      background: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600'
    };
  } else if (walletCents > 0 && netBalance > 0) {
    // Customer has available credit - green hue
    return {
      background: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600'
    };
  } else {
    // Neutral state - gray hue
    return {
      background: 'bg-gray-50 border-gray-200',
      text: 'text-gray-800',
      accent: 'text-gray-600'
    };
  }
};
```

### 2. Customer Balance Status Card (`customer-balance-status-card.jsx`)
**Purpose:** Visual card component that displays balance information with color coding.

**Key Features:**
- Large, prominent display of net balance
- Clear breakdown of available credit vs. amount owed
- Color-coded background based on financial status
- Responsive design for mobile and desktop

**Visual States:**
- **Green (Available Credit)**: Customer has positive wallet balance
- **Yellow (Amount Owed)**: Customer has outstanding credit slips
- **Gray (Neutral)**: Zero balance or balanced state

**UI Layout:**
```
┌─────────────────────────────────────┐
│  💰 Your Wallet Balance             │
│                                     │
│  Net Balance: 15,000 TZS           │
│  ─────────────────────────────────  │
│  Available Credit: 20,000 TZS      │
│  Amount Owed: 5,000 TZS            │
│                                     │
│  [View Details] [Pay Bills]        │
└─────────────────────────────────────┘
```

### 3. Customer Wallet Insights (`customer-wallet-insights.jsx`)
**Purpose:** Simple insights and patterns about customer wallet usage.

**Key Features:**
- Monthly spending summary
- Average transaction amounts
- Wallet usage patterns
- Gentle notifications and reminders

**UI Elements:**
- Simple charts or visual representations
- Summary statistics cards
- Friendly, non-technical language
- Optional notifications

### 4. Customer Wallet Page (`customer-wallet-page.jsx`)
**Purpose:** Full page wrapper that provides navigation and tabbed layout structure.

**Key Features:**
- Page header with navigation breadcrumbs
- Tabbed interface for organizing wallet content
- Integration with existing customer navigation
- Mobile-responsive layout with touch-friendly tabs
- Loading and error states

**Tab Structure:**
- **Overview Tab**: Balance status card, pending bills summary, quick actions
- **Transactions Tab**: Complete transaction history with filtering and pagination
- **Insights Tab**: Wallet insights, spending patterns, and analytics

**Mobile Considerations:**
- Horizontal scrollable tabs on small screens
- Touch-friendly tab switching
- Consistent content layout across tabs

## Data Models

### Customer Balance Display
```javascript
{
  customer_id: "675ab2c25855c2ccc099e056",
  customer_name: "Fredy Sabuni",
  currency: "TZS",
  balance_cents: 150000,        // Net balance (15,000 TZS)
  wallet_cents: 200000,         // Available credit (20,000 TZS)
  outstanding_cents: 50000,     // Amount owed (5,000 TZS)
  open_slips_count: 2,
  account_status: "ACTIVE",
  last_activity: "2024-01-15T10:30:00Z"
}
```

### Transaction Summary
```javascript
{
  recent_transactions: [
    {
      entry_id: "65a1b2c3d4e5f6789012347",
      entry_type: "PAYMENT",
      direction: "CREDIT",
      amount_cents: 50000,
      occurred_at: "2024-01-15T10:35:00Z",
      description: "Payment received",
      formatted_amount: "500 TZS"
    }
  ],
  monthly_summary: {
    total_spent_cents: 350000,
    total_payments_cents: 400000,
    transaction_count: 15,
    avg_transaction_cents: 23333
  }
}
```

### Wallet Insights
```javascript
{
  spending_patterns: {
    most_active_day: "Friday",
    avg_monthly_spending: "35,000 TZS",
    preferred_payment_method: "Mobile Money"
  },
  notifications: [
    {
      type: "reminder",
      message: "You have 2 pending bills totaling 5,000 TZS",
      action: "view_bills",
      priority: "medium"
    }
  ]
}
```

## API Integration

### Customer-Specific Wallet Service
```javascript
// src/api/customer-wallet-service.js
import walletService from './wallet-service.js';
import { useUser } from '../providers/UserProvider';

class CustomerWalletService {
  getCurrentCustomerId() {
    const user = useUser();
    // Use the same customer ID resolution logic as pending bills
    const potentialIds = [user._id, user.customer_id, user.id, user.user_id];
    
    for (const id of potentialIds) {
      if (id && typeof id === 'string' && id.trim() !== '') {
        return id.trim();
      }
    }
    
    throw new Error('Customer ID not available');
  }

  async getMyBalance() {
    const customerId = this.getCurrentCustomerId();
    return await walletService.getCustomerBalance(customerId, 'TZS');
  }
  
  async getMyTransactionHistory(page = 1, perPage = 20) {
    const customerId = this.getCurrentCustomerId();
    return await walletService.getTransactionHistory(customerId, 'TZS', page, perPage);
  }
  
  async getMyCreditSlipsSummary() {
    const customerId = this.getCurrentCustomerId();
    const response = await walletService.getOpenCreditSlips(customerId, 'TZS');
    
    if (response.success) {
      return {
        success: true,
        count: response.slips_count,
        total_amount_cents: response.slips.reduce((sum, slip) => 
          sum + (slip.totals?.remaining_cents || 0), 0
        )
      };
    }
    
    return response;
  }
  
  async getMyWalletInsights() {
    const customerId = this.getCurrentCustomerId();
    const [balanceResponse, historyResponse] = await Promise.all([
      walletService.getCustomerBalance(customerId, 'TZS'),
      walletService.getTransactionHistory(customerId, 'TZS', 1, 10)
    ]);
    
    if (balanceResponse.success && historyResponse.success) {
      const balance = balanceResponse.balance;
      const recentTransactions = historyResponse.entries;
      
      return {
        success: true,
        insights: {
          current_balance: balance,
          recent_activity_count: recentTransactions.length,
          last_transaction_date: recentTransactions[0]?.occurred_at || null,
          has_outstanding_bills: balance.outstanding_cents > 0,
          has_available_credit: balance.wallet_cents > 0
        }
      };
    }
    
    return { success: false, error: 'Failed to load wallet insights' };
  }
}

export default new CustomerWalletService();
```

### Error Handling Strategy
- **Authentication Errors**: Redirect to login with return URL
- **Network Errors**: Show retry option with offline indicator
- **Data Errors**: Graceful degradation with cached data
- **Permission Errors**: Clear messaging about access restrictions

## User Experience Design

### Mobile-First Approach
- Touch-friendly interface elements
- Optimized for small screens
- Swipe gestures for navigation
- Fast loading with skeleton states

### Visual Hierarchy
1. **Balance Status Card** - Most prominent element
2. **Quick Actions** - Secondary prominence
3. **Summary Information** - Supporting details
4. **Navigation Links** - Tertiary elements

### Color Psychology
- **Green**: Positive, available funds, success
- **Yellow**: Caution, attention needed, pending action
- **Gray**: Neutral, balanced, no action needed
- **Red**: Avoided to prevent negative associations

### Accessibility Considerations
- High contrast color combinations
- Screen reader compatible labels
- Keyboard navigation support
- Clear focus indicators
- Semantic HTML structure

## Integration with Existing Features

### Pending Bills Integration
```javascript
// Link to existing pending bills with context
const navigateToPendingBills = () => {
  // Set context for return navigation
  setReturnContext('wallet-dashboard');
  // Navigate to existing pending bills component
  navigate('/pending-bills');
};
```

### Customer Navigation Integration
- Add wallet item to existing customer navigation menu
- Maintain consistent navigation patterns
- Provide breadcrumb navigation
- Support deep linking to wallet sections

### Authentication Integration
- Leverage existing `UserProvider` for authentication
- Use existing JWT token management
- Follow existing session handling patterns
- Maintain security best practices

## Performance Considerations

### Data Loading Strategy
- Load balance information immediately on page load
- Lazy load transaction history and insights
- Cache balance data for 2-3 minutes
- Use optimistic updates for better perceived performance

### Mobile Optimization
- Minimize API calls on mobile networks
- Compress images and optimize assets
- Use progressive loading for large datasets
- Implement offline-first caching strategy

### Error Recovery
- Graceful degradation with cached data
- Retry mechanisms for failed requests
- Clear error messaging with recovery options
- Fallback to essential information only

## Security Considerations

### Data Protection
- Customer can only access their own wallet data
- Sensitive information properly masked in logs
- Secure API communication with proper headers
- No client-side storage of sensitive financial data

### Authentication & Authorization
- JWT token validation on all requests
- Customer ID validation and sanitization
- Rate limiting for API requests
- Session timeout handling

## Testing Strategy

### Unit Testing
- Component rendering with different balance states
- Color coding logic validation
- Currency formatting functions
- Error state handling

### Integration Testing
- API service integration
- Authentication flow testing
- Navigation between components
- Mobile responsiveness testing

### User Acceptance Testing
- Customer workflow testing
- Mobile device testing
- Accessibility compliance testing
- Performance testing with realistic data

## Implementation Phases

### Phase 1: Core Balance Display
1. Create customer wallet dashboard component
2. Implement balance status card with color coding
3. Integrate with existing authentication
4. Add basic navigation structure

### Phase 2: Enhanced Features
1. Add transaction history integration
2. Implement wallet insights component
3. Create pending bills integration
4. Add mobile optimizations

### Phase 3: Polish & Optimization
1. Performance optimizations
2. Enhanced error handling
3. Accessibility improvements
4. Advanced caching strategies

## Design Tokens and Styling

### Color Palette
```css
/* Available Credit (Green) */
--wallet-credit-bg: #f0fdf4;
--wallet-credit-border: #bbf7d0;
--wallet-credit-text: #166534;
--wallet-credit-accent: #16a34a;

/* Amount Owed (Yellow) */
--wallet-owed-bg: #fefce8;
--wallet-owed-border: #fde047;
--wallet-owed-text: #a16207;
--wallet-owed-accent: #ca8a04;

/* Neutral State (Gray) */
--wallet-neutral-bg: #f9fafb;
--wallet-neutral-border: #d1d5db;
--wallet-neutral-text: #374151;
--wallet-neutral-accent: #6b7280;
```

### Typography
- Use existing `roboto-serif-heading` for main headings
- Standard body text for descriptions
- Bold weights for monetary amounts
- Consistent font sizing with existing design system

### Spacing and Layout
- Follow existing grid system
- Use consistent padding and margins
- Maintain responsive breakpoints
- Align with existing component spacing patterns