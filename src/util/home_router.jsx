import React from 'react';
import { useUser } from '../providers/UserProvider';
import { useStaffAuthStatus } from '../providers/UserProvider';
import Login from '../pages/login';
import Home from '../Home';
import Register from '../pages/register';
import StaffLogin from '../pages/staff/staff-login';
import StaffRouter from './staff-router';
import StaffProtectedRoute from '../components/StaffProtectedRoute';


export default function HomeRouter() {

    const user = useUser();
    const isStaffAuthenticated = useStaffAuthStatus();

    // Check if current path is a staff route
    const currentPath = window.location.pathname;

    if (currentPath.startsWith('/staff')) {
        if (currentPath === '/staff/login') {
            return <StaffLogin />;
        } else {
            return (
                <StaffProtectedRoute>
                    <StaffRouter />
                </StaffProtectedRoute>
            );
        }
    }

    // Regular customer flow
    return user.loyverse_id ? <Home /> : <Register />;
}