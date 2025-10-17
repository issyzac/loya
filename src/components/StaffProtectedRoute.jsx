import React from 'react';
import { useStaffAuthStatus } from '../providers/UserProvider';
import StaffLogin from '../pages/staff/staff-login';

/**
 * @component StaffProtectedRoute
 * @description A component that protects routes by ensuring only authenticated staff members can access them.
 * If the staff member is not authenticated, it renders the staff login page.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render if the user is authenticated.
 * @returns {React.ReactElement} The child components if authenticated, or the staff login page.
 */
export default function StaffProtectedRoute({ children }) {
  const isStaffAuthenticated = useStaffAuthStatus();

  if (!isStaffAuthenticated) {
    return <StaffLogin />;
  }

  return children;
}