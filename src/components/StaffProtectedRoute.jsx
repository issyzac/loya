import React from 'react';
import { useStaffAuthStatus } from '../providers/UserProvider';
import StaffLogin from '../pages/staff/staff-login';

export default function StaffProtectedRoute({ children }) {
  const isStaffAuthenticated = useStaffAuthStatus();

  if (!isStaffAuthenticated) {
    return <StaffLogin />;
  }

  return children;
}