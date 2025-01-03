import { useUser } from '../providers/UserProvider';
import moment from 'moment';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function CustomerProfile() {
  
    const user = useUser();

    return (
      <>
        <div>
          <div className="px-4 sm:px-0">
            <h3 className="text-base/7 font-semibold text-gray-900">Your Enzi Visits</h3>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-500">Track your visit with us and win different prises.</p>
          </div>
          <div className="mt-6 border-t border-gray-100">
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Full name</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"> {user.name} </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">City</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"> {user.city} </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Last Visit</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"> {moment(user.last_visit).format('MMMM Do YYYY')} </dd>
              </div>
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm/6 font-medium text-gray-900">Phone Number</dt>
                <dd className="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"> {user.phone_number} </dd>
              </div>
            </dl>
          </div>
        </div>
    </>
    )
  
}