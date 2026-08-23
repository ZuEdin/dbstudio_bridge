
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Init i18n

// Polyfill for crypto.randomUUID in non-secure HTTP contexts
if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    (globalThis as any).crypto = {};
  }
  if (typeof globalThis.crypto.randomUUID !== 'function') {
    (globalThis.crypto as any).randomUUID = function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      if (typeof globalThis.crypto.getRandomValues === 'function') {
        try {
          return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
            (c ^ (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
          ) as `${string}-${string}-${string}-${string}-${string}`;
        } catch {
          // fallback to Math.random if getRandomValues fails
        }
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

// Suppress recharts defaultProps warning
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Support for defaultProps will be removed from function components')) {
    return;
  }
  originalError.call(console, ...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
