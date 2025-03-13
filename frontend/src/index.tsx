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

// Enable mock API for development with more prominent logging
if (process.env.NODE_ENV === 'development') {
  // The import itself enables the mock API
  console.log('Mock API enabled in development mode');
  console.log('All API requests will be intercepted by mock API');
  // Force axios to use the mock adapter by importing it first
  window.USE_MOCK_API = true;
}

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
