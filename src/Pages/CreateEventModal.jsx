import { Dialog, DialogContent, DialogTitle, IconButton, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreateEvents from './CreateEvents';

const CreateEventModal = ({ open, onClose, user }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      scroll="body"
      PaperProps={{
        sx: {
          bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          backgroundImage: 'none', // Remove default MUI gradient
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
          color: isDarkMode ? '#ffffff' : '#000000',
          borderBottom: isDarkMode ? '1px solid #444' : '1px solid #e0e0e0',
          fontWeight: 600,
          fontSize: '1.25rem',
        }}
      >
        Create Event
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ 
            position: 'absolute', 
            right: 8, 
            top: 8,
            color: isDarkMode ? '#ffffff' : '#000000',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          bgcolor: isDarkMode ? '#2d2d2d' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          pt: 3,
        }}
      >
        <CreateEvents user={user} isModal={true} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;