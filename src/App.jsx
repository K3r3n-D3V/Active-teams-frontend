// // // import { useMemo, useState, useEffect } from 'react';
// // // import { Routes, Route } from 'react-router-dom';
// // // import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
// // // import { useLocation } from 'react-router-dom';

// // // import EventsHistory from './Pages/EventHistory';
// // // import Sidebar from './components/Sidebar';
// // // import TopbarProfile from './components/TopbarProfile';

// // // import Profile from './Pages/Profile';
// // // import { PeopleSection as People } from './Pages/People';
// // // import Events from './Pages/Events';
// // // import Stats from './Pages/Stats';
// // // import ServiceCheckIn from './Pages/ServiceCheckIn';
// // // // import GiveToday from './Pages/GiveToday';
// // // import DailyTasks from './Pages/DailyTasks';
// // // import Home from './Pages/Home';
// // // import Login from "./Pages/Login";
// // // import Signup from "./Pages/Signup";
// // // import CreateEvents from './Pages/CreateEvents';
// // // import AttendanceModal from './Pages/AttendanceModal';
// // // import EventDetails from './Pages/EventDetails';
// // // import ForgotPassword from './components/ForgotPassword'; 
// // // import ResetPassword from './components/ResetPassword';

// // // import withAuthCheck from "./components/withAuthCheck"; // adjust the path if needed
// // // import EventRegistrationForm from './components/EventRegistrationForm';

// // // // Wrap protected pages
// // // const ProtectedProfile = withAuthCheck(Profile);
// // // const ProtectedPeople = withAuthCheck(People);
// // // const ProtectedEvents = withAuthCheck(Events);
// // // const ProtectedStats = withAuthCheck(Stats);
// // // const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
// // // // const ProtectedGiveToday = withAuthCheck(GiveToday);
// // // const ProtectedDailyTasks = withAuthCheck(DailyTasks);
// // // const ProtectedHome = withAuthCheck(Home);

// // // function App() {
// // //   const [mode, setMode] = useState('light');
  
// // //   useEffect(() => {
// // //     const savedMode = localStorage.getItem('themeMode');
// // //     if (savedMode) setMode(savedMode);
// // //   }, []);
  
// // //   const theme = useMemo(
// // //     () =>
// // //       createTheme({
// // //         palette: { mode },
// // //       }),
// // //     [mode]
// // //   );
// // // const location = useLocation();
// // // const noLayoutRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
// // // const hideLayout = noLayoutRoutes.includes(location.pathname);
// // // const user = JSON.parse(localStorage.getItem("user")) || null;


// // //   return (
// // //     <ThemeProvider theme={theme}>
// // //       <CssBaseline />

// // //       {/* ✅ Only show TopbarProfile if layout is not hidden */}
// // //       {!hideLayout && <TopbarProfile />}

// // //       <div style={{ display: 'flex' }}>
// // //         {/* ✅ Only show Sidebar if layout is not hidden */}
// // //         {!hideLayout && <Sidebar mode={mode} setMode={setMode} />}

// // //         <div style={{ flexGrow: 1 }}>
// // //           <Routes>
// // //             <Route path="/login" element={<Login title="Login" mode={mode} setMode={setMode}/>} />
// // //             <Route path="/forgot-password" element={<ForgotPassword mode={mode}/>} />
// // //             <Route path="/reset-password" element={<ResetPassword mode={mode}/>} />
// // //             <Route path="/signup" element={<Signup title="Signup" mode={mode} setMode={setMode}/>} />
// // //             <Route path="/" element={<ProtectedHome />} />
// // //             <Route path="/profile" element={<ProtectedProfile title="Profile" />} />
// // //             <Route path="/people" element={<ProtectedPeople title="People" />} />
// // //             <Route path="/events" element={<ProtectedEvents title="Events"/>}/>
// // //             <Route path="/stats" element={<ProtectedStats title="Stats" />} />
// // //             <Route path="/create-events" element={<CreateEvents title="Create Events" />} />
// // //             <Route path="/edit-event/:id" element={<CreateEvents title="Create Events Edit" />} />
// // //             <Route path="/attendance" element={<AttendanceModal title="Attendance Modal" />} />
          
// // //             <Route path="/event-details" element={<EventDetails title="event-details-screen" />} />
// // //             <Route path="/events-history" element={<EventsHistory title="Events History" user={user} />} />
// // //             <Route path="/service-check-in" element={<ProtectedCheckIn title="Service Check-in" />} />
// // //             {/* <Route path="/give-today" element={<ProtectedGiveToday title="Give Today" />} /> */}
// // //             <Route path="/daily-tasks" element={<ProtectedDailyTasks title="Daily Tasks" />} />
// // //             <Route path="/event-payment/:eventId" element={< EventRegistrationForm title="Event register" />} />
// // //           </Routes>
// // //         </div>
// // //       </div>
// // //     </ThemeProvider>
// // //   );
// // // }

