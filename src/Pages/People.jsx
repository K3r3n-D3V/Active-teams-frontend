// People.jsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Box, Paper, Typography, Badge, useTheme, useMediaQuery, Card, CardContent,
  IconButton, Chip, Avatar, Menu, MenuItem, ListItemIcon, ListItemText,
  TextField, InputAdornment, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, Alert, AppBar, Toolbar, Fab,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, MoreVert as MoreVertIcon,
  Edit as EditIcon, Delete as DeleteIcon, Email as EmailIcon,
  Phone as PhoneIcon, LocationOn as LocationIcon, Group as GroupIcon,
} from '@mui/icons-material';

// ✅ Real API service (replace base URL if needed)
const apiService = {
  getPeople: async () => {
    const res = await fetch('/api/people');
    if (!res.ok) throw new Error("Failed to fetch people");
    return res.json();
  },
  savePerson: async (person) => {
    const res = await fetch(`/api/people${person._id ? `/${person._id}` : ''}`, {
      method: person._id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person),
    });
    if (!res.ok) throw new Error("Failed to save person");
    return res.json();
  },
  deletePerson: async (id) => {
    const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Failed to delete person");
    return true;
  },
};

// ================== PersonCard ==================
const PersonCard = ({ person, onEdit, onDelete, isDragging = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = () => setAnchorEl(null);

  const handleEdit = () => { onEdit(person); handleMenuClose(); };
  const handleDelete = () => { onDelete(person._id); handleMenuClose(); };

  const getInitials = (name) => name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || "?";
  const getAvatarColor = (name) => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'];
    return colors[(name?.length || 0) % colors.length];
  };
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "-";

  return (
    <Card sx={{
      cursor: 'grab',
      '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
      transition: 'all 0.2s ease-in-out',
      boxShadow: isDragging ? 6 : 2,
      backgroundColor: isDragging ? 'action.selected' : 'background.paper'
    }}>
      <CardContent sx={{ p: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ backgroundColor: getAvatarColor(person.name), mr: 2 }}>
            {getInitials(person.name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" noWrap>{person.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {person.gender} • {formatDate(person.dob)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}><MoreVertIcon /></IconButton>
        </Box>

        {/* Contact Info */}
        <Box sx={{ mb: 2 }}>
          {person.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmailIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">{person.email}</Typography>
            </Box>
          )}
          {person.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">{person.phone}</Typography>
            </Box>
          )}
          {person.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">{person.location}</Typography>
            </Box>
          )}
          {person.cellLeader && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <GroupIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">{person.cellLeader}</Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Chip label={person.stage} size="small" color="primary" variant="outlined" />
          <Typography variant="caption">Updated: {formatDate(person.lastUpdated)}</Typography>
        </Box>

        {/* Menu */}
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
};

// ================== Stages ==================
const stages = [
  { id: 'Win', title: 'Win' },
  { id: 'Consolidate', title: 'Consolidate' },
  { id: 'Disciple', title: 'Disciple' },
  { id: 'Send', title: 'Send' },
];

// ================== DragDropBoard ==================
const DragDropBoard = ({ people, onDragEnd, onEditPerson, onDeletePerson, loading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const getPeopleByStage = (stage) => people.filter((p) => p.stage === stage);

  if (loading) return <Typography sx={{ p: 3, textAlign: 'center' }}>Loading people...</Typography>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
        {stages.map((stage) => {
          const stagePeople = getPeopleByStage(stage.id);
          const headerBg = theme.palette.mode === 'dark' ? '#fff' : '#000';
          const headerText = theme.palette.mode === 'dark' ? '#000' : '#fff';
          return (
            <Paper key={stage.id} sx={{ flex: 1, minWidth: 280, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, backgroundColor: headerBg, color: headerText, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">{stage.title}</Typography>
                <Badge badgeContent={stagePeople.length} sx={{ '& .MuiBadge-badge': { backgroundColor: headerText, color: headerBg } }} />
              </Box>
              <Droppable droppableId={stage.id}>
                {(provided) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1, minHeight: 200 }}>
                    {stagePeople.map((person, index) => (
                      <Draggable key={person._id} draggableId={person._id} index={index}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ mb: 1 }}
                          >
                            <PersonCard
                              person={person}
                              onEdit={onEditPerson}
                              onDelete={onDeletePerson}
                              isDragging={snapshot.isDragging}
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {stagePeople.length === 0 && <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>Drop people here</Typography>}
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

// ================== PersonModal ==================
const PersonModal = ({ open, onClose, onSave, person }) => {
  const [form, setForm] = useState(person || { name: '', email: '', phone: '', location: '', stage: 'Win' });
  useEffect(() => { setForm(person || { name: '', email: '', phone: '', location: '', stage: 'Win' }); }, [person]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = () => { onSave(form); };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{person ? 'Edit Person' : 'Add Person'}</DialogTitle>
      <DialogContent>
        <TextField margin="dense" name="name" label="Name" value={form.name} onChange={handleChange} fullWidth />
        <TextField margin="dense" name="email" label="Email" value={form.email} onChange={handleChange} fullWidth />
        <TextField margin="dense" name="phone" label="Phone" value={form.phone} onChange={handleChange} fullWidth />
        <TextField margin="dense" name="location" label="Location" value={form.location} onChange={handleChange} fullWidth />
        <TextField select margin="dense" name="stage" label="Stage" value={form.stage} onChange={handleChange} fullWidth>
          {stages.map((s) => <MenuItem key={s.id} value={s.id}>{s.title}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

// ================== PeopleSection (Main) ==================
export const PeopleSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { loadPeople(); }, []);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPeople();
      setPeople(response.people || []);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
    setLoading(false);
  };

  const handleSavePerson = async (data) => {
    try {
      const saved = await apiService.savePerson(data);
      if (data._id) {
        setPeople((prev) => prev.map((p) => (p._id === saved._id ? saved : p)));
      } else {
        setPeople((prev) => [...prev, saved]);
      }
      setIsModalOpen(false);
      setSnackbar({ open: true, message: 'Person saved successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleDeletePerson = async (id) => {
    try {
      await apiService.deletePerson(id);
      setPeople((prev) => prev.filter((p) => p._id !== id));
      setSnackbar({ open: true, message: 'Person deleted', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    setPeople((prev) =>
      prev.map((p) => (p._id === draggableId ? { ...p, stage: destination.droppableId } : p))
    );

    try {
      const movedPerson = people.find((p) => p._id === draggableId);
      if (movedPerson) {
        await apiService.savePerson({ ...movedPerson, stage: destination.droppableId });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update stage', severity: 'error' });
    }
  };

  const filteredPeople = people.filter((p) =>
    [p.name, p.cellLeader, p.location].some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>People Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingPerson(null); setIsModalOpen(true); }}>Add Person</Button>
        </Toolbar>
      </AppBar>

      {/* Search */}
      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
      </Box>

      {/* Board */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <DragDropBoard
          people={filteredPeople}
          onDragEnd={handleDragEnd}
          onEditPerson={(p) => { setEditingPerson(p); setIsModalOpen(true); }}
          onDeletePerson={handleDeletePerson}
          loading={loading}
        />
      </Box>

      {/* Floating Add */}
      {isMobile && (
        <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => { setEditingPerson(null); setIsModalOpen(true); }}>
          <AddIcon />
        </Fab>
      )}

      {/* Person Modal */}
      <PersonModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePerson} person={editingPerson} />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
