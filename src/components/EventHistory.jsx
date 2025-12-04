// import React from 'react';
// import {
//   Box,
//   Paper,
//   Button,
//   Typography,
//   useTheme,
//   useMediaQuery,
//   IconButton,
//   Tooltip,
//   CircularProgress,
//   Skeleton
// } from '@mui/material';
// import { DataGrid, GridToolbar } from '@mui/x-data-grid';
// import VisibilityIcon from '@mui/icons-material/Visibility';
// import RefreshIcon from '@mui/icons-material/Refresh';
// import PersonIcon from '@mui/icons-material/Person';
// import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';

// const EventHistory = React.memo(function EventHistory({ 
//   onViewDetails, 
//   onViewNewPeople, 
//   onViewConverts, 
//   events, 
//   isLoading = false,
//   onRefresh,
//   searchTerm = "" 
// }) {
//   const theme = useTheme();
//   const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
//   const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  
//   // Filter events based on search term
//   const filteredEvents = React.useMemo(() => {
//     if (!Array.isArray(events)) return [];
    
//     if (!searchTerm.trim()) return events;
    
//     const term = searchTerm.toLowerCase().trim();
//     return events.filter(event => 
//       event.eventName?.toLowerCase().includes(term) ||
//       (event.date && event.date.toString().toLowerCase().includes(term)) ||
//       event.status?.toLowerCase().includes(term)
//     );
//   }, [events, searchTerm]);
  
//   const handleViewDetails = React.useCallback((event, type) => {
//     console.log(`Clicked VIEW for ${type} on event:`, event.eventName);
    
//     let data = [];
    
//     switch (type) {
//       case 'attendance':
//         data = Array.isArray(event.attendanceData) ? event.attendanceData : [];
//         console.log('Attendance data:', { count: data.length, isArray: Array.isArray(data) });
//         if (onViewDetails) onViewDetails(event, type, data);
//         break;
//       case 'newPeople':
//         data = Array.isArray(event.newPeopleData) ? event.newPeopleData : [];
//         console.log('New people data:', { count: data.length, isArray: Array.isArray(data) });
//         if (onViewNewPeople) onViewNewPeople(event, type, data);
//         break;
//       case 'consolidated':
//         data = Array.isArray(event.consolidatedData) ? event.consolidatedData : [];
//         console.log('Consolidation data:', { count: data.length, isArray: Array.isArray(data) });
//         if (onViewConverts) onViewConverts(event, type, data);
//         break;
//     }
//   }, [onViewDetails, onViewNewPeople, onViewConverts]);

