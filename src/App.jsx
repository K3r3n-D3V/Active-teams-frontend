import { useMemo, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import EventsHistory from './Pages/EventHistory';
import Sidebar from './components/Sidebar';
// import Header from './components/Header';
import Profile from './Pages/Profile';
import { PeopleSection as People } from './Pages/People';
import Events from './Pages/Events';
import Stats from './Pages/Stats';
import ServiceCheckIn from './Pages/ServiceCheckIn';
import GiveToday from './Pages/GiveToday';
import DailyTasks from './Pages/DailyTasks';
import Home from './Pages/Home';
import TopbarProfile from './components/TopbarProfile';
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import CreateEvents from './Pages/CreateEvents';
import AttendanceModal from './Pages/AttendanceModal';

function App() {
  const [mode, setMode] = useState('light');

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) setMode(savedMode);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mode,
        },
      }),
    [mode]
  );

  // 🔐 Simulated logged-in user (replace with real auth later)
  const user = {
    name: "John Doe",
    role: "member", // or "admin", "leader", etc.
  };

  // 📅 Shared event state across pages
  const [events, setEvents] = useState([
    {
      _id: "1",
      service_name: "Cell Group A",
      eventType: "cell",
      history: [],
    },
    {
      _id: "2",
      service_name: "Sunday Service",
      eventType: "service",
      history: [],
    },
  ]);

  // ✅ Handler to update a cell group as "did-not-meet"
  const handleMarkDidNotMeet = (eventId, timestamp) => {
    setEvents(prev =>
      prev.map(ev =>
        ev._id === eventId
          ? {
              ...ev,
              history: [
                ...(ev.history || []),
                { status: "did-not-meet", timestamp },
              ],
            }
          : ev
      )
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopbarProfile />
      <div style={{ display: 'flex' }}>
        <Sidebar mode={mode} setMode={setMode} />
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login title="Login" />} />
            <Route path="/signup" element={<Signup title="Signup" />} />
            <Route path="/profile" element={<Profile title="Profile" />} />
            <Route path="/people" element={<People title="People" />} />
            <Route
              path="/events"
              element={
                <Events
                  title="Events"
                  events={events}
                  onMarkDidNotMeet={handleMarkDidNotMeet}
                />
              }
            />
            <Route path="/stats" element={<Stats title="Stats" />} />
            <Route path="/create-events" element={<CreateEvents title="Create Events" />} />
            <Route path="/attendance" element={<AttendanceModal title="Attendance Modal" />} />
            <Route
              path="/history"
              element={<EventsHistory events={events} user={user} />}
            />
            <Route path="/service-check-in" element={<ServiceCheckIn title="Service Check-in" />} />
            <Route path="/give-today" element={<GiveToday title="Give Today" />} />
            <Route path="/daily-tasks" element={<DailyTasks title="Daily Tasks" />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
