// People.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from 'axios';
import {
  Box, Paper, Typography, Badge, useTheme, useMediaQuery, Card, CardContent,
  IconButton, Chip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert, AppBar, Toolbar
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon
} from '@mui/icons-material';
import AddPersonDialog from '../components/AddPersonDialog';

// ================== Stages ==================
const stages = [
  { id: 'Win', title: 'Win' },
  { id: 'Consolidate', title: 'Consolidate' },
  { id: 'Disciple', title: 'Disciple' },
  { id: 'Send', title: 'Send' }
];

// ================== PersonCard ==================
const PersonCard = React.memo(({ person, onEdit, onDelete, isDragging = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = e => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setAnchorEl(null);
  const handleEdit = () => { onEdit(person); handleMenuClose(); };
  const handleDelete = () => { onDelete(person._id); handleMenuClose(); };

  const getInitials = useCallback((name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || "?", []);
  const getAvatarColor = useCallback((name) => ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'][(name?.length || 0) % 6], []);
  const formatDate = useCallback((date) => date ? new Date(date).toLocaleDateString() : "-", []);
  const getStageColor = useCallback((stage) => {
    switch (stage) {
      case 'Win': return 'success.main';
      case 'Consolidate': return 'info.main';
      case 'Disciple': return 'warning.main';
      case 'Send': return 'error.main';
      default: return 'primary.main';
    }
  }, []);

  return (
    <Card sx={{
      cursor: 'grab',
      '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' },
      transition: 'all 0.2s ease-in-out',
      boxShadow: isDragging ? 6 : 2,
      backgroundColor: isDragging ? 'action.selected' : 'background.paper',
      mb: 1
    }}>
      <CardContent sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, backgroundColor: getAvatarColor(person.name), mr: 1 }}>
            {getInitials(person.name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>{person.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {person.gender} • {formatDate(person.dob)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon fontSize="small" /></IconButton>
        </Box>

        <Box sx={{ mb: 1 }}>
          {person.email && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><EmailIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.email}</Typography></Box>}
          {person.phone && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><PhoneIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.phone}</Typography></Box>}
          {person.location && <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}><LocationIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.location}</Typography></Box>}
          {person.cellLeader && <Box sx={{ display: 'flex', alignItems: 'center' }}><GroupIcon fontSize="small" sx={{ mr: 0.5 }} /><Typography variant="caption">{person.cellLeader}</Typography></Box>}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={person.stage}
            size="small"
            sx={{ height: 20, fontSize: 10, backgroundColor: getStageColor(person.stage), color: '#fff' }}
          />
          <Typography variant="caption">Updated: {formatDate(person.lastUpdated)}</Typography>
        </Box>

        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
});

// ================== DragDropBoard ==================
const DragDropBoard = ({ people, onDragEnd, onEditPerson, onDeletePerson, loading }) => {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.between('sm', 'lg'));
  const getPeopleByStage = useCallback((stage) => people.filter(p => p.stage === stage), [people]);

  if (loading) return <Typography sx={{ p: 2, textAlign: 'center' }}>Loading people...</Typography>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', flexWrap: isSmall || isMedium ? 'wrap' : 'nowrap', gap: 3, justifyContent: 'center', flexDirection: isSmall ? 'column' : 'row', py: 1 }}>
        {stages.map(stage => {
          const stagePeople = getPeopleByStage(stage.id);
          const headerBg = theme.palette.mode === 'dark' ? '#fff' : '#000';
          const headerText = theme.palette.mode === 'dark' ? '#000' : '#fff';
          const stageWidth = isSmall ? '100%' : isMedium ? '45%' : '250px';

          return (
            <Paper key={stage.id} sx={{
              flex: `0 0 ${stageWidth}`,
              minWidth: 220,
              borderRadius: 2,
              overflow: 'hidden',
              mb: isSmall || isMedium ? 2 : 0,
              backgroundColor: theme.palette.mode === 'dark' ? '#424242' : '#fff'
            }}>
              <Box sx={{ p: 1.5, backgroundColor: headerBg, color: headerText, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">{stage.title}</Typography>
                <Badge badgeContent={stagePeople.length} sx={{ '& .MuiBadge-badge': { backgroundColor: headerText, color: headerBg, fontSize: 10 } }} />
              </Box>
              <Droppable droppableId={stage.id}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      p: 1,
                      minHeight: 140,
                      maxHeight: '400px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      backgroundColor: theme.palette.mode === 'dark' ? '#616161' : '#f9f9f9',
                    }}
                  >
                    {stagePeople.length > 0 ? stagePeople.map((person, index) => (
                      <Draggable key={person._id} draggableId={person._id} index={index}>
                        {(provided, snapshot) => (
                          <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <PersonCard person={person} onEdit={onEditPerson} onDelete={onDeletePerson} isDragging={snapshot.isDragging} />
                          </Box>
                        )}
                      </Draggable>
                    )) : (
                      <Box sx={{ textAlign: 'center', border: '1px dashed #aaa', borderRadius: 1, p: 2, mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>Drop people here</Box>
                    )}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          );
        })}
      </Box>
    </DragDropContext>
  );
};


// ================== PeopleSection ==================
export const PeopleSection = ({ currentUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [people, setPeople] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch people from backend
  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/people');
        const data = res.data.map(p => ({ stage: p.stage || 'Win', ...p }));
        setPeople(data);
      } catch (err) {
        console.error('Error fetching people:', err);
        setSnackbar({ open: true, message: 'Failed to load people', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchPeople();
  }, []);

  // Hard-coded admin logic for leaders
  useEffect(() => {
    let uniqueLeaders = [...new Set(people.map(person => person.cellLeader))];
    const superAdmins = ['Gavin Ensline', 'Vicky Ensline'];
    if (!superAdmins.includes(currentUser)) {
      uniqueLeaders = uniqueLeaders.filter(l => l === currentUser);
    }
    setLeaders(uniqueLeaders);
  }, [people, currentUser]);

  const getLeaderStats = (leader) => {
    const leaderPeople = people.filter(person => person.cellLeader === leader);
    const stats = stages.map(stage => ({
      stage,
      count: leaderPeople.filter(p => p.stage === stage.id).length
    }));
    return { total: leaderPeople.length, stages: stats };
  };

  const handleSavePerson = (data) => {
    setPeople(prev => {
      const idx = prev.findIndex(p => p._id === data._id);
      if (idx >= 0) prev[idx] = data;
      else prev.push({ ...data, _id: `new-${Date.now()}`, gender: data.gender || 'Male', stage: data.stage || 'Win' });
      return [...prev];
    });
    setIsModalOpen(false);
    setSnackbar({ open: true, message: 'Person saved successfully', severity: 'success' });
  };

  const handleDeletePerson = (id) => {
    setPeople(prev => prev.filter(p => p._id !== id));
    setSnackbar({ open: true, message: 'Person deleted', severity: 'success' });
  };

  const handleDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    setPeople(prev => {
      const movingPerson = prev.find(p => p._id === draggableId);
      const others = prev.filter(p => p._id !== draggableId);
      movingPerson.stage = destination.droppableId;
      others.splice(destination.index, 0, movingPerson);
      return [...others];
    });
  };

  const filteredPeople = useMemo(() => people.filter(p =>
    [p.name, p.cellLeader, p.location].some(f => f?.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [people, searchTerm]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', mt: 8, px: 2, pb: 4 }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ py: 0.5 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>People</Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => { setEditingPerson(null); setIsModalOpen(true); }}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#fff' : '#000',
              color: theme.palette.mode === 'dark' ? '#000' : '#fff',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#222'
              },
              textTransform: 'none'
            }}
          >
            Add
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth size="small" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Box sx={{ flex: 1, height: 'auto', border: '1px solid #e0e0e0', borderRadius: 2, mx: 0, py: 2 }}>
        <DragDropBoard
          people={filteredPeople}
          onDragEnd={handleDragEnd}
          onEditPerson={(p) => { setEditingPerson(p); setIsModalOpen(true); }}
          onDeletePerson={handleDeletePerson}
          loading={loading}
        />
      </Box>

      <AddPersonDialog
        open={isModalOpen}
        formData={editingPerson || { name: '', surname: '', dob: '', email: '', phone: '', homeAddress: '', invitedBy: '', gender: '' }}
        setFormData={setEditingPerson}
        onClose={() => setIsModalOpen(false)}
        onSave={() => handleSavePerson(editingPerson)}
      />

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
