import React, { useContext, useState } from 'react';
import {
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext.jsx';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';

export default function TopbarProfile() {
  const navigate = useNavigate();
  const { user, setUser, profilePic } = useContext(UserContext); // pull user from context
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      if (user?._id) {
        // call backend to invalidate refresh tokens
        await axios.post('http://localhost:8000/logout', { user_id: user._id });
      }

      // Clear user context & storage
      setUser(null);
      localStorage.removeItem('user');

      // Redirect
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      handleMenuClose();
    }
  };

  if (location.pathname === '/signup' || location.pathname === '/login') {
    return null;
  }

  return (
    <>
      <Tooltip title="Go to Profile">
        <IconButton
          onClick={handleProfileClick}
          sx={{
            position: 'absolute',
            top: 16,
            right: 72, // push avatar left so dots can be on the edge
            zIndex: 1200,
            p: 0,
          }}
        >
          <Avatar
            alt="Profile"
            src={profilePic}
            sx={{
              width: 40,
              height: 40,
              border: '2px solid white',
            }}
          />
        </IconButton>
      </Tooltip>

      <IconButton
        onClick={handleMenuOpen}
        sx={{
          position: 'absolute',
          top: 16,
          right: 24,
          zIndex: 1200,
        }}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