// // // export default App;

// // import { useMemo, useState, useContext, useEffect } from "react";
// // import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// // import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

// // import { AuthContext } from "./contexts/AuthContext";

// // import Sidebar from "./components/Sidebar";
// // import TopbarProfile from "./components/TopbarProfile";

// // import Home from "./Pages/Home";
// // import Profile from "./Pages/Profile";
// // import { PeopleSection as People } from "./Pages/People";
// // import Events from "./Pages/Events";
// // import Stats from "./Pages/Stats";
// // import ServiceCheckIn from "./Pages/ServiceCheckIn";
// // import DailyTasks from "./Pages/DailyTasks";
// // import EventsHistory from "./Pages/EventHistory";
// // import CreateEvents from "./Pages/CreateEvents";
// // import AttendanceModal from "./Pages/AttendanceModal";
// // import EventDetails from "./Pages/EventDetails";
// // import Login from "./Pages/Login";
// // import Signup from "./Pages/Signup";
// // import ForgotPassword from "./components/ForgotPassword";
// // import ResetPassword from "./components/ResetPassword";
// // import EventRegistrationForm from "./components/EventRegistrationForm";
// // import SplashScreen from "./components/SplashScreen";

// // import withAuthCheck from "./components/withAuthCheck";

// // // Wrap protected pages
// // const ProtectedProfile = withAuthCheck(Profile);
// // const ProtectedPeople = withAuthCheck(People);
// // const ProtectedEvents = withAuthCheck(Events);
// // const ProtectedStats = withAuthCheck(Stats);
// // const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
// // const ProtectedDailyTasks = withAuthCheck(DailyTasks);
// // const ProtectedHome = withAuthCheck(Home);

// // function App() {
// //   const { user, loading } = useContext(AuthContext);
// //   const navigate = useNavigate();
// //   const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "light");
// //   const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

// //   const [showSplash, setShowSplash] = useState(true);

// //   // Redirect to login if user logs out
// //   useEffect(() => {
// //     if (!loading && !user) {
// //       navigate("/login", { replace: true });
// //     }
// //   }, [user, loading, navigate]);

// //   if (loading) return null; // wait until AuthContext finishes checking

// //   if (showSplash) {
// //     return (
// //       <SplashScreen
// //         onFinish={() => setShowSplash(false)}
// //         duration={6000} // 6 seconds splash
// //       />
// //     );
// //   }

// //   return (
// //     <ThemeProvider theme={theme}>
// //       <CssBaseline />

// //       {/* Show layout only when logged in */}
// //       {user && <TopbarProfile />}
// //       <div style={{ display: "flex" }}>
// //         {user && <Sidebar mode={mode} setMode={setMode} />}
// //         <div style={{ flexGrow: 1 }}>
// //           <Routes>
// //             {/* Public routes */}
// //             <Route path="/login" element={!user ? <Login mode={mode} setMode={setMode} /> : <Navigate to="/" />} />
// //             <Route path="/signup" element={!user ? <Signup mode={mode} setMode={setMode} /> : <Navigate to="/" />} />
// //             <Route path="/forgot-password" element={<ForgotPassword mode={mode} />} />
// //             <Route path="/reset-password" element={<ResetPassword mode={mode} />} />

// //             {/* Protected routes */}
// //             <Route path="/" element={user ? <ProtectedHome /> : <Navigate to="/login" />} />
// //             <Route path="/profile" element={user ? <ProtectedProfile /> : <Navigate to="/login" />} />
// //             <Route path="/people" element={user ? <ProtectedPeople /> : <Navigate to="/login" />} />
// //             <Route path="/events" element={user ? <ProtectedEvents /> : <Navigate to="/login" />} />
// //             <Route path="/stats" element={user ? <ProtectedStats /> : <Navigate to="/login" />} />
// //             <Route path="/create-events" element={user ? <CreateEvents /> : <Navigate to="/login" />} />
// //             <Route path="/edit-event/:id" element={user ? <CreateEvents /> : <Navigate to="/login" />} />
// //             <Route path="/attendance" element={user ? <AttendanceModal /> : <Navigate to="/login" />} />
// //             <Route path="/event-details" element={user ? <EventDetails /> : <Navigate to="/login" />} />
// //             <Route path="/events-history" element={user ? <EventsHistory user={user} /> : <Navigate to="/login" />} />
// //             <Route path="/service-check-in" element={user ? <ProtectedCheckIn /> : <Navigate to="/login" />} />
// //             <Route path="/daily-tasks" element={user ? <ProtectedDailyTasks /> : <Navigate to="/login" />} />
// //             <Route path="/event-payment/:eventId" element={user ? <EventRegistrationForm /> : <Navigate to="/login" />} />
// //           </Routes>
// //         </div>
// //       </div>
// //     </ThemeProvider>
// //   );
// // }

