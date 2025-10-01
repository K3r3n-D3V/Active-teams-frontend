import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
  useMediaQuery,
  Typography,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
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
import logo from "../assets/active-teams.png"

const allMenuItems = [
  { label: 'Home', path: '/', icon: Home, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'Profile', path: '/profile', icon: Person, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'People', path: '/people', icon: Group, roles: ['admin', 'leader'] },
  { label: 'Events', path: '/events', icon: Event, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'Stats', path: '/stats', icon: BarChart, roles: ['admin'] },
  { label: 'Service Check-in', path: '/service-check-in', icon: HowToReg, roles: ['admin', 'registrant'] },
  { label: 'Daily Tasks', path: '/daily-tasks', icon: Assignment, roles: ['admin', 'leader', 'user', 'registrant'] },
  { label: 'Admin', path: '/admin', icon: AdminPanelSettings, roles: ['admin'] },
];

export default function Sidebar({ mode, setMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // Load mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) setMode(savedMode);
  }, [setMode]);

  const handleToggleMode = () => {
    setMode((prev) => {
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

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(user?.role)
  );

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
      {/* Logo */}
      <Box sx={{ padding: 2, display: 'flex', justifyContent: 'center', mt: "15px" }}>
        <img
          src={logo}
          alt="Active Church Logo"
          style={{
            maxWidth: '100%',
            maxHeight: '100px',
            height: 'auto',
            borderRadius: 8,
            filter: mode === 'dark' ? 'invert(1) brightness(2)' : 'none',
          }}
        />
      </Box>

      {/* User Info */}
      {/* {user && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="caption" sx={{ color: textColor, opacity: 0.7 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" display="block" sx={{ color: textColor, opacity: 0.5, textTransform: 'capitalize' }}>
            {user.role}
          </Typography>
        </Box>
      )} */}

      {/* Menu Items */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <ListItemButton
              key={label}
              component={Link}
              to={path}
              selected={isActive}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                color: isActive ? activeTextColor : textColor,
                backgroundColor: isActive
                  ? mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)'
                  : 'transparent',
                borderLeft: isActive
                  ? `4px solid ${mode === 'dark' ? '#ffffff' : '#000000'}`
                  : '4px solid transparent',
                '&:hover': {
                  backgroundColor: mode === 'dark'
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.12)',
                  color: activeTextColor,
                  '& .MuiListItemIcon-root': { color: activeTextColor },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Dark/Light Toggle */}
      <Box sx={{ margin: 7, display: 'flex', justifyContent: 'center' }}>
        <IconButton
          onClick={handleToggleMode}
          sx={{
            color: mode === 'dark' ? '#fff' : '#000',
            backgroundColor: mode === 'dark' ? '#1f1f1f' : '#e0e0e0',
            '&:hover': {
              backgroundColor: mode === 'dark' ? '#615a5aff' : '#a79c9cff',
            },
          }}
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
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
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            height: '100vh',
            backgroundColor: bgColor,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}