/**
 * API response formatting utilities
 */

/**
 * Check if API response indicates success
 * @param {Object} response - API response
 * @returns {b  return {
    item_id: productData.id,
    item_name: productData.item_name,
    description: productData.description,
    variant_id: variant ? variant.variant_id : null,
    sku: variant ? variant.sku : null,
    price_cents: (productData.default_price || (storeInfo ? storeInfo.price : 0)) * 100,
    available_for_sale: storeInfo ? storeInfo.available_for_sale : false,
    image_url: productData.image_url,
    category_id: productData.category_id
  };ther response is successful
 */
export function isSuccessResponse(response) {
  return response && response.success === true;
}

/**
 * Extract data from successful API response
 * @param {Object} response - API response
 * @param {string} dataKey - Key to extract from response data (optional)
 * @returns {any} Extracted data
 */
export function extractResponseData(response, dataKey = null) {
  if (!isSuccessResponse(response)) {
    return null;
  }
  
  if (dataKey && response.data && response.data[dataKey]) {
    return response.data[dataKey];
  }
  
  return response.data || response;
}

/**
 * Format customer balance for display
 * @param {Object} balanceData - Balance data from API
 * @returns {Object} Formatted balance object
 */
export function formatCustomerBalance(balanceData) {
  if (!balanceData) return null;
  
  // Handle both single currency and multi-currency responses
  if (balanceData.currencies) {
    // Multi-currency response
    const tzsBalance = balanceData.currencies.find(c => c.currency === 'TZS');
    return tzsBalance ? {
      customer_id: balanceData.customer_id,
      currency: 'TZS',
      balance_cents: tzsBalance.balance_cents || 0,
      wallet_cents: tzsBalance.wallet_cents || 0,
      outstanding_cents: tzsBalance.outstanding_cents || 0,
      open_slips_count: tzsBalance.open_slips_count || 0,
      account_status: tzsBalance.account_status || 'ACTIVE'
    } : null;
  } else {
    // Single currency response
    return {
      customer_id: balanceData.customer_id,
      currency: balanceData.currency || 'TZS',
      balance_cents: balanceData.balance_cents || 0,
      wallet_cents: balanceData.wallet_cents || 0,
      outstanding_cents: balanceData.outstanding_cents || 0,
      open_slips_count: balanceData.open_slips_count || 0,
      account_status: balanceData.account_status || 'ACTIVE'
    };
  }
}

/**
 * Format credit slip for display
 * @param {Object} slipData - Credit slip data from API
 * @returns {Object} Formatted credit slip object
 */
export function formatCreditSlip(slipData) {
  if (!slipData) return null;
  
  return {
    slip_id: slipData._id || slipData.slip_id,
    slip_number: slipData.slip_number,
    customer_id: slipData.customer_id,
    store_id: slipData.store_id,
    currency: slipData.currency || 'TZS',
    status: slipData.status,
    lines: slipData.lines || [],
    totals: slipData.totals || {
      subtotal_cents: 0,
      tax_cents: 0,
      discount_cents: 0,
      grand_total_cents: 0,
      paid_cents: 0,
      remaining_cents: 0
    },
    occurred_at: slipData.occurred_at,
    created_at: slipData.created_at,
    updated_at: slipData.updated_at
  };
}

/**
 * Format transaction entry for display
 * @param {Object} entryData - Transaction entry data from API
 * @returns {Object} Formatted transaction entry
 */
export function formatTransactionEntry(entryData) {
  if (!entryData) return null;
  
  return {
    entry_id: String(entryData.entry_id || entryData._id || ''),
    entry_type: entryData.entry_type,
    direction: entryData.direction,
    amount_cents: entryData.amount_cents || 0,
    occurred_at: entryData.occurred_at,
    description: entryData.description,
    source: entryData.source || {},
    created_at: entryData.created_at
  };
}

/**
 * Format customer data for display
 * @param {Object} customerData - Customer data from API
 * @returns {Object} Formatted customer object
 */
export function formatCustomerData(customerData) {
  if (!customerData) return null;
  
  return {
    customer_id: String(customerData._id || customerData.id || customerData.customer_id || ''),
    loyverse_id: customerData.loyverse_id || customerData.id,
    name: customerData.name,
    email: customerData.email,
    phone_number: customerData.phone_number,
    nickname: customerData.nickname,
    total_points: customerData.total_points || 0,
    total_spent: customerData.total_spent || 0,
    total_visits: customerData.total_visits || 0,
    created_at: customerData.created_at,
    updated_at: customerData.updated_at
  };
}

/**
 * Format product data for display
 * @param {Object} productData - Product data from API
 * @returns {Object} Formatted product object
 */
export function formatProductData(productData) {
  if (!productData) return null;
  
  const variant = productData.variants && productData.variants[0];
  const storeInfo = variant && variant.stores && variant.stores[0];
  
  // Get price from variant's default_price (in cents) if available
  // The API returns prices in the actual currency amount (e.g., 8000)
  // We don't need to multiply by 100 since formatTZS will divide by 100
  const price = variant && variant.default_price 
    ? variant.default_price
    : (storeInfo ? storeInfo.price : 0);
  
  return {
    item_id: productData.id,
    item_name: productData.item_name,
    description: productData.description,
    variant_id: variant ? variant.variant_id : null,
    sku: variant ? variant.sku : null,
    price_cents: price,
    available_for_sale: storeInfo ? storeInfo.available_for_sale : false,
    image_url: productData.image_url,
    category_id: productData.category_id
  };
}

/**
 * Format pagination data
 * @param {Object} paginationData - Pagination data from API
 * @returns {Object} Formatted pagination object
 */
export function formatPaginationData(paginationData) {
  if (!paginationData) return null;
  
  return {
    current_page: paginationData.current_page || 1,
    per_page: paginationData.per_page || 20,
    total_entries: paginationData.total_entries || 0,
    total_pages: paginationData.total_pages || 1,
    has_next: paginationData.has_next || false,
    has_prev: paginationData.has_prev || false
  };
}

/**
 * Create API request payload for credit slip
 * @param {Object} formData - Form data
 * @returns {Object} API request payload
 */
export function createCreditSlipPayload(formData) {
  return {
    customer_id: formData.customer_id,
    store_id: formData.store_id || 'default-store',
    currency: 'TZS',
    lines: formData.lines.map(line => ({
      item_id: line.item_id,
      description: line.description,
      quantity: line.quantity,
      unit_price_cents: line.unit_price_cents
    })),
    tax_cents: formData.tax_cents || 0,
    discount_cents: formData.discount_cents || 0,
    occurred_at: formData.occurred_at || new Date().toISOString()
  };
}

/**
 * Create API request payload for payment
 * @param {Object} formData - Form data
 * @returns {Object} API request payload
 */
export function createPaymentPayload(formData) {
  return {
    customer_id: formData.customer_id,
    store_id: formData.store_id || 'default-store',
    currency: 'TZS',
    method: formData.method,
    amount_cents: formData.amount_cents,
    allocations: formData.allocations || [],
    occurred_at: formData.occurred_at || new Date().toISOString()
  };
}