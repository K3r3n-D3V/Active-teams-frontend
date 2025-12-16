import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
  useMediaQuery,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

import {
  Home,
  Person,
  Group,
  Event,
  BarChart,
  Assignment,
  HowToReg,
  AdminPanelSettings
} from '@mui/icons-material';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import logo from "../assets/active-teams.png";

const allMenuItems = [
  { label: 'Home', path: '/', icon: Home, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'Profile', path: '/profile', icon: Person, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'People', path: '/people', icon: Group, roles: ['admin', 'leader'] },
  { label: 'Events', path: '/events', icon: Event, roles: ['admin', 'leader', 'user', 'registrant'], requiresCell: true },
  { label: 'Stats', path: '/stats', icon: BarChart, roles: ['admin'] },
  { label: 'Service Check-in', path: '/service-check-in', icon: HowToReg, roles: ['admin', 'registrant'] },
  { label: 'Daily Tasks', path: '/daily-tasks', icon: Assignment, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'Admin', path: '/admin', icon: AdminPanelSettings, roles: ['admin'] },
  {
    label: 'Help & Support',
    path: 'https://activemediahelpdesk.netlify.app/',
    icon: SupportAgentIcon,
    external: true,
    roles: ['admin', 'leader', 'user', 'registrant'],
  },
];

export default function Sidebar({ mode, setMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const location = useLocation();

  const { user, authFetch } = useContext(AuthContext);
  const [userHasCell, setUserHasCell] = useState(true);

  // Load mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) setMode(savedMode);
  }, [setMode]);

  // Check if user has a cell
  useEffect(() => {
    const checkUserAccess = async () => {
      if (user?.role !== 'user') return;

      try {
        const res = await authFetch(
          `${import.meta.env.VITE_BACKEND_URL}/check-leader-status`
        );

        if (!res.ok) {
          setUserHasCell(false);
          return;
        }

        const data = await res.json();
        setUserHasCell(Boolean(data.hasCell));
        console.log('🔍 User cell check:', data);
      } catch (err) {
        console.error('Error checking user cell:', err);
        setUserHasCell(false);
      }
    };

    if (user) {
      checkUserAccess();
    }
  }, [user, authFetch]);

  const handleToggleMode = () => {
    setMode(prev => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const bgColor = mode === 'dark' ? '#121212' : '#ffffff';
  const textColor = mode === 'dark' ? '#ffffff' : '#000000';
  const activeTextColor = mode === 'dark' ? '#ffffff' : '#000000';

  if (location.pathname === "/signup" || location.pathname === "/login") {
    return null;
  }

  const menuItems = allMenuItems.filter(item => {
    if (!item.roles.includes(user?.role)) return false;
    if (item.path === '/events' && user?.role === 'user') return userHasCell;
    return true;
  });

  const drawerContent = (
    <Box
      sx={{
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: bgColor,
      }}
    >
      <Box sx={{ padding: 2, display: 'flex', justifyContent: 'center', mt: "15px" }}>
        <img
          src={logo}
          alt="Active Church Logo"
          style={{
            maxWidth: '100%',
            maxHeight: '100px',
            borderRadius: 8,
            filter: mode === 'dark' ? 'invert(1) brightness(2)' : 'none',
          }}
        />
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map(({ label, path, icon: Icon, external }) => (
          <ListItemButton
            key={label}
            component={external ? 'a' : Link}
            to={external ? undefined : path}
            href={external ? path : undefined}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            selected={!external && location.pathname === path}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{
              mb: 0.5,
              borderRadius: 2,
              color: textColor,
              backgroundColor:
                !external && location.pathname === path
                  ? mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)'
                  : 'transparent',
              borderLeft:
                !external && location.pathname === path
                  ? `4px solid ${mode === 'dark' ? '#ffffff' : '#000000'}`
                  : '4px solid transparent',
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ margin: 7, display: 'flex', justifyContent: 'center' }}>
        <IconButton onClick={handleToggleMode}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1300 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          '& .MuiDrawer-paper': {
            width: 240,
            backgroundColor: bgColor,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
