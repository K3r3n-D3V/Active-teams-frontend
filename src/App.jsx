import { useEffect, useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import Sidebar from './components/Sidebar';
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
  // Load saved theme from localStorage or default to light
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        ...(mode === 'light'
          ? {
              background: {
                default: '#f5f5f5',
                paper: '#fff',
              },
            }
          : {
              background: {
                default: '#121212',
                paper: '#1e1e1e',
              },
            }),
      },
    }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopbarProfile />
      <div style={{ display: 'flex' }}>
        <Sidebar mode={mode} setMode={setMode} />
        <div style={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/signup" element={<Signup mode={mode} setMode={setMode} />} />
            <Route path="/login" element={<Login mode={mode} setMode={setMode} />} />
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile title="Profile" />} />
            <Route path="/people" element={<People title="People" />} />
            <Route path="/events" element={<Events title="Events" />} />
            <Route path="/stats" element={<Stats title="Stats" />} />
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
