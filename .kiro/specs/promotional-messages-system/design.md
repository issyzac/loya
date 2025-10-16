# Design Document

## Overview

The promotional messages system will replace the balance status card in the right column with a dynamic, engaging promotional content display. The system will be built as a modular React component that can be easily integrated into the existing layout structure and will provide a clean, modern interface for displaying marketing messages, announcements, and promotional offers.

## Architecture

### Component Structure
```
src/
├── components/
│   ├── promotional-messages/
│   │   ├── promotional-message-card.jsx
│   │   ├── promotional-messages-container.jsx
│   │   └── __tests__/
│   │       ├── promotional-message-card.test.jsx
│   │       └── promotional-messages-container.test.jsx
├── api/
│   └── promotional-messages-service.js
└── utils/
    └── promotional-messages-utils.js
```

### Data Flow
1. **Data Fetching**: API service fetches promotional messages from backend
2. **State Management**: Container component manages message state, loading, and user interactions
3. **Rendering**: Individual message cards render with appropriate styling and actions
4. **User Interactions**: Dismiss actions are handled locally and persisted via API
5. **Layout Integration**: Container replaces balance status card in right column

## Components and Interfaces

### PromotionalMessagesContainer
**Purpose**: Main container component that manages the promotional messages display

**Props**:
```javascript
{
  className?: string,
  maxMessages?: number,
  refreshInterval?: number
}
```

**State**:
```javascript
{
  messages: Array<PromotionalMessage>,
  loading: boolean,
  error: string | null,
  dismissedMessages: Set<string>
}
```

**Key Methods**:
- `fetchMessages()`: Loads promotional messages from API
- `handleDismiss(messageId)`: Handles message dismissal
- `filterActiveMessages()`: Filters out expired and dismissed messages

### PromotionalMessageCard
**Purpose**: Individual message display component with dismiss functionality

**Props**:
```javascript
{
  message: PromotionalMessage,
  onDismiss: (messageId: string) => void,
  className?: string
}
```

**Features**:
- Responsive design with mobile-first approach
- Smooth dismiss animations
- Call-to-action button handling
- Accessibility compliance (ARIA labels, keyboard navigation)

## Data Models

### PromotionalMessage
```javascript
{
  id: string,                    // Unique identifier
  title: string,                 // Message headline
  content: string,               // Message body text
  type: 'promotion' | 'announcement' | 'info',
  priority: number,              // Display priority (1-10)
  ctaText?: string,             // Call-to-action button text
  ctaUrl?: string,              // Call-to-action URL
  imageUrl?: string,            // Optional promotional image
  startDate: Date,              // When message becomes active
  endDate?: Date,               // When message expires
  targetAudience?: string[],    // User segments to target
  dismissible: boolean,         // Whether user can dismiss
  createdAt: Date,
  updatedAt: Date
}
```

### API Response Format
```javascript
{
  success: boolean,
  data: {
    messages: PromotionalMessage[],
    totalCount: number,
    hasMore: boolean
  },
  error?: string
}
```

## Error Handling

### Loading States
- **Initial Load**: Skeleton loading animation matching card dimensions
- **Refresh**: Subtle loading indicator without disrupting existing content
- **Empty State**: Friendly message when no promotional content is available

### Error Scenarios
- **Network Failure**: Graceful degradation with retry mechanism
- **Invalid Data**: Skip malformed messages, log errors for monitoring
- **API Timeout**: Exponential backoff retry strategy
- **Dismiss Failure**: Optimistic UI updates with rollback on failure

### Fallback Content
When no promotional messages are available or all are dismissed:
```javascript
<div className="text-center py-8 text-gray-500">
  <p>Stay tuned for exciting updates and offers!</p>
</div>
```

## Testing Strategy

### Unit Tests
- **PromotionalMessageCard**: Props rendering, dismiss functionality, accessibility
- **PromotionalMessagesContainer**: State management, API integration, filtering logic
- **API Service**: Request/response handling, error scenarios, caching

### Integration Tests
- **Layout Integration**: Verify proper replacement of balance status card
- **User Interactions**: End-to-end dismiss workflow
- **Responsive Behavior**: Cross-device layout validation

### Accessibility Tests
- **Screen Reader**: ARIA labels and navigation
- **Keyboard Navigation**: Tab order and keyboard interactions
- **Color Contrast**: WCAG compliance for all text and backgrounds

## Implementation Details

### Layout Integration
The promotional messages system will integrate into the existing layout by:

1. **Home.jsx Modification**: Replace `<LeaderBoard />` component in `getRightPanel()` function when no cart items are present
2. **Responsive Design**: Maintain existing mobile/desktop layout patterns
3. **Consistent Styling**: Match existing card styling and spacing patterns

### Balance Status Card Removal
1. **Component Removal**: Delete `src/elements/customer-balance-status-card.jsx`
2. **Import Cleanup**: Remove imports from wallet dashboard and other components
3. **Layout Adjustment**: Ensure no empty spaces or broken layouts remain
4. **Balance Information**: Verify balance data is available elsewhere in the interface

### Performance Considerations
- **Lazy Loading**: Load promotional content after critical page elements
- **Caching**: Implement client-side caching with TTL for message data
- **Image Optimization**: Lazy load promotional images with proper sizing
- **Bundle Size**: Keep component bundle minimal with tree-shaking

### Styling Approach
```css
/* Base card styling to match existing design system */
.promotional-message-card {
  @apply rounded-lg border bg-white shadow-sm p-6;
  @apply transition-all duration-200 ease-in-out;
}

/* Message type variants */
.promotional-message-card--promotion {
  @apply border-blue-200 bg-blue-50;
}

.promotional-message-card--announcement {
  @apply border-yellow-200 bg-yellow-50;
}

.promotional-message-card--info {
  @apply border-gray-200 bg-gray-50;
}
```

### API Integration
```javascript
// Promotional Messages Service
class PromotionalMessagesService {
  async getActiveMessages(limit = 5) {
    // Fetch active messages with pagination
  }
  
  async dismissMessage(messageId, userId) {
    // Record message dismissal
  }
  
  async trackInteraction(messageId, action) {
    // Track clicks and engagement
  }
}
```