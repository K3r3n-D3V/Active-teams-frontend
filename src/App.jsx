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
import Admin from "./Pages/Admin";

// Wrap protected pages
const ProtectedProfile = withAuthCheck(Profile);
const ProtectedPeople = withAuthCheck(People);
const ProtectedEvents = withAuthCheck(Events);
const ProtectedStats = withAuthCheck(Stats);
const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
const ProtectedDailyTasks = withAuthCheck(DailyTasks);
const ProtectedHome = withAuthCheck(Home);
const ProtectedAdmin = withAuthCheck(Admin);

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

  if (loading) return null; 

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
            <Route path="/admin" element={<ProtectedAdmin />} />
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