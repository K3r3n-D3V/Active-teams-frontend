// import { useMemo, useState, useEffect } from 'react';
// import { Routes, Route } from 'react-router-dom';
// import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

// import Sidebar from './components/Sidebar';
// // import Header from './components/Header';
// import Profile from './Pages/Profile';
// import { PeopleSection as People } from './Pages/People';
// import Events from './Pages/Events';
// import Stats from './Pages/Stats';
// import ServiceCheckIn from './Pages/ServiceCheckIn';
// import GiveToday from './Pages/GiveToday';
// import DailyTasks from './Pages/DailyTasks';
// import Home from './Pages/Home';
// import TopbarProfile from './components/TopbarProfile';
// import Login from "./Pages/Login";
// import Signup from "./Pages/Signup";

// function App() {
//   const [mode, setMode] = useState('light');

//   // Load saved mode from localStorage on mount
//   useEffect(() => {
//     const savedMode = localStorage.getItem('themeMode');
//     if (savedMode) setMode(savedMode);
//   }, []);

//   const theme = useMemo(
//     () =>
//       createTheme({
//         palette: {
//           mode: mode,
//         },
//       }),
//     [mode]
//   );

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <TopbarProfile />
//       <div style={{ display: 'flex' }}>
//         <Sidebar mode={mode} setMode={setMode} />
//         <div style={{ flexGrow: 1 }}>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/login" element={<Login title="Login" />} />
//             <Route path="/signup" element={<Signup title="Signup" />} />
//             <Route path="/profile" element={<Profile title="Profile" />} />
//             <Route path="/people" element={<People title="People" />} />
//             <Route path="/events" element={<Events title="Events" />} />
//             <Route path="/stats" element={<Stats title="Stats" />} />
//             <Route path="/service-check-in" element={<ServiceCheckIn title="Service Check-in" />} />
//             <Route path="/give-today" element={<GiveToday title="Give Today" />} />
//             <Route path="/daily-tasks" element={<DailyTasks title="Daily Tasks" />} />
//           </Routes>
//         </div>
//       </div>
//     </ThemeProvider>
//   );
// }

// export default App;

import { useMemo, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import EventsHistory from './Pages/EventHistory';
import Sidebar from './components/Sidebar';
import TopbarProfile from './components/TopbarProfile';

import Profile from './Pages/Profile';
import { PeopleSection as People } from './Pages/People';
import Events from './Pages/Events';
import Stats from './Pages/Stats';
import ServiceCheckIn from './Pages/ServiceCheckIn';
import GiveToday from './Pages/GiveToday';
import DailyTasks from './Pages/DailyTasks';
import Home from './Pages/Home';
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import CreateEvents from './Pages/CreateEvents';
import AttendanceModal from './Pages/AttendanceModal';
import ForgotPassword from './components/ForgotPassword'; 
import ResetPassword from './components/ResetPassword';

import withAuthCheck from "./components/withAuthCheck"; // adjust the path if needed

// Wrap protected pages
const ProtectedProfile = withAuthCheck(Profile);
const ProtectedPeople = withAuthCheck(People);
const ProtectedEvents = withAuthCheck(Events);
const ProtectedStats = withAuthCheck(Stats);
const ProtectedCheckIn = withAuthCheck(ServiceCheckIn);
const ProtectedGiveToday = withAuthCheck(GiveToday);
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopbarProfile />
      <div style={{ display: 'flex' }}>
        <Sidebar mode={mode} setMode={setMode} />
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/login" element={<Login title="Login" mode={mode} setMode={setMode}/>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/signup" element={<Signup title="Signup" mode={mode} setMode={setMode}/>} />
            <Route path="/" element={<ProtectedHome />} />
            <Route path="/profile" element={<ProtectedProfile title="Profile" />} />
            <Route path="/people" element={<ProtectedPeople title="People" />} />
            <Route
              path="/events"
              element={<ProtectedEvents title="Events"/>}/>
            <Route path="/stats" element={<ProtectedStats title="Stats" />} />
           <Route path="/create-events" element={<CreateEvents title="Create Events" />} />
           <Route path="/edit-event/:id" element={<CreateEvents title="Create Events Edit" />} />

            <Route path="/attendance" element={<AttendanceModal title="Attendance Modal" />} />
            <Route
              path="/history"
              element={<EventsHistory />}
            />
            <Route path="/service-check-in" element={<ProtectedCheckIn title="Service Check-in" />} />
            <Route path="/give-today" element={<ProtectedGiveToday title="Give Today" />} />
            <Route path="/daily-tasks" element={<ProtectedDailyTasks title="Daily Tasks" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
