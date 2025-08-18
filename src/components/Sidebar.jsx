import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
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
import { useState } from 'react';

const menuItems = [
  { label: 'Home', path: '/' },
  { label: 'Profile', path: '/profile' },
  { label: 'People', path: '/people' },
  { label: 'Events', path: '/events' },
  { label: 'Stats', path: '/stats' },
  // { label: 'Financial Reports', path: '/financial-reports' },
  { label: 'Service Check-in', path: '/service-check-in' },
  { label: 'Give Today', path: '/give-today' },
  { label: 'Daily Tasks', path: '/daily-tasks' },
];

export default function Sidebar({ mode, setMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');
  const location = useLocation();

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const drawerContent = (
    <Box sx={{ width: 240, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" sx={{ padding: 2 }}>
        THE <i>Active</i> CHURCH
      </Typography>
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map(({ label, path }) => (
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
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleToggleMode}>
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Switch checked={mode === 'dark'} onChange={handleToggleMode} />
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
