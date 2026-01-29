import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { EventCacheProvider } from '../src/components/EventCacheContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EventCacheProvider>
      <ErrorBoundary>
        <AuthProvider>
          <UserProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </UserProvider>
        </AuthProvider>
      </ErrorBoundary>
    </EventCacheProvider>
  </React.StrictMode>
);
