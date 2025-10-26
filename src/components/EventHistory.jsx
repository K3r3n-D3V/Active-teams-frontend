import React, { useState, useEffect } from "react";
import { 
  Box, 
  Paper, 
  IconButton, 
  useTheme, 
  Typography, 
  Alert, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Card,
  CardContent,
  TextField,
  TablePagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useMediaQuery
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import MergeIcon from "@mui/icons-material/Merge";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";

const API_URL = import.meta.env.VITE_BACKEND_URL || '';

// Dummy data for testing
const DUMMY_EVENTS = [
  {
    id: "dummy1",
    _id: "dummy1",
    eventName: "Sunday Service",
    date: "2025-01-26T10:00:00Z",
    status: "closed",
    isGlobal: true,
    eventType: "service",
    total_attendance: 155,
    attendees: [
      { id: "1", name: "John Doe", phone: "555-0101" },
      { id: "2", name: "Jane Smith", phone: "555-0102" },
      { id: "3", name: "Mike Johnson", phone: "555-0103" }
    ],
    newPeople: [
      { id: "1", name: "John Doe", phone: "555-0101", email: "john@example.com" },
      { id: "2", name: "Jane Smith", phone: "555-0102", email: "jane@example.com" },
      { id: "3", name: "Mike Johnson", phone: "555-0103", email: "mike@example.com" }
    ],
    consolidations: [
      { id: "1", name: "Sarah Williams", type: "first_time", phone: "555-0201" },
      { id: "2", name: "Tom Brown", type: "recommitment", phone: "555-0202" }
    ],
    summary: {
      new_people: 3,
      total_decisions: 2,
      first_time_decisions: 1,
      recommitments: 1
    }
  },
  {
    id: "dummy2",
    _id: "dummy2",
    eventName: "Active Service - Friday 18:30",
    date: "2025-01-31T18:30:00Z",
    status: "closed",
    isGlobal: true,
    eventType: "service",
    total_attendance: 153,
    attendees: [
      { id: "1", name: "Alice Cooper", phone: "555-0301" },
      { id: "2", name: "Bob Dylan", phone: "555-0302" }
    ],
    newPeople: [
      { id: "1", name: "Alice Cooper", phone: "555-0301", email: "alice@example.com" },
      { id: "2", name: "Bob Dylan", phone: "555-0302", email: "bob@example.com" },
      { id: "3", name: "Charlie Parker", phone: "555-0303", email: "charlie@example.com" },
      { id: "4", name: "Diana Ross", phone: "555-0304", email: "diana@example.com" },
      { id: "5", name: "Elvis Presley", phone: "555-0305", email: "elvis@example.com" }
    ],
    consolidations: [
      { id: "1", name: "Frank Sinatra", type: "first_time", phone: "555-0401" },
      { id: "2", name: "Grace Jones", type: "first_time", phone: "555-0402" },
      { id: "3", name: "Harry Styles", type: "recommitment", phone: "555-0403" }
    ],
    summary: {
      new_people: 5,
      total_decisions: 3,
      first_time_decisions: 2,
      recommitments: 1
    }
  }
];

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown Date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

function EventHistory({ 
  onViewDetails,
  onViewNewPeople,
  onViewConverts,
  events = []
}) {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);
  const [useDummyData, setUseDummyData] = useState(false);
  
  // Dialog states
  const [detailsDialog, setDetailsDialog] = useState({ open: false, event: null });
  const [newPeopleDialog, setNewPeopleDialog] = useState({ open: false, event: null });
  const [convertsDialog, setConvertsDialog] = useState({ open: false, event: null });

  // Pagination for mobile cards
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [search, setSearch] = useState("");

  const displayEvents = events.length > 0 ? events : (useDummyData ? DUMMY_EVENTS : localEvents);

  const fetchEvents = async () => {
    if (events.length > 0) return;

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      if (!API_URL) {
        console.log('No API URL configured, using dummy data');
        setUseDummyData(true);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const closedGlobalEvents = (data.events || []).filter(event => {
        const isClosed = event.status?.toLowerCase() === 'closed';
        const isGlobal = event.isGlobal === true;
        const isNotCell = event.eventType?.toLowerCase() !== 'cell';
        
        return isClosed && isGlobal && isNotCell;
      });

      const transformedEvents = closedGlobalEvents.map(event => ({
        id: event._id || event.id,
        eventName: event.eventName || event["Event Name"] || "Unnamed Event",
        date: event.date || event.createdAt || event["Date Of Event"],
        total_attendance: event.total_attendance || event.attendees?.length || 0,
        attendees: event.attendees || [],
        newPeople: event.newPeople || [],
        consolidations: event.consolidations || [],
        summary: event.summary || {}
      }));
      
      setLocalEvents(transformedEvents);
      
      if (transformedEvents.length === 0) {
        setUseDummyData(true);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setUseDummyData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, []);

  const getEventStats = (event) => {
    const attendance = event.total_attendance || event.attendees?.length || 0;
    const newPeople = event.newPeople?.length || event.summary?.new_people || 0;
    const consolidated = event.consolidations?.length || event.summary?.total_decisions || 0;

    return {
      attendance,
      newPeople,
      consolidated
    };
  };

  const handleViewDetails = (eventId) => {
    const event = displayEvents.find(e => e.id === eventId);
    if (onViewDetails) {
      onViewDetails(eventId);
    } else {
      setDetailsDialog({ open: true, event });
    }
  };

  const handleViewNewPeople = (eventId) => {
    const event = displayEvents.find(e => e.id === eventId);
    if (onViewNewPeople) {
      onViewNewPeople(eventId);
    } else {
      setNewPeopleDialog({ open: true, event });
    }
  };

  const handleViewConverts = (eventId) => {
    const event = displayEvents.find(e => e.id === eventId);
    if (onViewConverts) {
      onViewConverts(eventId);
    } else {
      setConvertsDialog({ open: true, event });
    }
  };

  const rows = displayEvents.map((event) => {
    const stats = getEventStats(event);
    return {
      id: event.id,
      date: `${formatDate(event.date)} - ${event.eventName}`,
      attendanceCount: stats.attendance,
      newPeopleCount: stats.newPeople,
      consolidatedCount: stats.consolidated,
      eventId: event.id,
      rawEvent: event
    };
  });

  // Filter rows based on search
  const filteredRows = rows.filter(row => {
    const searchLower = search.toLowerCase();
    return row.date.toLowerCase().includes(searchLower);
  });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 2, 
      minWidth: 200
    },
    { 
      field: 'attendanceCount', 
      headerName: 'Attendance Count', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      type: 'number'
    },
    { 
      field: 'newPeopleCount', 
      headerName: 'New People Count', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      type: 'number'
    },
    { 
      field: 'consolidatedCount', 
      headerName: 'Coverts Count', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      type: 'number'
    },
    {
      field: 'viewDetails',
      headerName: 'View Details',
      width: 130,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="medium" 
          color="primary"
          onClick={() => handleViewDetails(params.row.eventId)}
          title="View Attendance Details"
          sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': { 
              backgroundColor: theme.palette.primary.dark
            }
          }}
        >
          <GroupIcon />
        </IconButton>
      )
    },
    {
      field: 'viewNewPeople',
      headerName: 'View New People',
      width: 150,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="medium" 
          color="primary"
          onClick={() => handleViewNewPeople(params.row.eventId)}
          disabled={params.row.newPeopleCount === 0}
          title="View New People"
          sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': { 
              backgroundColor: theme.palette.primary.dark
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          <PersonAddAltIcon />
        </IconButton>
      )
    },
    {
      field: 'viewConverts',
      headerName: 'View Converts/...',
      width: 150,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="medium" 
          color="primary"
          onClick={() => handleViewConverts(params.row.eventId)}
          disabled={params.row.consolidatedCount === 0}
          title="View Decisions"
          sx={{ 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            '&:hover': { 
              backgroundColor: theme.palette.primary.dark
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          <MergeIcon />
        </IconButton>
      )
    },
  ];

  // Event Card Component for Mobile
  const EventCard = ({ event, index }) => {
    const stats = getEventStats(event.rawEvent);
    
    return (
      <Card
        variant="outlined"
        sx={{
          mb: 1,
          boxShadow: 2,
          "&:last-child": { mb: 0 },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {index}. {event.rawEvent.eventName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(event.rawEvent.date)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" gap={1}>
            <Chip 
              icon={<GroupIcon />} 
              label={`${stats.attendance} Present`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
            <Chip 
              icon={<PersonAddAltIcon />} 
              label={`${stats.newPeople} New`} 
              size="small" 
              color="success"
              variant="outlined"
            />
            <Chip 
              icon={<MergeIcon />} 
              label={`${stats.consolidated} Decisions`} 
              size="small" 
              color="secondary"
              variant="outlined"
            />
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewDetails(event.eventId)}
              sx={{ 
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': { 
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              <GroupIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewNewPeople(event.eventId)}
              disabled={stats.newPeople === 0}
              sx={{ 
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': { 
                  backgroundColor: theme.palette.primary.dark
                },
                '&.Mui-disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled
                }
              }}
            >
              <PersonAddAltIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleViewConverts(event.eventId)}
              disabled={stats.consolidated === 0}
              sx={{ 
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': { 
                  backgroundColor: theme.palette.primary.dark
                },
                '&.Mui-disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled
                }
              }}
            >
              <MergeIcon fontSize="small" />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading events...</Typography>
      </Box>
    );
  }

  if (error && !useDummyData) {
    return (
      <Box>
        <Alert 
          severity="error" 
          sx={{ m: 2, boxShadow: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchEvents} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          Error loading events: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {useDummyData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing dummy data for demonstration. Real data will load when API is available.
        </Alert>
      )}

      {/* Search bar for mobile */}
      {isMdDown && (
        <TextField
          size="small"
          placeholder="Search events..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          fullWidth
          sx={{ mb: 2, boxShadow: 1 }}
        />
      )}
      
      {displayEvents.length === 0 ? (
        <Paper 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            textAlign: 'center', 
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Closed Events Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Closed events will appear here once they are saved and closed from the service check-in.
          </Typography>
          {events.length === 0 && (
            <Button 
              variant="outlined" 
              onClick={fetchEvents}
              startIcon={<RefreshIcon />}
              sx={{ mt: 2, boxShadow: 1 }}
            >
              Check Again
            </Button>
          )}
        </Paper>
      ) : isMdDown ? (
        // Mobile/Tablet View - Cards
        <Box>
          <Box 
            sx={{ 
              maxHeight: 500, 
              overflowY: "auto",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 1,
              boxShadow: 2
            }}
          >
            {paginatedRows.map((row, idx) => (
              <EventCard key={row.id} event={row} index={page * rowsPerPage + idx + 1} />
            ))}
          </Box>

          <TablePagination 
            component="div" 
            count={filteredRows.length} 
            page={page} 
            onPageChange={(e, newPage) => setPage(newPage)} 
            rowsPerPage={rowsPerPage} 
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} 
            rowsPerPageOptions={[25, 50, 100]} 
            sx={{ boxShadow: 2, borderRadius: 1, mt: 1 }}
          />
        </Box>
      ) : (
        // Desktop View - DataGrid
        <Paper 
          variant="outlined" 
          sx={{ 
            height: 600, 
            width: '100%',
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 100 } },
              sorting: {
                sortModel: [{ field: 'date', sort: 'desc' }],
              },
            }}
            sx={{
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-toolbarContainer': {
                p: 1,
                flexWrap: 'wrap'
              },
            }}
          />
        </Paper>
      )}

      {/* Attendance Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Attendance Details</Typography>
            <Typography variant="caption" color="text.secondary">
              {detailsDialog.event?.eventName} - {formatDate(detailsDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setDetailsDialog({ open: false, event: null })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="primary">
                {detailsDialog.event?.total_attendance || detailsDialog.event?.attendees?.length || 0}
              </Typography>
              <Chip 
                icon={<GroupIcon />} 
                label="Total Attendance" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">Attendees List:</Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(detailsDialog.event?.attendees || []).map((attendee, index) => (
                <React.Fragment key={attendee.id || index}>
                  <ListItem>
                    <ListItemText 
                      primary={attendee.name || `Person ${index + 1}`}
                      secondary={attendee.phone || attendee.email || 'No contact info'}
                    />
                  </ListItem>
                  {index < (detailsDialog.event?.attendees?.length - 1) && <Divider />}
                </React.Fragment>
              ))}
              {(!detailsDialog.event?.attendees || detailsDialog.event.attendees.length === 0) && (
                <ListItem>
                  <ListItemText primary="No attendee details available" />
                </ListItem>
              )}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, event: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* New People Dialog */}
      <Dialog 
        open={newPeopleDialog.open} 
        onClose={() => setNewPeopleDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">New People</Typography>
            <Typography variant="caption" color="text.secondary">
              {newPeopleDialog.event?.eventName} - {formatDate(newPeopleDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setNewPeopleDialog({ open: false, event: null })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="success.main">
                {newPeopleDialog.event?.newPeople?.length || 0}
              </Typography>
              <Chip 
                icon={<PersonAddAltIcon />} 
                label="New People" 
                color="success" 
                variant="outlined"
              />
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">New People List:</Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(newPeopleDialog.event?.newPeople || []).map((person, index) => (
                <React.Fragment key={person.id || index}>
                  <ListItem>
                    <ListItemText 
                      primary={person.name || `Person ${index + 1}`}
                      secondary={
                        <Stack spacing={0.5}>
                          {person.phone && <Typography variant="caption">Phone: {person.phone}</Typography>}
                          {person.email && <Typography variant="caption">Email: {person.email}</Typography>}
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < (newPeopleDialog.event?.newPeople?.length - 1) && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPeopleDialog({ open: false, event: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Converts/Decisions Dialog */}
      <Dialog 
        open={convertsDialog.open} 
        onClose={() => setConvertsDialog({ open: false, event: null })}
        maxWidth="sm"
        fullWidth
        fullScreen={isSmDown}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Decisions Made</Typography>
            <Typography variant="caption" color="text.secondary">
              {convertsDialog.event?.eventName} - {formatDate(convertsDialog.event?.date)}
            </Typography>
          </Box>
          <IconButton onClick={() => setConvertsDialog({ open: false, event: null })}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4" color="secondary.main">
                {convertsDialog.event?.consolidations?.length || 0}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip 
                  label={`First Time: ${convertsDialog.event?.summary?.first_time_decisions || 0}`}
                  color="primary" 
                  size="small"
                />
                <Chip 
                  label={`Recommitments: ${convertsDialog.event?.summary?.recommitments || 0}`}
                  color="secondary" 
                  size="small"
                />
              </Stack>
            </Box>
            <Divider />
            <Typography variant="subtitle1" fontWeight="bold">Decisions List:</Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {(convertsDialog.event?.consolidations || []).map((person, index) => (
                <React.Fragment key={person.id || index}>
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography>{person.name || `Person ${index + 1}`}</Typography>
                          <Chip 
                            label={person.type === 'first_time' ? 'First Time' : 'Recommitment'}
                            color={person.type === 'first_time' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={person.phone || person.email || 'No contact info'}
                    />
                  </ListItem>
                  {index < (convertsDialog.event?.consolidations?.length - 1) && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertsDialog({ open: false, event: null })}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EventHistory;