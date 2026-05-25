import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import QueryProvider from './components/QueryProvider.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#102321',
            color: '#ECE0CC',
            border: '1px solid #2D3C37',
          },
        }}
      />
    </QueryProvider>
  </React.StrictMode>
)
