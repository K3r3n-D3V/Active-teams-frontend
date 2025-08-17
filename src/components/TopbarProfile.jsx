import { Avatar, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function TopbarProfile() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

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
          src="/path-to-your-avatar.png" // Replace with actual image path or leave blank
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
