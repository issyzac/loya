/**
 * @typedef {Object} PromotionalMessage
 * @property {string} id - Unique identifier
 * @property {string} title - Message headline
 * @property {string} content - Message body text
 * @property {'promotion'|'announcement'|'info'} type - Message type
 * @property {number} priority - Display priority (1-10)
 * @property {string} [ctaText] - Call-to-action button text
 * @property {string} [ctaUrl] - Call-to-action URL
 * @property {string} [imageUrl] - Optional promotional image
 * @property {Date|string} startDate - When message becomes active
 * @property {Date|string} [endDate] - When message expires
 * @property {string[]} [targetAudience] - User segments to target
 * @property {boolean} dismissible - Whether user can dismiss
 * @property {Date|string} createdAt - Creation timestamp
 * @property {Date|string} updatedAt - Last update timestamp
 */

/**
 * Utility class for promotional messages operations
 */
class PromotionalMessagesUtils {
  /**
   * Local storage key for dismissed messages
   */
  static DISMISSED_MESSAGES_KEY = 'promotional_messages_dismissed';

  /**
   * Local storage key for message cache
   */
  static MESSAGES_CACHE_KEY = 'promotional_messages_cache';

  /**
   * Cache TTL in milliseconds (5 minutes)
   */
  static CACHE_TTL = 5 * 60 * 1000;

  /**
   * Get dismissed message IDs from local storage
   * @param {string} [userId] - User ID for user-specific dismissals
   * @returns {Set<string>} Set of dismissed message IDs
   */
  static getDismissedMessageIds(userId = null) {
    try {
      const key = userId ? `${this.DISMISSED_MESSAGES_KEY}_${userId}` : this.DISMISSED_MESSAGES_KEY;
      const dismissed = localStorage.getItem(key);
      return dismissed ? new Set(JSON.parse(dismissed)) : new Set();
    } catch (error) {
      console.warn('Failed to get dismissed messages from localStorage:', error);
      return new Set();
    }
  }

  /**
   * Add a message ID to the dismissed list in local storage
   * @param {string} messageId - The message ID to mark as dismissed
   * @param {string} [userId] - User ID for user-specific dismissals
   */
  static addDismissedMessage(messageId, userId = null) {
    try {
      const dismissedIds = this.getDismissedMessageIds(userId);
      dismissedIds.add(messageId);
      
      const key = userId ? `${this.DISMISSED_MESSAGES_KEY}_${userId}` : this.DISMISSED_MESSAGES_KEY;
      localStorage.setItem(key, JSON.stringify([...dismissedIds]));
    } catch (error) {
      console.warn('Failed to save dismissed message to localStorage:', error);
    }
  }

  /**
   * Remove a message ID from the dismissed list (for testing/admin purposes)
   * @param {string} messageId - The message ID to remove from dismissed list
   * @param {string} [userId] - User ID for user-specific dismissals
   */
  static removeDismissedMessage(messageId, userId = null) {
    try {
      const dismissedIds = this.getDismissedMessageIds(userId);
      dismissedIds.delete(messageId);
      
      const key = userId ? `${this.DISMISSED_MESSAGES_KEY}_${userId}` : this.DISMISSED_MESSAGES_KEY;
      localStorage.setItem(key, JSON.stringify([...dismissedIds]));
    } catch (error) {
      console.warn('Failed to remove dismissed message from localStorage:', error);
    }
  }

  /**
   * Clear all dismissed messages from local storage
   * @param {string} [userId] - User ID for user-specific dismissals
   */
  static clearDismissedMessages(userId = null) {
    try {
      const key = userId ? `${this.DISMISSED_MESSAGES_KEY}_${userId}` : this.DISMISSED_MESSAGES_KEY;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear dismissed messages from localStorage:', error);
    }
  }

  /**
   * Check if a message is currently active (within date range)
   * @param {PromotionalMessage} message - The message to check
   * @returns {boolean} True if the message is active
   */
  static isMessageActive(message) {
    if (!message) return false;

    const now = new Date();
    const startDate = new Date(message.startDate);
    
    // Check if message has started
    if (startDate > now) return false;
    
    // Check if message has expired
    if (message.endDate) {
      const endDate = new Date(message.endDate);
      if (endDate < now) return false;
    }
    
    return true;
  }

  /**
   * Check if a message is dismissed
   * @param {string} messageId - The message ID to check
   * @param {string} [userId] - User ID for user-specific dismissals
   * @returns {boolean} True if the message is dismissed
   */
  static isMessageDismissed(messageId, userId = null) {
    const dismissedIds = this.getDismissedMessageIds(userId);
    return dismissedIds.has(messageId);
  }

