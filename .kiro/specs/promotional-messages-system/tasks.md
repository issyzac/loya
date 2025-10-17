# Implementation Plan

- [x] 1. Set up promotional messages data models and API service
  - Create TypeScript interfaces for PromotionalMessage data structure
  - Implement promotional messages API service with fetch, dismiss, and tracking methods
  - Add error handling and retry logic for network requests
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

- [-] 2. Create promotional message card component
  - [x] 2.1 Implement PromotionalMessageCard component with props interface
    - Build card component with title, content, and CTA button rendering
    - Add dismiss button with smooth animation transitions
    - Implement responsive design for mobile and desktop layouts
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3_

  - [ ]* 2.2 Write unit tests for PromotionalMessageCard
    - Test props rendering and conditional display logic
    - Test dismiss functionality and callback execution
    - Test accessibility features and keyboard navigation
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.3_

- [x] 3. Build promotional messages container component
  - [x] 3.1 Create PromotionalMessagesContainer with state management
    - Implement component state for messages, loading, and error handling
    - Add message fetching logic with loading states
    - Build message filtering for active, non-dismissed messages
    - _Requirements: 1.1, 1.3, 1.4, 5.1, 5.2_

  - [x] 3.2 Implement dismiss functionality and user preferences
    - Add dismiss handler with optimistic UI updates
    - Implement local storage for dismissed message tracking
    - Add error handling for failed dismiss operations with rollback
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 3.3 Write unit tests for container component
    - Test state management and API integration
    - Test message filtering and dismiss functionality
    - Test error handling and loading states
    - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.2, 3.3, 5.1, 5.2_

- [x] 4. Integrate promotional messages into main layout
  - [x] 4.1 Modify Home.jsx to use promotional messages in right column
    - Update getRightPanel function to include promotional messages
    - Replace LeaderBoard component when no cart items are present
    - Maintain existing responsive behavior for mobile and desktop
    - _Requirements: 1.1, 2.3, 4.1, 4.4_

  - [x] 4.2 Remove balance status card from wallet dashboard
    - Remove CustomerBalanceStatusCard import and usage from customer-wallet-dashboard.jsx
    - Update layout to prevent empty spaces or broken styling
    - Ensure balance information remains accessible in wallet interface
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Add styling and visual polish
  - [x] 5.1 Implement promotional message card styling
    - Create CSS classes for different message types (promotion, announcement, info)
    - Add hover effects and smooth transitions for interactive elements
    - Ensure consistent spacing and typography with existing design system
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.2 Add loading and empty states
    - Create skeleton loading animation for initial message fetch
    - Design empty state component for when no messages are available
    - Add error state display with retry functionality
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 6. Implement performance optimizations
  - [x] 6.1 Add caching and lazy loading
    - Implement client-side caching for promotional messages with TTL
    - Add lazy loading for promotional images to improve page load times
    - Optimize component rendering with React.memo and useMemo hooks
    - _Requirements: 5.1, 5.4_

  - [ ]* 6.2 Write integration tests for layout changes
    - Test promotional messages display in right column across different pages
    - Verify balance status card removal doesn't break existing functionality
    - Test responsive behavior on mobile and desktop devices
    - _Requirements: 1.1, 2.3, 4.1, 4.2, 4.4_