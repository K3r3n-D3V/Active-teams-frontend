import React, { useContext } from 'react';
import { Avatar, IconButton, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext.jsx'; 
export default function TopbarProfile() {
  const navigate = useNavigate();
  const { profilePic } = useContext(UserContext);
  const location = useLocation();

  const handleProfileClick = () => {
    navigate('/profile');
  };
   if (location.pathname === "/signup") {
    return null;
  }
  if (location.pathname === "/login") {
    return null;
  }


  return (
    <Tooltip title="Go to Profile">
      <IconButton
        onClick={handleProfileClick}
        sx={{
          position: 'absolute',
          top: 16,
          right: 24,
          zIndex: 1200,
          p: 0,
        }}
      >
        <Avatar
          alt="Profile"
          src={profilePic}  // Use dynamic profilePic from context
          sx={{
            width: 40,
            height: 40,
            border: '2px solid white',
          }}
        />
      </IconButton>
    </Tooltip>
  );
}
