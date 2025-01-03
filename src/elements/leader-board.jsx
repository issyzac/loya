import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid'
import { CursorArrowRaysIcon, EnvelopeOpenIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useUser } from '../providers/UserProvider'

const stats = [
  { id: 1, name: 'Total Subscribers', stat: '71,897', icon: UsersIcon, change: '122', changeType: 'increase' },
  { id: 2, name: 'Avg. Open Rate', stat: '58.16%', icon: EnvelopeOpenIcon, change: '5.4%', changeType: 'increase' },
  { id: 3, name: 'Avg. Click Rate', stat: '24.57%', icon: CursorArrowRaysIcon, change: '3.2%', changeType: 'decrease' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function LeaderBoard() {

  const user = useUser();

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900">Your Enzi Points</h3>
      <div key={user.id} className="relative overflow-hidden rounded-lg bg-white px-4 pb-5 pt-5 shadow sm:px-6 sm:pt-6">
            <dt>
              <div className="absolute rounded-md bg-[#b58150] p-3">
                <UsersIcon aria-hidden="true" className="size-6 text-white" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500"> Total Points </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-2 sm:pb-3">
              <p className="text-2xl font-semibold text-gray-900">{user.total_points}</p>
            </dd>
          </div>
    </div>
  )
}