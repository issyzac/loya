import ReceiptsList from './receipts-list'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const receiptData = {
  "receipt_number": "2-1000",
  "receipt_type": "SALE",
  "order": null,
  "created_at": "2025-01-02T20:57:42.000Z",
  "updated_at": "2025-01-02T20:57:42.000Z",
  "receipt_date": "2025-01-02T20:57:40.000Z",
  "total_money": 6000,
  "points_earned": 120,
  "points_deducted": 0,
  "points_balance": 130,
  "customer_id": "a8276faa-c8cf-415e-9c60-877e821a305b",
  "line_items": [
      {
          "id": "9553152a-9db3-181c-f6a3-2ab7d912516c",
          "item_id": "5211ed73-7d48-4f66-bfe7-4cacaa30e5a1",
          "variant_id": "d8625ea8-403b-4aff-8a8a-16f8ed692108",
          "item_name": "Espresso",
          "variant_name": "Single",
          "quantity": 1,
          "price": 5000,
          "gross_total_money": 6000,
          "total_money": 6000
      }
  ],
  "payments": [
      {
          "payment_type_id": "f8b20571-c1a6-4c21-859a-fcc08b1cf9da",
          "name": "Mobile Money",
          "type": "OTHER",
          "money_amount": 6000,
          "paid_at": "2025-01-02T20:57:39.000Z",
          "payment_details": null
      }
  ]
}

export default function CustomerHome() {
  return (
    <div className="flow-root">
        <div className="px-4 sm:px-0">
            <h3 className="roboto-serif-heading text-base/7 text-gray-900">Your Enzi Visits</h3>
        </div>
        <div className="relative pb-8">
            <ReceiptsList />
        </div>
    </div>
  )
}