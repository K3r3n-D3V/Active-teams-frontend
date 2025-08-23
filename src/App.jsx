import { useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import EventsHistory from './Pages/EventHistory';
import Sidebar from './components/Sidebar';
// import Header from './components/Header';
import Profile from './Pages/Profile';
import People from './Pages/People';
import Events from './Pages/Events';
import Stats from './Pages/Stats';
import ServiceCheckIn from './Pages/ServiceCheckIn';
import GiveToday from './Pages/GiveToday';
import DailyTasks from './Pages/DailyTasks';
import Home from './Pages/Home';
import TopbarProfile from './components/TopbarProfile';
import CreateEvents from './Pages/CreateEvents';
import AttendanceModal from './Pages/AttendanceModal';

function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: mode,
      },
    }), [mode]);

  // 🔐 Simulated logged-in user (replace with real auth later)
  const user = {
    name: "John Doe",
    role: "admin", // or "admin", "leader", etc.
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
            <Route path="/create-events" element={<CreateEvents title="createevents" />} />
            <Route path="/attenance" element={<AttendanceModal title="AttendanceModal" />} />
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
