// import React from "react";
// import { Box, Paper, IconButton, useTheme } from "@mui/material";
// import { DataGrid, GridToolbar } from "@mui/x-data-grid";
// import GroupIcon from "@mui/icons-material/Group";
// import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
// import MergeIcon from "@mui/icons-material/Merge";

// function EventHistory({ 
//   events = [], 
//   eventCheckIns = {}, 
//   eventNewPeople = {}, 
//   eventConsolidations = {},
//   onViewDetails,
//   onViewNewPeople,
//   onViewConverts
// }) {
//   const theme = useTheme();

//   const rows = events.map((e) => ({
//     id: e.id,
//     date: e.eventName,
//     attendanceCount: (eventCheckIns[e.id] || []).length,
//     newPeopleCount: (eventNewPeople[e.id] || []).length,
//     consolidatedCount: eventConsolidations[e.id] || 0,
//     eventId: e.id,
//   }));

//   const columns = [
//     { 
//       field: 'date', 
//       headerName: 'Date', 
//       flex: 2, 
//       minWidth: 200 
//     },
//     { 
//       field: 'attendanceCount', 
//       headerName: 'Attendance Count', 
//       flex: 1, 
//       minWidth: 150,
//       align: 'center',
//       headerAlign: 'center',
//     },
//     { 
//       field: 'newPeopleCount', 
//       headerName: 'New People', 
//       flex: 1, 
//       minWidth: 120,
//       align: 'center',
//       headerAlign: 'center',
//     },
//     { 
//       field: 'consolidatedCount', 
//       headerName: 'Converts Count', 
//       flex: 1, 
//       minWidth: 130,
//       align: 'center',
//       headerAlign: 'center',
//     },
//     {
//       field: 'viewDetails',
//       headerName: 'View Details',
//       width: 120,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <IconButton 
//           size="small" 
//           color="primary"
//           onClick={() => onViewDetails(params.row.eventId)}
//         >
//           <GroupIcon />
//         </IconButton>
//       )
//     },
//     {
//       field: 'viewNewPeople',
//       headerName: 'View New People',
//       width: 140,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <IconButton 
//           size="small" 
//           color="success"
//           onClick={() => onViewNewPeople(params.row.eventId)}
//         >
//           <PersonAddAltIcon />
//         </IconButton>
//       )
//     },
//     {
//       field: 'viewConverts',
//       headerName: 'View Converts/...',
//       width: 150,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <IconButton 
//           size="small" 
//           color="secondary"
//           onClick={() => onViewConverts(params.row.eventId)}
//         >
//           <MergeIcon />
//         </IconButton>
//       )
//     },
//   ];

//   return (
//     <Box>
//       <Paper variant="outlined" sx={{ height: 600, boxShadow: 3 }}>
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           pageSizeOptions={[25, 50, 100]}
//           slots={{ toolbar: GridToolbar }}
//           slotProps={{
//             toolbar: {
//               showQuickFilter: true,
//               quickFilterProps: { debounceMs: 500 },
//             },
//           }}
//           disableRowSelectionOnClick
//           initialState={{
//             pagination: { paginationModel: { pageSize: 25 } },
//             sorting: {
//               sortModel: [{ field: 'date', sort: 'desc' }],
//             },
//           }}
//           sx={{
//             '& .MuiDataGrid-row:hover': {
//               backgroundColor: theme.palette.action.hover,
//             },
//           }}
//         />
//       </Paper>
//     </Box>
//   );
// }

// export default EventHistory;
import React, { useState, useEffect } from "react";
import { Box, Paper, IconButton, useTheme, Typography, Alert, Button } from "@mui/material";
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
  onViewConverts
}) {
  const theme = useTheme();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events data
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch(`${API_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
          throw new Error('Server returned HTML instead of JSON. Check if the backend is running correctly.');
        }
        throw new Error(`Unexpected response format: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Fetched events data:', data); // Debug log
      
      if (data.events && Array.isArray(data.events)) {
        // Transform the data to match our component structure
        const transformedEvents = data.events.map(event => ({
          id: event._id || event.id,
          eventName: event.eventName || event["Event Name"] || "Unnamed Event",
          date: event.date || event.createdAt || event["Date Of Event"],
          total_attendance: event.total_attendance || event.attendees?.length || 0,
          summary: event.summary || {
            total_attendees: event.total_attendance || event.attendees?.length || 0,
            first_time_decisions: 0,
            recommitments: 0,
            total_decisions: 0,
            new_people: 0
          }
        }));
        
        setEvents(transformedEvents);
      } else {
        console.warn('No events array found in response:', data);
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Prepare rows for DataGrid
  const rows = events.map((event) => ({
    id: event.id,
    date: formatDate(event.date), // Now formatDate is defined above
    eventName: event.eventName,
    attendanceCount: event.total_attendance,
    newPeopleCount: event.summary?.new_people || 0,
    consolidatedCount: event.summary?.total_decisions || 0,
    firstTimeDecisions: event.summary?.first_time_decisions || 0,
    recommitments: event.summary?.recommitments || 0,
    eventId: event.id,
  }));

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <GroupIcon fontSize="small" color="primary" />
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
          backgroundColor: params.value > 0 ? theme.palette.success.light : 'transparent',
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
          backgroundColor: params.value > 0 ? theme.palette.secondary.light : 'transparent',
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
          onClick={() => onViewDetails(params.row.eventId)}
          title="View Event Details"
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
          onClick={() => onViewNewPeople(params.row.eventId)}
          disabled={params.row.newPeopleCount === 0}
          title="View New People"
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
          onClick={() => onViewConverts(params.row.eventId)}
          disabled={params.row.consolidatedCount === 0}
          title="View Decisions"
        >
          <MergeIcon />
        </IconButton>
      )
    },
  ];

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
          sx={{ m: 2 }}
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
          sx={{ ml: 2 }}
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
            Total Events: {events.length}
          </Typography>
          <Button 
            size="small" 
            startIcon={<RefreshIcon />} 
            onClick={fetchEvents}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {events.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Events Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are no events to display. Events will appear here once they are created.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={fetchEvents}
            startIcon={<RefreshIcon />}
            sx={{ mt: 2 }}
          >
            Check Again
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ height: 600, boxShadow: 3 }}>
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
            }}
          />
        </Paper>
      )}
    </Box>
  );
}

export default EventHistory;