import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { registerServiceWorker } from './services/notificationService'
import './styles/globals.css'

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch((error) => {
      console.warn('Service worker registration skipped:', error);
    });
  });
}

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Log to localStorage for debugging
  try {
    const errorLog = {
      type: 'unhandledrejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    const existingLogs = JSON.parse(localStorage.getItem('dogtale-error-logs') || '[]');
    const logs = [...existingLogs, errorLog].slice(-10); // Keep last 10 errors
    localStorage.setItem('dogtale-error-logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to log unhandled rejection to storage:', e);
  }
});

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);

  // Log to localStorage for debugging
  try {
    const errorLog = {
      type: 'uncaughtError',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack || null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    const existingLogs = JSON.parse(localStorage.getItem('dogtale-error-logs') || '[]');
    const logs = [...existingLogs, errorLog].slice(-10); // Keep last 10 errors
    localStorage.setItem('dogtale-error-logs', JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to log error to storage:', e);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
