import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Box,
  Typography,
  useMediaQuery,
  Switch,
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
  VolunteerActivism,
  HowToReg
} from '@mui/icons-material';
import { useState } from 'react';

const menuItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Profile', path: '/profile', icon: Person },
  { label: 'People', path: '/people', icon: Group },
  { label: 'Events', path: '/events', icon: Event },
  { label: 'Stats', path: '/stats', icon: BarChart },
  { label: 'Service Check-in', path: '/service-check-in', icon: HowToReg },
  { label: 'Give Today', path: '/give-today', icon: VolunteerActivism },
  { label: 'Daily Tasks', path: '/daily-tasks', icon: Assignment },
];

export default function Sidebar({ mode, setMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const location = useLocation();

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

   if (location.pathname === "/signup") {
    return null;
  }

  if (location.pathname === "/login") {
    return null;
  }

  const drawerContent = (
    <Box sx={{ width: 240, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" sx={{ padding: 2 }}>
        THE <i>Active</i> CHURCH
      </Typography>
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map(({ label, path, icon: Icon }) => (
          <ListItemButton
            key={label}
            component={Link}
            to={path}
            selected={location.pathname === path}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'black',
                color: 'white',
                '& .MuiListItemText-primary': {
                  color: 'white',
                },
              },
              '&.Mui-selected:hover': {
                backgroundColor: '#222',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>

<Box sx={{ padding: 2, display: 'flex', justifyContent: 'center' }}>
  <IconButton
    onClick={handleToggleMode}
    sx={{
      color: mode === 'dark' ? '#fff' : '#000',
      backgroundColor: mode === 'dark' ? '#1f1f1f' : '#e0e0e0',
      '&:hover': {
        backgroundColor: mode === 'dark' ? '#2c2c2c' : '#c0c0c0',
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
          onClick={() => setMobileOpen(true)}
          sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1300 }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