// // export default App;

// import { useMemo, useState, useContext, useEffect } from "react";
// import { Routes, Route, Navigate, useLocation } from "react-router-dom";
// import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

// import { AuthContext } from "./contexts/AuthContext";

// import Sidebar from "./components/Sidebar";
// import TopbarProfile from "./components/TopbarProfile";

// import Home from "./Pages/Home";
// import Profile from "./Pages/Profile";
// import { PeopleSection as People } from "./Pages/People";
// import Events from "./Pages/Events";
// import Stats from "./Pages/Stats";
// import ServiceCheckIn from "./Pages/ServiceCheckIn";
// import DailyTasks from "./Pages/DailyTasks";
// import EventsHistory from "./Pages/EventHistory";
// import CreateEvents from "./Pages/CreateEvents";
// import AttendanceModal from "./Pages/AttendanceModal";
// import EventDetails from "./Pages/EventDetails";
// import Login from "./Pages/Login";
// import Signup from "./Pages/Signup";
// import ForgotPassword from "./components/ForgotPassword";
// import ResetPassword from "./components/ResetPassword";
// import EventRegistrationForm from "./components/EventRegistrationForm";
// import SplashScreen from "./components/SplashScreen";

// import withAuthCheck from "./components/withAuthCheck";

// // Wrap protected pages
// const ProtectedProfile = withAuthCheck(Profile);
// const ProtectedPeople = withAuthCheck(People);
// const ProtectedEvents = withAuthCheck(Events);
// const ProtectedStats = withAuthCheck(Stats);
// const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
// const ProtectedDailyTasks = withAuthCheck(DailyTasks);
// const ProtectedHome = withAuthCheck(Home);

// function App() {
//   const { user, loading } = useContext(AuthContext);
//   const location = useLocation();
//   const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "light");
//   const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

//   // Show splash screen only on initial app load and only if user is not logged in
//   const [showSplash, setShowSplash] = useState(() => {
//     // Don't show splash if user is already logged in or splash was already shown
//     const hasUser = localStorage.getItem('user');
//     const splashShown = sessionStorage.getItem('splashShown');
//     return !hasUser && !splashShown;
//   });

//   // Define routes that shouldn't show the layout (sidebar + topbar)
//   const noLayoutRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
//   const hideLayout = noLayoutRoutes.includes(location.pathname);

//   // Handle splash screen completion
//   const handleSplashFinish = () => {
//     setShowSplash(false);
//     sessionStorage.setItem('splashShown', 'true');
//   };

//   // Save theme mode to localStorage when it changes
//   useEffect(() => {
//     localStorage.setItem("themeMode", mode);
//   }, [mode]);

//   // Wait for auth loading to complete before rendering anything
//   if (loading) {
//     // You can show a loading spinner here if needed
//     return (
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'center', 
//         alignItems: 'center', 
//         height: '100vh' 
//       }}>
//         Loading...
//       </div>
//     );
//   }

//   // Show splash screen only on initial load
//   if (showSplash) {
//     return (
//       <SplashScreen
//         onFinish={handleSplashFinish}
//         duration={3000} // 3 seconds splash
//       />
//     );
//   }

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />

//       {/* Show topbar only when layout is not hidden */}
//       {!hideLayout && <TopbarProfile />}

//       <div style={{ display: "flex" }}>
//         {/* Show sidebar only when layout is not hidden */}
//         {!hideLayout && <Sidebar mode={mode} setMode={setMode} />}
        
//         <div style={{ flexGrow: 1 }}>
//           <Routes>
//             {/* Public routes */}
//             <Route 
//               path="/login" 
//               element={<Login title="Login" mode={mode} setMode={setMode} />} 
//             />
//             <Route 
//               path="/signup" 
//               element={<Signup title="Signup" mode={mode} setMode={setMode} />} 
//             />
//             <Route 
//               path="/forgot-password" 
//               element={<ForgotPassword mode={mode} />} 
//             />
//             <Route 
//               path="/reset-password" 
//               element={<ResetPassword mode={mode} />} 
//             />

