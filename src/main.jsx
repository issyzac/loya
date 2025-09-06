import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx' 
import './index.css'
import { UserProvider } from './providers/UserProvider'
import { AppProvider } from './providers/AppProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
)