  /**
   * Filter messages to show only active, non-dismissed ones
   * @param {PromotionalMessage[]} messages - Array of messages to filter
   * @param {string} [userId] - User ID for user-specific dismissals
   * @returns {PromotionalMessage[]} Filtered array of messages
   */
  static filterActiveMessages(messages, userId = null) {
    if (!Array.isArray(messages)) return [];

    return messages.filter(message => {
      // Check if message is active (within date range)
      if (!this.isMessageActive(message)) return false;
      
      // Check if message is dismissed (only if dismissible)
      if (message.dismissible && this.isMessageDismissed(message.id, userId)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Sort messages by priority (higher priority first) and creation date
   * @param {PromotionalMessage[]} messages - Array of messages to sort
   * @returns {PromotionalMessage[]} Sorted array of messages
   */
  static sortMessagesByPriority(messages) {
    if (!Array.isArray(messages)) return [];

    return [...messages].sort((a, b) => {
      // First sort by priority (higher priority first)
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      
      // Then sort by creation date (newer first)
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }

  /**
   * Get messages from cache if valid
   * @returns {PromotionalMessage[]|null} Cached messages or null if cache is invalid
   */
  static getCachedMessages() {
    try {
      const cached = localStorage.getItem(this.MESSAGES_CACHE_KEY);
      if (!cached) return null;

      const { messages, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - timestamp > this.CACHE_TTL) {
        localStorage.removeItem(this.MESSAGES_CACHE_KEY);
        return null;
      }
      
      return messages;
    } catch (error) {
      console.warn('Failed to get cached messages:', error);
      localStorage.removeItem(this.MESSAGES_CACHE_KEY);
      return null;
    }
  }

  /**
   * Cache messages in local storage
   * @param {PromotionalMessage[]} messages - Messages to cache
   */
  static setCachedMessages(messages) {
    try {
      const cacheData = {
        messages,
        timestamp: Date.now()
      };
      localStorage.setItem(this.MESSAGES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache messages:', error);
    }
  }

  /**
   * Clear messages cache
   */
  static clearMessagesCache() {
    try {
      localStorage.removeItem(this.MESSAGES_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear messages cache:', error);
    }
  }

  /**
   * Validate message object structure
   * @param {Object} message - Message object to validate
   * @returns {boolean} True if message is valid
   */
  static validateMessage(message) {
    if (!message || typeof message !== 'object') return false;
    
    // Required fields
    const requiredFields = ['id', 'title', 'content', 'type', 'startDate'];
    for (const field of requiredFields) {
      if (!message[field]) return false;
    }
    
    // Valid message types
    const validTypes = ['promotion', 'announcement', 'info'];
    if (!validTypes.includes(message.type)) return false;
    
    // Valid priority range
    if (message.priority !== undefined) {
      const priority = Number(message.priority);
      if (isNaN(priority) || priority < 1 || priority > 10) return false;
    }
    
    // Valid dates
    try {
      new Date(message.startDate);
      if (message.endDate) {
        new Date(message.endDate);
      }
    } catch (error) {
      return false;
    }
    
    return true;
  }

  /**
   * Sanitize message content to prevent XSS
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized content
   */
  static sanitizeContent(content) {
    if (typeof content !== 'string') return '';
    
    // Basic HTML entity encoding
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Format message for display
   * @param {PromotionalMessage} message - Message to format
   * @returns {PromotionalMessage} Formatted message
   */
  static formatMessage(message) {
    if (!message) return null;
    
    return {
      ...message,
      title: this.sanitizeContent(message.title),
      content: this.sanitizeContent(message.content),
      ctaText: message.ctaText ? this.sanitizeContent(message.ctaText) : undefined,
      startDate: new Date(message.startDate),
      endDate: message.endDate ? new Date(message.endDate) : undefined,
      createdAt: new Date(message.createdAt),
      updatedAt: new Date(message.updatedAt),
      priority: Number(message.priority) || 1
    };
  }

  /**
   * Get message type styling class
   * @param {'promotion'|'announcement'|'info'} type - Message type
   * @returns {string} CSS class name for the message type
   */
  static getMessageTypeClass(type) {
    const typeClasses = {
      promotion: 'promotional-message-card--promotion',
      announcement: 'promotional-message-card--announcement',
      info: 'promotional-message-card--info'
    };
    
    return typeClasses[type] || typeClasses.info;
  }

  /**
   * Get message type icon
   * @param {'promotion'|'announcement'|'info'} type - Message type
   * @returns {string} Icon name or emoji for the message type
   */
  static getMessageTypeIcon(type) {
    const typeIcons = {
      promotion: '🎉',
      announcement: '📢',
      info: 'ℹ️'
    };
    
    return typeIcons[type] || typeIcons.info;
  }

  /**
   * Debounce function for API calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function for frequent operations
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

export default PromotionalMessagesUtils;