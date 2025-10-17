/**
 * @module api-response
 * @description Utilities for formatting and handling API responses.
 */

/**
 * Checks if the API response indicates a successful request.
 * @param {object} response - The API response object.
 * @returns {boolean} True if the response is successful, false otherwise.
 */
export function isSuccessResponse(response) {
  return response && response.success === true;
}

/**
 * Extracts data from a successful API response.
 * @param {object} response - The API response object.
 * @param {string} [dataKey=null] - The key to extract from the response data.
 * @returns {*} The extracted data, or the entire data object if no key is provided. Returns null if the response is not successful.
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
 * Formats customer balance data from the API for display.
 * @param {object} balanceData - The balance data from the API.
 * @returns {object|null} A formatted balance object or null if input is invalid.
 */
export function formatCustomerBalance(balanceData) {
  if (!balanceData) return null;
  
  if (balanceData.currencies) {
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
 * Formats credit slip data from the API for display.
 * @param {object} slipData - The credit slip data from the API.
 * @returns {object|null} A formatted credit slip object or null if input is invalid.
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
 * Formats transaction entry data from the API for display.
 * @param {object} entryData - The transaction entry data from the API.
 * @returns {object|null} A formatted transaction entry object or null if input is invalid.
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
 * Formats customer data from the API for display.
 * @param {object} customerData - The customer data from the API.
 * @returns {object|null} A formatted customer object or null if input is invalid.
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
 * Formats product data from the API for display.
 * @param {object} productData - The product data from the API.
 * @returns {object|null} A formatted product object or null if input is invalid.
 */
export function formatProductData(productData) {
  if (!productData) return null;
  
  const variant = productData.variants && productData.variants[0];
  const storeInfo = variant && variant.stores && variant.stores[0];
  
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
 * Formats pagination data from the API.
 * @param {object} paginationData - The pagination data from the API.
 * @returns {object|null} A formatted pagination object or null if input is invalid.
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
 * Creates a credit slip payload for an API request.
 * @param {object} formData - The form data for the credit slip.
 * @returns {object} The API request payload.
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
 * Creates a payment payload for an API request.
 * @param {object} formData - The form data for the payment.
 * @returns {object} The API request payload.
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