//   const columns = React.useMemo(() => [
//     {
//       field: 'eventName',
//       headerName: 'Event',
//       flex: 1,
//       minWidth: 200,
//       renderCell: (params) => (
//         <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//           <Typography variant="body2" fontWeight={600}>
//             {params.row.date ? new Date(params.row.date).toLocaleDateString('en-US', {
//               year: 'numeric',
//               month: 'long',
//               day: 'numeric'
//             }) : 'No date'} - {params.row.eventName}
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             {params.row.status?.toUpperCase()}
//           </Typography>
//         </Box>
//       )
//     },
//     {
//       field: 'attendance',
//       headerName: 'Attendance',
//       width: 130,
//       align: 'center',
//       headerAlign: 'center',
//       renderCell: (params) => (
//         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//           <Typography fontWeight={600} color="primary">
//             {params.row.attendance || 0}
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             present
//           </Typography>
//         </Box>
//       )
//     },
//     {
//       field: 'newPeople',
//       headerName: 'New People',
//       width: 130,
//       align: 'center',
//       headerAlign: 'center',
//       renderCell: (params) => (
//         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//           <Typography fontWeight={600} color="success.main">
//             {params.row.newPeople || 0}
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             first time
//           </Typography>
//         </Box>
//       )
//     },
//     {
//       field: 'consolidated',
//       headerName: 'Consolidated',
//       width: 130,
//       align: 'center',
//       headerAlign: 'center',
//       renderCell: (params) => (
//         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//           <Typography fontWeight={600} color="secondary.main">
//             {params.row.consolidated || 0}
//           </Typography>
//           <Typography variant="caption" color="text.secondary">
//             decisions
//           </Typography>
//         </Box>
//       )
//     },
//     {
//       field: 'viewAttendance',
//       headerName: 'Attendance',
//       width: 150,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <Button
//           size="small"
//           variant="outlined"
//           startIcon={<VisibilityIcon />}
//           onClick={() => handleViewDetails(params.row, 'attendance')}
//           disabled={!params.row.attendance || params.row.attendance === 0}
//           sx={{ 
//             fontSize: '0.75rem',
//             '&:disabled': {
//               opacity: 0.5,
//               cursor: 'not-allowed'
//             }
//           }}
//         >
//           VIEW ({params.row.attendance || 0})
//         </Button>
//       )
//     },
//     {
//       field: 'viewNewPeople',
//       headerName: 'New People',
//       width: 150,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <Button
//           size="small"
//           variant="outlined"
//           color="success"
//           startIcon={<PersonIcon />}
//           onClick={() => handleViewDetails(params.row, 'newPeople')}
//           disabled={!params.row.newPeople || params.row.newPeople === 0}
//           sx={{ 
//             fontSize: '0.75rem',
//             '&:disabled': {
//               opacity: 0.5,
//               cursor: 'not-allowed'
//             }
//           }}
//         >
//           VIEW ({params.row.newPeople || 0})
//         </Button>
//       )
//     },
//     {
//       field: 'viewConsolidated',
//       headerName: 'Consolidated',
//       width: 150,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <Button
//           size="small"
//           variant="outlined"
//           color="secondary"
//           startIcon={<EmojiPeopleIcon />}
//           onClick={() => handleViewDetails(params.row, 'consolidated')}
//           disabled={!params.row.consolidated || params.row.consolidated === 0}
//           sx={{ 
//             fontSize: '0.75rem',
//             '&:disabled': {
//               opacity: 0.5,
//               cursor: 'not-allowed'
//             }
//           }}
//         >
//           VIEW ({params.row.consolidated || 0})
//         </Button>
//       )
//     }
//   ], [handleViewDetails]);

//   // Skeleton Loader
//   const SkeletonLoader = React.useCallback(() => (
//     <Box sx={{ width: '100%', height: '100%' }}>
//       <Box sx={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center', 
//         mb: 2,
//         flexWrap: 'wrap',
//         gap: 1
//       }}>
//         <Skeleton variant="text" width={120} height={32} />
//         <Skeleton variant="circular" width={32} height={32} />
//       </Box>
      
//       <Paper
//         variant="outlined"
//         sx={{
//           boxShadow: 3,
//           overflow: 'hidden',
//           width: '100%',
//           height: isMdDown ? 'calc(100vh - 280px)' : 650,
//           minHeight: isMdDown ? 500 : 650,
//         }}
//       >
//         <Box sx={{ p: 2 }}>
//           <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
//           <Skeleton variant="rounded" height={400} />
//           <Skeleton variant="rounded" height={52} sx={{ mt: 2 }} />
//         </Box>
//       </Paper>
//     </Box>
//   ), [isMdDown]);

//   // Show loading state
//   if (isLoading) {
//     return <SkeletonLoader />;
//   }

//   // Show empty state
//   if (!filteredEvents || filteredEvents.length === 0) {
//     return (
//       <Paper sx={{ p: 4, textAlign: 'center', boxShadow: 3 }}>
//         <Typography variant="h6" color="text.secondary" gutterBottom>
//           No event history found
//         </Typography>
//         <Typography variant="body2" color="text.secondary" paragraph>
//           Closed events with attendance data will appear here
//         </Typography>
//         {onRefresh && (
//           <Button 
//             variant="outlined" 
//             onClick={onRefresh}
//             startIcon={<RefreshIcon />}
//           >
//             Refresh
//           </Button>
//         )}
//       </Paper>
//     );
//   }

//   return (
//     <Box sx={{ width: '100%', height: '100%' }}>
//       {/* Toolbar with refresh button */}
//       <Box sx={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center', 
//         mb: 2,
//         flexWrap: 'wrap',
//         gap: 1
//       }}>
//         <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//           <Typography variant="body2" color="text.secondary">
//             {filteredEvents.length} closed events
//             {searchTerm && ` (filtered from ${events.length})`}
//           </Typography>
//           {onRefresh && (
//             <Tooltip title="Refresh Event Stats">
//               <IconButton 
//                 onClick={onRefresh} 
//                 size="small"
//                 color="primary"
//                 sx={{ 
//                   border: `1px solid ${theme.palette.divider}`,
//                   '&:hover': {
//                     backgroundColor: theme.palette.action.hover
//                   }
//                 }}
//               >
//                 <RefreshIcon fontSize="small" />
//               </IconButton>
//             </Tooltip>
//           )}
//         </Box>
//       </Box>