//             {/* Protected routes */}
//             <Route path="/" element={<ProtectedHome />} />
//             <Route path="/profile" element={<ProtectedProfile title="Profile" />} />
//             <Route path="/people" element={<ProtectedPeople title="People" />} />
//             <Route path="/events" element={<ProtectedEvents title="Events" />} />
//             <Route path="/stats" element={<ProtectedStats title="Stats" />} />
//             <Route path="/create-events" element={<CreateEvents title="Create Events" />} />
//             <Route path="/edit-event/:id" element={<CreateEvents title="Create Events Edit" />} />
//             <Route path="/attendance" element={<AttendanceModal title="Attendance Modal" />} />
//             <Route path="/event-details" element={<EventDetails title="event-details-screen" />} />
//             <Route path="/events-history" element={<EventsHistory title="Events History" user={user} />} />
//             <Route path="/service-check-in" element={<ProtectedCheckIn title="Service Check-in" />} />
//             <Route path="/daily-tasks" element={<ProtectedDailyTasks title="Daily Tasks" />} />
//             <Route path="/event-payment/:eventId" element={<EventRegistrationForm title="Event register" />} />
//           </Routes>
//         </div>
//       </div>
//     </ThemeProvider>
//   );
// }

// export default App;

import { useMemo, useState, useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

import { AuthContext } from "./contexts/AuthContext";

import Sidebar from "./components/Sidebar";
import TopbarProfile from "./components/TopbarProfile";

import Home from "./Pages/Home";
import Profile from "./Pages/Profile";
import { PeopleSection as People } from "./Pages/People";
import Events from "./Pages/Events";
import Stats from "./Pages/Stats";
import ServiceCheckIn from "./Pages/ServiceCheckIn";
import DailyTasks from "./Pages/DailyTasks";
import EventsHistory from "./Pages/EventHistory";
import CreateEvents from "./Pages/CreateEvents";
import AttendanceModal from "./Pages/AttendanceModal";
import EventDetails from "./Pages/EventDetails";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import EventRegistrationForm from "./components/EventRegistrationForm";
import SplashScreen from "./components/SplashScreen";

import withAuthCheck from "./components/withAuthCheck";

// Wrap protected pages
const ProtectedProfile = withAuthCheck(Profile);
const ProtectedPeople = withAuthCheck(People);
const ProtectedEvents = withAuthCheck(Events);
const ProtectedStats = withAuthCheck(Stats);
const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
const ProtectedDailyTasks = withAuthCheck(DailyTasks);
const ProtectedHome = withAuthCheck(Home);

function App() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "light");
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  const [showSplash, setShowSplash] = useState(true);

  // Define routes that shouldn't show layout
  const noLayoutRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const hideLayout = noLayoutRoutes.includes(location.pathname);

  // Remove redirect logic from App.js - let withAuthCheck HOC handle all redirects
  // This prevents conflicts between App.js and withAuthCheck redirects

  // Debug logging - remove after testing
  useEffect(() => {
    console.log('🔍 Debug Info:', {
      user: !!user,
      loading,
      showSplash,
      currentPath: location.pathname,
      shouldRedirect: !loading && !user && !showSplash
    });
  }, [user, loading, showSplash, location.pathname]);

  // Show splash screen first, regardless of auth status
  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => setShowSplash(false)}
        duration={6000} // 6 seconds splash
      />
    );
  }

  if (loading) return null; // wait until AuthContext finishes checking

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Show layout only when user is authenticated (not just logged in) */}
      {user && !hideLayout && <TopbarProfile />}
      
      <div style={{ display: "flex" }}>
        {user && !hideLayout && <Sidebar mode={mode} setMode={setMode} />}
        
        <div style={{ flexGrow: 1 }}>
          <Routes>
            {/* Public routes - accessible whether logged in or not */}
            <Route 
              path="/login" 
              element={
                !user ? (
                  <Login mode={mode} setMode={setMode} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/signup" 
              element={
                !user ? (
                  <Signup mode={mode} setMode={setMode} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route path="/forgot-password" element={<ForgotPassword mode={mode} />} />
            <Route path="/reset-password" element={<ResetPassword mode={mode} />} />

            {/* Protected routes - let withAuthCheck HOC handle redirects */}
            <Route path="/" element={<ProtectedHome />} />
            <Route path="/profile" element={<ProtectedProfile title="Profile" />} />
            <Route path="/people" element={<ProtectedPeople title="People" />} />
            <Route path="/events" element={<ProtectedEvents title="Events" />} />
            <Route path="/stats" element={<ProtectedStats title="Stats" />} />
            <Route path="/create-events" element={<CreateEvents title="Create Events" />} />
            <Route path="/edit-event/:id" element={<CreateEvents title="Create Events Edit" />} />
            <Route path="/attendance" element={<AttendanceModal title="Attendance Modal" />} />
            <Route path="/event-details" element={<EventDetails title="event-details-screen" />} />
            <Route path="/events-history" element={<EventsHistory title="Events History" user={user} />} />
            <Route path="/service-check-in" element={<ProtectedCheckIn title="Service Check-in" />} />
            <Route path="/daily-tasks" element={<ProtectedDailyTasks title="Daily Tasks" />} />
            <Route path="/event-payment/:eventId" element={<EventRegistrationForm title="Event register" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;