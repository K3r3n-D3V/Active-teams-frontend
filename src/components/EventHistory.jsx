import React, { useState, useEffect } from "react";
import { 
  Box, 
  Paper, 
  IconButton, 
  useTheme, 
  Typography, 
  Alert, 
  Button,
  Card,
  CardContent,
  Stack,
  Grid
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import MergeIcon from "@mui/icons-material/Merge";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}`;

// Helper function to format date - moved to top
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown Date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

function EventHistory({ 
  onViewDetails,
  onViewNewPeople,
  onViewConverts,
  events = [] // Accept events as prop from parent
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);

  // Use provided events or fetch locally if not provided
  const displayEvents = events.length > 0 ? events : localEvents;

  // Fetch events data if not provided via props
// In EventHistory component, update the fetchEvents function
const fetchEvents = async () => {
  if (events.length > 0) return; // Skip if events provided via props

  try {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('token');
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
    
    // Filter for closed global events only
    const closedGlobalEvents = (data.events || []).filter(event => {
      const isClosed = event.status?.toLowerCase() === 'closed';
      const isGlobal = event.isGlobal === true;
      const isNotCell = event.eventType?.toLowerCase() !== 'cell';
      
      return isClosed && isGlobal && isNotCell;
    });

    // Transform the data
    const transformedEvents = closedGlobalEvents.map(event => ({
      id: event._id || event.id,
      eventName: event.eventName || event["Event Name"] || "Unnamed Event",
      date: event.date || event.createdAt || event["Date Of Event"],
      total_attendance: event.total_attendance || event.attendees?.length || 0,
      // ... rest of your transformation
    }));
    
    setLocalEvents(transformedEvents);
  } catch (err) {
    console.error('Error fetching events:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, [events]);

  // Calculate stats for each event
  const getEventStats = (event) => {
    // Try to get from event data first, then calculate from available data
    const attendance = event.total_attendance || event.checkIns?.length || 0;
    const newPeople = event.newPeople?.length || event.summary?.new_people || 0;
    const consolidated = event.consolidations?.length || event.summary?.total_decisions || 0;
    const firstTime = event.summary?.first_time_decisions || 0;
    const recommitments = event.summary?.recommitments || 0;

    return {
      attendance,
      newPeople,
      consolidated,
      firstTime,
      recommitments
    };
  };

  // Prepare rows for DataGrid
  const rows = displayEvents.map((event) => {
    const stats = getEventStats(event);
    return {
      id: event.id,
      date: formatDate(event.date),
      eventName: event.eventName,
      attendanceCount: stats.attendance,
      newPeopleCount: stats.newPeople,
      consolidatedCount: stats.consolidated,
      firstTimeDecisions: stats.firstTime,
      recommitments: stats.recommitments,
      eventId: event.id,
      rawEvent: event // Include raw event data for callbacks
    };
  });

  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1.5, 
      minWidth: 150,
      valueGetter: (params) => params.row.date
    },
    { 
      field: 'eventName', 
      headerName: 'Event Name', 
      flex: 2, 
      minWidth: 200 
    },
    { 
      field: 'attendanceCount', 
      headerName: 'Attendance', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 0.5,
          backgroundColor: params.value > 0 ? theme.palette.primary.light + '20' : 'transparent',
          borderRadius: 1,
          px: 1,
          py: 0.5
        }}>
          <GroupIcon fontSize="small" color={params.value > 0 ? "primary" : "disabled"} />
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'newPeopleCount', 
      headerName: 'New People', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 0.5,
          backgroundColor: params.value > 0 ? theme.palette.success.light + '20' : 'transparent',
          borderRadius: 1,
          px: 1,
          py: 0.5
        }}>
          <PersonAddAltIcon fontSize="small" color={params.value > 0 ? "success" : "disabled"} />
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'consolidatedCount', 
      headerName: 'Decisions', 
      flex: 1, 
      minWidth: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 0.5,
          backgroundColor: params.value > 0 ? theme.palette.secondary.light + '20' : 'transparent',
          borderRadius: 1,
          px: 1,
          py: 0.5
        }}>
          <MergeIcon fontSize="small" color={params.value > 0 ? "secondary" : "disabled"} />
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'breakdown',
      headerName: 'Breakdown',
      flex: 1.5,
      minWidth: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" display="block" color="primary">
            First: {params.row.firstTimeDecisions}
          </Typography>
          <Typography variant="caption" display="block" color="secondary">
            Recommit: {params.row.recommitments}
          </Typography>
        </Box>
      )
    },
    {
      field: 'viewDetails',
      headerName: 'Details',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          color="primary"
          onClick={() => onViewDetails && onViewDetails(params.row.eventId)}
          title="View Event Details"
          sx={{ 
            boxShadow: 1,
            '&:hover': { 
              boxShadow: 3,
              backgroundColor: theme.palette.primary.light + '20'
            }
          }}
        >
          <GroupIcon />
        </IconButton>
      )
    },
    {
      field: 'viewNewPeople',
      headerName: 'New People',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          color="success"
          onClick={() => onViewNewPeople && onViewNewPeople(params.row.eventId)}
          disabled={params.row.newPeopleCount === 0}
          title="View New People"
          sx={{ 
            boxShadow: 1,
            '&:hover': { 
              boxShadow: 3,
              backgroundColor: theme.palette.success.light + '20'
            },
            '&.Mui-disabled': {
              boxShadow: 0
            }
          }}
        >
          <PersonAddAltIcon />
        </IconButton>
      )
    },
    {
      field: 'viewConverts',
      headerName: 'Decisions',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <IconButton 
          size="small" 
          color="secondary"
          onClick={() => onViewConverts && onViewConverts(params.row.eventId)}
          disabled={params.row.consolidatedCount === 0}
          title="View Decisions"
          sx={{ 
            boxShadow: 1,
            '&:hover': { 
              boxShadow: 3,
              backgroundColor: theme.palette.secondary.light + '20'
            },
            '&.Mui-disabled': {
              boxShadow: 0
            }
          }}
        >
          <MergeIcon />
        </IconButton>
      )
    },
  ];

  // Stats Cards for Event History
  const StatsCards = () => {
    const totalStats = rows.reduce((acc, row) => ({
      attendance: acc.attendance + row.attendanceCount,
      newPeople: acc.newPeople + row.newPeopleCount,
      consolidated: acc.consolidated + row.consolidatedCount,
      events: acc.events + 1
    }), { attendance: 0, newPeople: 0, consolidated: 0, events: 0 });

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: 2, 
              boxShadow: 3,
              backgroundColor: theme.palette.background.paper,
              '&:hover': { boxShadow: 6 }
            }}
          >
            <CardContent>
              <GroupIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="primary">
                {totalStats.attendance}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Attendance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: 2, 
              boxShadow: 3,
              backgroundColor: theme.palette.background.paper,
              '&:hover': { boxShadow: 6 }
            }}
          >
            <CardContent>
              <PersonAddAltIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {totalStats.newPeople}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total New People
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: 2, 
              boxShadow: 3,
              backgroundColor: theme.palette.background.paper,
              '&:hover': { boxShadow: 6 }
            }}
          >
            <CardContent>
              <MergeIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="secondary.main">
                {totalStats.consolidated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Decisions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: 2, 
              boxShadow: 3,
              backgroundColor: theme.palette.background.paper,
              '&:hover': { boxShadow: 6 }
            }}
          >
            <CardContent>
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {totalStats.events}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Loading events...</Typography>
      </Box>
    );
  }

  if (error) {
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
          <Typography variant="body1" fontWeight="bold">
            Error loading events
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            API URL: {API_URL}
          </Typography>
        </Alert>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={fetchEvents}
          startIcon={<RefreshIcon />}
          sx={{ ml: 2, boxShadow: 1 }}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Event History
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Total Events: {displayEvents.length}
          </Typography>
          {events.length === 0 && (
            <Button 
              size="small" 
              startIcon={<RefreshIcon />} 
              onClick={fetchEvents}
              disabled={loading}
              sx={{ boxShadow: 1 }}
            >
              Refresh
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <StatsCards />

      {displayEvents.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
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
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            height: 600, 
            boxShadow: 3,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
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
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
}

export default EventHistory;