//       <Paper
//         variant="outlined"
//         sx={{
//           boxShadow: 3,
//           overflow: 'hidden',
//           width: '100%',
//           height: isMdDown ? 'calc(100vh - 280px)' : 650,
//           minHeight: isMdDown ? 500 : 650,
//         }}
//       >
//         <DataGrid
//           rows={filteredEvents}
//           columns={columns}
//           loading={isLoading}
//           slots={{
//             toolbar: GridToolbar,
//           }}
//           slotProps={{
//             toolbar: {
//               showQuickFilter: true,
//               quickFilterProps: { debounceMs: 500 },
//             },
//           }}
//           initialState={{
//             pagination: {
//               paginationModel: { pageSize: 25 }
//             },
//             sorting: {
//               sortModel: [{ field: 'date', sort: 'desc' }]
//             }
//           }}
//           pageSizeOptions={[25, 50, 100]}
//           disableRowSelectionOnClick
//           sx={{
//             width: '100%',
//             height: '100%',
//             '& .MuiDataGrid-columnHeaders': {
//               backgroundColor: theme.palette.action.hover,
//               borderBottom: `2px solid ${theme.palette.divider}`,
//             },
//             '& .MuiDataGrid-columnHeader': {
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center',
//             },
//             '& .MuiDataGrid-columnHeaderTitle': {
//               textAlign: 'center',
//               width: '100%',
//               fontWeight: 600,
//             },
//             '& .MuiDataGrid-cell': {
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center',
//               textAlign: 'center',
//             },
//             '& .MuiDataGrid-cell[data-field="eventName"]': {
//               justifyContent: 'flex-start',
//               textAlign: 'left',
//               paddingLeft: 2,
//             },
//           }}
//         />
//       </Paper>
//     </Box>
//   );
// });

// export default EventHistory;

