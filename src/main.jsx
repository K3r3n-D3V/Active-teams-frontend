import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { TaskUpdateProvider } from './contexts/TaskUpdateContext';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
       <TaskUpdateProvider>
    <ErrorBoundary>
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
    </ErrorBoundary>
       </TaskUpdateProvider>
  </React.StrictMode>
);
