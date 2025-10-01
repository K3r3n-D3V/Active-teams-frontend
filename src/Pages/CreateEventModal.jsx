import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreateEvents from './CreateEvents';

const CreateEventModal = ({ open, onClose, user }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle>
        Create Event
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <CreateEvents user={user} isModal={true} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