import React from 'react';
import {
  Box,
  Paper,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  CircularProgress,
  Skeleton
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';

const EventHistory = React.memo(function EventHistory({ 
  onViewDetails, 
  onViewNewPeople, 
  onViewConverts, 
  events, 
  isLoading = false,
  onRefresh,
  searchTerm = "" 
}) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  
  // Filter events based on search term
  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(events)) return [];
    
    if (!searchTerm.trim()) return events;
    
    const term = searchTerm.toLowerCase().trim();
    return events.filter(event => 
      event.eventName?.toLowerCase().includes(term) ||
      (event.date && event.date.toString().toLowerCase().includes(term)) ||
      event.status?.toLowerCase().includes(term)
    );
  }, [events, searchTerm]);
  
  const handleViewDetails = React.useCallback((event, type) => {
    console.log(`Clicked VIEW for ${type} on event:`, event.eventName);
    console.log('Event data available:', {
      eventName: event.eventName,
      attendanceDataLength: event.attendanceData?.length,
      newPeopleDataLength: event.newPeopleData?.length,
      consolidatedDataLength: event.consolidatedData?.length,
      attendanceData: event.attendanceData?.[0],
      newPeopleData: event.newPeopleData?.[0],
      consolidatedData: event.consolidatedData?.[0]
    });
    
    let data = [];
    
    switch (type) {
      case 'attendance':
        data = Array.isArray(event.attendanceData) ? event.attendanceData : [];
        console.log('Attendance data for modal:', { 
          count: data.length, 
          sample: data[0],
          allData: data.slice(0, 3) 
        });
        if (onViewDetails) onViewDetails(event, type, data);
        break;
      case 'newPeople':
        data = Array.isArray(event.newPeopleData) ? event.newPeopleData : [];
        console.log('New people data for modal:', { 
          count: data.length, 
          sample: data[0],
          allData: data.slice(0, 3) 
        });
        if (onViewNewPeople) onViewNewPeople(event, type, data);
        break;
      case 'consolidated':
        data = Array.isArray(event.consolidatedData) ? event.consolidatedData : [];
        console.log('Consolidation data for modal:', { 
          count: data.length, 
          sample: data[0],
          allData: data.slice(0, 3) 
        });
        if (onViewConverts) onViewConverts(event, type, data);
        break;
    }
  }, [onViewDetails, onViewNewPeople, onViewConverts]);

  const columns = React.useMemo(() => [
    {
      field: 'eventName',
      headerName: 'Event',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="body2" fontWeight={600}>
            {params.row.date ? new Date(params.row.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'No date'} - {params.row.eventName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.status?.toUpperCase()}
          </Typography>
        </Box>
      )
    },
    {
      field: 'attendance',
      headerName: 'Attendance',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography fontWeight={600} color="primary">
            {params.row.attendance || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            present
          </Typography>
        </Box>
      )
    },
    {
      field: 'newPeople',
      headerName: 'New People',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography fontWeight={600} color="success.main">
            {params.row.newPeople || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            first time
          </Typography>
        </Box>
      )
    },
    {
      field: 'consolidated',
      headerName: 'Consolidated',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography fontWeight={600} color="secondary.main">
            {params.row.consolidated || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            decisions
          </Typography>
        </Box>
      )
    },
    {
      field: 'viewAttendance',
      headerName: 'Attendance',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => handleViewDetails(params.row, 'attendance')}
          disabled={!params.row.attendance || params.row.attendance === 0}
          sx={{ 
            fontSize: '0.75rem',
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed'
            }
          }}
        >
          VIEW
        </Button>
      )
    },
    {
      field: 'viewNewPeople',
      headerName: 'New People',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          color="success"
          startIcon={<PersonIcon />}
          onClick={() => handleViewDetails(params.row, 'newPeople')}
          disabled={!params.row.newPeople || params.row.newPeople === 0}
          sx={{ 
            fontSize: '0.75rem',
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed'
            }
          }}
        >
          VIEW 
        </Button>
      )
    },
    {
      field: 'viewConsolidated',
      headerName: 'Consolidated',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<EmojiPeopleIcon />}
          onClick={() => handleViewDetails(params.row, 'consolidated')}
          disabled={!params.row.consolidated || params.row.consolidated === 0}
          sx={{ 
            fontSize: '0.75rem',
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed'
            }
          }}
        >
          VIEW
        </Button>
      )
    }
  ], [handleViewDetails]);

  // Skeleton Loader
  const SkeletonLoader = React.useCallback(() => (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Skeleton variant="text" width={120} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
      
      <Paper
        variant="outlined"
        sx={{
          boxShadow: 3,
          overflow: 'hidden',
          width: '100%',
          height: isMdDown ? 'calc(100vh - 280px)' : 650,
          minHeight: isMdDown ? 500 : 650,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={400} />
          <Skeleton variant="rounded" height={52} sx={{ mt: 2 }} />
        </Box>
      </Paper>
    </Box>
  ), [isMdDown]);

  // Show loading state
  if (isLoading) {
    return <SkeletonLoader />;
  }

  // Show empty state
  if (!filteredEvents || filteredEvents.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', boxShadow: 3 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No event history found
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Closed events with attendance data will appear here
        </Typography>
        {onRefresh && (
          <Button 
            variant="outlined" 
            onClick={onRefresh}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Toolbar with refresh button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredEvents.length} closed events
            {searchTerm && ` (filtered from ${events.length})`}
          </Typography>
          {onRefresh && (
            <Tooltip title="Refresh Event Stats">
              <IconButton 
                onClick={onRefresh} 
                size="small"
                color="primary"
                sx={{ 
                  border: `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          boxShadow: 3,
          overflow: 'hidden',
          width: '100%',
          height: isMdDown ? 'calc(100vh - 280px)' : 650,
          minHeight: isMdDown ? 500 : 650,
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          loading={isLoading}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 }
            },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }]
            }
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            width: '100%',
            height: '100%',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.action.hover,
              borderBottom: `2px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-columnHeader': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              textAlign: 'center',
              width: '100%',
              fontWeight: 600,
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            },
            '& .MuiDataGrid-cell[data-field="eventName"]': {
              justifyContent: 'flex-start',
              textAlign: 'left',
              paddingLeft: 2,
            },
          }}
        />
      </Paper>
    </Box>
  );
});

export default EventHistory;