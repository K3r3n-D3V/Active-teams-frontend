// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App.jsx';
// import { BrowserRouter } from 'react-router-dom';
// import { UserProvider } from './contexts/UserContext';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <UserProvider>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </UserProvider>
//   </React.StrictMode>
// );

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext'; // ✅ updated
import { UserProvider } from './contexts/UserContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);
