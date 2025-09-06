import { BanknotesIcon, GiftIcon, TicketIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useUser } from '../providers/UserProvider' 

function formatNumber(n) {
  try { return new Intl.NumberFormat().format(Number(n || 0)); } catch { return String(n || 0); }
}

function formatTZS(n) {
  const val = Number(n || 0);
  try { return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(val); } catch { return `TZS ${formatNumber(val)}`; }
}

const redeemOptions = [
  { id: 'espresso', name: 'Free Espresso', desc: 'Single shot, any size', cost: 50, icon: GiftIcon },
  { id: 'pastry', name: 'Any Pastry', desc: 'From the counter', cost: 80, icon: TicketIcon }, 
]

export default function LeaderBoard() {
  const user = useUser();
  const points = Number(user?.total_points || 0);
  const outstanding = user?.outstanding_balance != null ? Number(user.outstanding_balance) : 0; // if not provided, shows 0

  const handleRedeem = (option) => { 
    console.log('Redeem option selected:', option);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Rewards & Balance</h3>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4"> 
        <div key={user?.id || 'loya'} className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
          <div className="absolute left-5 top-5 rounded-md bg-[#1f2a44] p-3">
            <UsersIcon aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <div className="ml-16">
            <p className="truncate text-sm font-medium text-gray-500">L¥</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{formatNumber(points)}</p>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className={`relative overflow-hidden rounded-lg border p-5 shadow-sm ${
          outstanding > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className={`absolute left-5 top-5 rounded-md p-3 ${
            outstanding > 0 
              ? 'bg-red-500' 
              : 'bg-green-500'
          }`}>
            <BanknotesIcon aria-hidden="true" className="h-6 w-6 text-white" />
          </div>
          <div className="ml-16">
            <p className={`truncate text-sm font-medium ${
              outstanding > 0 
                ? 'text-red-600' 
                : 'text-green-600'
            }`}>
              {outstanding > 0 ? 'Outstanding Balance' : 'Balance Status'}
            </p>
            <p className={`mt-1 text-2xl font-semibold ${
              outstanding > 0 
                ? 'text-red-900' 
                : 'text-green-900'
            }`}>
              {outstanding > 0 ? formatTZS(outstanding) : 'All Clear ✓'}
            </p>
            {outstanding > 0 && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                Please settle this amount at your next visit
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Redeem Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Redeem points</h4>
        <div className="grid grid-cols-1 gap-3">
          {redeemOptions.map((opt) => {
            const Icon = opt.icon;
            const canRedeem = points >= opt.cost;
            return (
              <div key={opt.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-gray-50 p-2 ring-1 ring-gray-200">
                    <Icon className="h-5 w-5 text-[#1f2a44]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.name}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                    <p className="mt-1 text-xs font-medium text-gray-700">Cost: {formatNumber(opt.cost)} pts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => canRedeem && handleRedeem(opt)}
                  disabled={!canRedeem}
                  className={
                    "inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 " +
                    (canRedeem
                      ? "bg-[#1f2a44] text-white hover:brightness-110 focus:ring-[#1f2a44]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed focus:ring-gray-200")
                  }
                >
                  {canRedeem ? 'Redeem' : 'Not enough points'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
