import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Home from './Home'
import reportWebVitals from './reportWebVitals';

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { UserProvider } from './providers/UserProvider';
import HomeRouter from './util/home_router';
import Register from './pages/register';
import { AppProvider } from './providers/AppProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* <App /> */}
    <UserProvider>
      <AppProvider>
        <BrowserRouter>
            <Routes>
              <Route path="*" element={<HomeRouter />} />
            </Routes>
        </BrowserRouter>
      </AppProvider>
    </UserProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
