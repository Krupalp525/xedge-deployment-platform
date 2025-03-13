import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './mockApi'; // Import the mock API configuration

// Declare global window property for TypeScript
declare global {
  interface Window {
    USE_MOCK_API?: boolean;
  }
}

// Initialize mock API in development mode
if (process.env.NODE_ENV === 'development') {
  // Comment out or remove console logs
  // console.log('Mock API enabled in development mode');
  // console.log('All API requests will be intercepted by mock API');
  
  // No need to import mockApi again as it's already imported at the top
}

// Suppress ResizeObserver errors
const originalError = window.console.error;
window.console.error = (...args) => {
  if (
    args[0]?.includes?.('ResizeObserver loop') || 
    args[0]?.includes?.('ResizeObserver loop completed with undelivered notifications') ||
    args[0]?.toString().includes?.('ResizeObserver')
  ) {
    // Suppress all ResizeObserver errors
    return;
  }
  originalError.apply(window.console, args);
};

// Add global error handler to prevent ResizeObserver errors from crashing the app
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('ResizeObserver')) {
    event.stopImmediatePropagation();
    event.preventDefault();
    return false;
  }
  return true;
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
