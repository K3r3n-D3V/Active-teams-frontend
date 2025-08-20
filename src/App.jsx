import { useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

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
import Signup from './Pages/Signup';
import Login from './Pages/Login';
import TopbarProfile from './components/TopbarProfile';

function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: mode,
      },
    }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopbarProfile/>
      <div style={{ display: 'flex' }}>
        <Sidebar mode={mode} setMode={setMode} />
        <div style={{ flexGrow: 1 }}>
          <Routes>
            {/* Dummy route for testing */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile title="Profile" />} />
            <Route path="/people" element={<People title="People" />} />
            <Route path="/events" element={<Events title="Events" />} />
            <Route path="/stats" element={<Stats title="Stats" />} />
            {/* <Route path="/financial-reports" element={<DummyPage title="Financial Reports" />} /> */}
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
