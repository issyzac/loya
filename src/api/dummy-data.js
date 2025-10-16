export const pendingBills = [
  {
    slip_id: '1',
    slip_number: 'CS-001',
    created_at: '2025-10-10T10:00:00Z',
    grand_total: 'TZS 12,000',
    items: [
      { item_id: '101', item_name: 'Cappuccino', quantity: 1, price_total: 'TZS 5,000' },
      { item_id: '102', item_name: 'Americano', quantity: 1, price_total: 'TZS 4,000' },
      { item_id: '103', item_name: 'Sparkling Water', quantity: 1, price_total: 'TZS 3,000' },
    ],
  },
  {
    slip_id: '2',
    slip_number: 'CS-002',
    created_at: '2025-10-09T14:30:00Z',
    grand_total: 'TZS 8,500',
    items: [
      { item_id: '201', item_name: 'Espresso', quantity: 2, price_total: 'TZS 6,000' },
      { item_id: '202', item_name: 'Croissant', quantity: 1, price_total: 'TZS 2,500' },
    ],
  },
];
