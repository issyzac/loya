import React from 'react';
import { useUser } from '../providers/UserProvider';
import Login from '../pages/login';
import Home from '../Home';
import Register from '../pages/register';


export default function HomeRouter() {

    const user = useUser();
    console.log(user);
    return user.loyverse_id? <Home/> : <Register />
}