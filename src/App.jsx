import { useMemo, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { useLocation } from 'react-router-dom';

import EventsHistory from './Pages/EventHistory';
import Sidebar from './components/Sidebar';
import TopbarProfile from './components/TopbarProfile';

import Profile from './Pages/Profile';
import { PeopleSection as People } from './Pages/People';
import Events from './Pages/Events';
import Stats from './Pages/Stats';
import ServiceCheckIn from './Pages/ServiceCheckIn';
// import GiveToday from './Pages/GiveToday';
import DailyTasks from './Pages/DailyTasks';
import Home from './Pages/Home';
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import CreateEvents from './Pages/CreateEvents';
import AttendanceModal from './Pages/AttendanceModal';
import EventDetails from './Pages/EventDetails';
import ForgotPassword from './components/ForgotPassword'; 
import ResetPassword from './components/ResetPassword';

import withAuthCheck from "./components/withAuthCheck"; // adjust the path if needed
import EventRegistrationForm from './components/EventRegistrationForm';

// Wrap protected pages
const ProtectedProfile = withAuthCheck(Profile);
const ProtectedPeople = withAuthCheck(People);
const ProtectedEvents = withAuthCheck(Events);
const ProtectedStats = withAuthCheck(Stats);
const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
// const ProtectedGiveToday = withAuthCheck(GiveToday);
const ProtectedDailyTasks = withAuthCheck(DailyTasks);
const ProtectedHome = withAuthCheck(Home);

function App() {
  const [mode, setMode] = useState('light');
  
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) setMode(savedMode);
  }, []);
  
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode },
      }),
    [mode]
  );
const location = useLocation();
const noLayoutRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
const hideLayout = noLayoutRoutes.includes(location.pathname);
const user = JSON.parse(localStorage.getItem("user")) || null;


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ✅ Only show TopbarProfile if layout is not hidden */}
      {!hideLayout && <TopbarProfile />}

      <div style={{ display: 'flex' }}>
        {/* ✅ Only show Sidebar if layout is not hidden */}
        {!hideLayout && <Sidebar mode={mode} setMode={setMode} />}

        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/login" element={<Login title="Login" mode={mode} setMode={setMode}/>} />
            <Route path="/forgot-password" element={<ForgotPassword mode={mode}/>} />
            <Route path="/reset-password" element={<ResetPassword mode={mode}/>} />
            <Route path="/signup" element={<Signup title="Signup" mode={mode} setMode={setMode}/>} />
            <Route path="/" element={<ProtectedHome />} />
            <Route path="/profile" element={<ProtectedProfile title="Profile" />} />
            <Route path="/people" element={<ProtectedPeople title="People" />} />
            <Route path="/events" element={<ProtectedEvents title="Events"/>}/>
            <Route path="/stats" element={<ProtectedStats title="Stats" />} />
            <Route path="/create-events" element={<CreateEvents title="Create Events" />} />
            <Route path="/edit-event/:id" element={<CreateEvents title="Create Events Edit" />} />
            <Route path="/attendance" element={<AttendanceModal title="Attendance Modal" />} />
          
            <Route path="/event-details" element={<EventDetails title="event-details-screen" />} />
            <Route path="/events-history" element={<EventsHistory title="Events History" user={user} />} />
            <Route path="/service-check-in" element={<ProtectedCheckIn title="Service Check-in" />} />
            {/* <Route path="/give-today" element={<ProtectedGiveToday title="Give Today" />} /> */}
            <Route path="/daily-tasks" element={<ProtectedDailyTasks title="Daily Tasks" />} />
            <Route path="/event-payment/:eventId" element={< EventRegistrationForm title="Event register" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
