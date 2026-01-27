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
  events = [],
  isLoading = false,
  onRefresh,
  searchTerm = ""
}) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));


  const filteredEvents = React.useMemo(() => {
    if (!Array.isArray(events)) {
      console.warn('Events is not an array:', events);
      return [];
    }

    if (!searchTerm.trim()) return events;

    const term = searchTerm.toLowerCase().trim();
    return events.filter(event => {
      if (!event) return false;
      return (
        (event.eventName && event.eventName.toLowerCase().includes(term)) ||
        (event.date && event.date.toString().toLowerCase().includes(term)) ||
        (event.status && event.status.toLowerCase().includes(term)) ||
        (event.closed_by && event.closed_by.toLowerCase().includes(term))
      );
    });
  }, [events, searchTerm]);

  const getAttendanceCount = React.useCallback((event) => {
    if (!event) return 0;

    if (typeof event.attendance === 'number') return event.attendance;
    if (typeof event.total_attendance === 'number') return event.total_attendance;
    if (Array.isArray(event.attendees)) return event.attendees.length;
    if (Array.isArray(event.attendanceData)) return event.attendanceData.length;
    return 0;
  }, []);

  const getNewPeopleCount = React.useCallback((event) => {
    if (!event) return 0;

    if (typeof event.newPeople === 'number') return event.newPeople;
    if (Array.isArray(event.new_people)) return event.new_people.length;
    if (Array.isArray(event.newPeopleData)) return event.newPeopleData.length;
    return 0;
  }, []);

  const getConsolidatedCount = React.useCallback((event) => {
    if (!event) return 0;

    if (typeof event.consolidated === 'number') return event.consolidated;
    if (Array.isArray(event.consolidations)) return event.consolidations.length;
    if (Array.isArray(event.consolidatedData)) return event.consolidatedData.length;
    return 0;
  }, []);

  const handleViewDetails = React.useCallback((event, type) => {
    if (!event) {
      console.error('Event is undefined in handleViewDetails');
      return;
    }

    console.log(`Clicked VIEW for ${type} on event:`, event.eventName);
    console.log('Event data available:', {
      hasAttendanceData: !!event.attendanceData,
      attendanceDataLength: event.attendanceData?.length,
      hasNewPeopleData: !!event.newPeopleData,
      newPeopleDataLength: event.newPeopleData?.length,
      hasConsolidatedData: !!event.consolidatedData,
      consolidatedDataLength: event.consolidatedData?.length,
      attendanceHasLeaders: event.attendanceData?.some(a => a.leader1 || a.leader12 || a.leader144),
      newPeopleHasLeaders: event.newPeopleData?.some(np => np.leader1 || np.leader12 || np.leader144),
      consolidatedHasLeaders: event.consolidatedData?.some(c => c.leader1 || c.leader12 || c.leader144)
    });

    let data = [];

    // Function that sorts people in viewDetails in alphabetical order
    const sortAlphabetically = (arr) =>
       [...arr].sort((a, b) =>
       `${a.name || ''} ${a.surname || ''}`
        .toLowerCase()
        .localeCompare(
       `${b.name || ''} ${b.surname || ''}`.toLowerCase()
        )
      );

    switch (type) {
      case 'attendance':
        data = sortAlphabetically(event.attendanceData || event.attendees || []);

        console.log('Attendance data with leaders:', data.slice(0, 2).map(d => ({
          name: d.name,
          leader1: d.leader1,
          leader12: d.leader12,
          leader144: d.leader144
        })));
        if (onViewDetails) onViewDetails(event, data);
        break;
      case 'newPeople':
        data = sortAlphabetically(event.newPeopleData || event.new_people || []);

        console.log('New people data with leaders:', data.slice(0, 2).map(d => ({
          name: d.name,
          leader1: d.leader1,
          leader12: d.leader12,
          leader144: d.leader144
        })));
        if (onViewNewPeople) onViewNewPeople(event, data);
        break;
      case 'consolidated':
        data = sortAlphabetically(event.consolidatedData || event.consolidations || []);

        console.log('Consolidation data with leaders:', data.slice(0, 2).map(d => ({
          name: d.name,
          leader1: d.leader1,
          leader12: d.leader12,
          leader144: d.leader144
        })));
        if (onViewConverts) onViewConverts(event, data);
        break;
      default:
        console.warn('Unknown type in handleViewDetails:', type);
    }
  }, [onViewDetails, onViewNewPeople, onViewConverts]);

  const columns = React.useMemo(() => {
    const baseColumns = [
      {
        field: 'eventName',
        headerName: 'Event',
        flex: 1,
        minWidth: isSmDown ? 180 : 200,
        valueGetter: (params) => params.row?.eventName || 'Unnamed Event',
        renderCell: (params) => {
          const event = params.row || {};
          const eventName = event.eventName || 'Unnamed Event';
          const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: isSmDown ? 'short' : 'long',
            day: 'numeric'
          }) : 'No date';

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight={600} noWrap={isSmDown}>
                {isSmDown ? (
                  <>
                    {eventDate.split(' ')[0]} {eventDate.split(' ')[1].slice(0, 3)} - {eventName.length > 20 ? `${eventName.substring(0, 20)}...` : eventName}
                  </>
                ) : (
                  `${eventDate} - ${eventName}`
                )}
              </Typography>
            </Box>
          );
        }
      },
      {
        field: 'attendance',
        headerName: isSmDown ? 'Attend' : 'Attendance',
        width: isSmDown ? 90 : 130,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (params) => getAttendanceCount(params.row),
        renderCell: (params) => {
          const count = getAttendanceCount(params.row);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography fontWeight={600} color="primary" fontSize={isSmDown ? '0.875rem' : '1rem'}>
                {count}
              </Typography>
            </Box>
          );
        }
      },
      {
        field: 'newPeople',
        headerName: isSmDown ? 'New' : 'New People',
        width: isSmDown ? 90 : 130,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (params) => getNewPeopleCount(params.row),
        renderCell: (params) => {
          const count = getNewPeopleCount(params.row);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography fontWeight={600} color="success.main" fontSize={isSmDown ? '0.875rem' : '1rem'}>
                {count}
              </Typography>
            </Box>
          );
        }
      },
      {
        field: 'consolidated',
        headerName: isSmDown ? 'Consol' : 'Consolidated',
        width: isSmDown ? 90 : 130,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (params) => getConsolidatedCount(params.row),
        renderCell: (params) => {
          const count = getConsolidatedCount(params.row);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography fontWeight={600} color="secondary.main" fontSize={isSmDown ? '0.875rem' : '1rem'}>
                {count}
              </Typography>
            </Box>
          );
        }
      },
    ];


    const actionColumns = [
      {
        field: 'viewAttendance',
        headerName: isSmDown ? '' : 'Attendance',
        width: isSmDown ? 60 : 150,
        sortable: false,
        filterable: false,
        hide: isSmDown,
        renderCell: (params) => {
          const event = params.row || {};
          const count = getAttendanceCount(event);
          const hasData = count > 0;

          return (
            <Button
              size={isSmDown ? "small" : "medium"}
              variant="outlined"
              startIcon={isSmDown ? null : <VisibilityIcon />}
              onClick={() => handleViewDetails(event, 'attendance')}
              disabled={!hasData}
              sx={{
                fontSize: isSmDown ? '0.7rem' : '0.75rem',
                minWidth: isSmDown ? 'auto' : 64,
                padding: isSmDown ? '2px 6px' : '4px 8px',
                '&:disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }
              }}
            >
              {isSmDown ? 'A' : 'VIEW'}
            </Button>
          );
        }
      },
      {
        field: 'viewNewPeople',
        headerName: isSmDown ? '' : 'New People',
        width: isSmDown ? 60 : 150,
        sortable: false,
        filterable: false,
        hide: isSmDown,
        renderCell: (params) => {
          const event = params.row || {};
          const count = getNewPeopleCount(event);
          const hasData = count > 0;

          return (
            <Button
              size={isSmDown ? "small" : "medium"}
              variant="outlined"
              color="success"
              startIcon={isSmDown ? null : <PersonIcon />}
              onClick={() => handleViewDetails(event, 'newPeople')}
              disabled={!hasData}
              sx={{
                fontSize: isSmDown ? '0.7rem' : '0.75rem',
                minWidth: isSmDown ? 'auto' : 64,
                padding: isSmDown ? '2px 6px' : '4px 8px',
                '&:disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }
              }}
            >
              {isSmDown ? 'N' : 'VIEW'}
            </Button>
          );
        }
      },
      {
        field: 'viewConsolidated',
        headerName: isSmDown ? '' : 'Consolidated',
        width: isSmDown ? 60 : 150,
        sortable: false,
        filterable: false,
        hide: isSmDown,
        renderCell: (params) => {
          const event = params.row || {};
          const count = getConsolidatedCount(event);
          const hasData = count > 0;

          return (
            <Button
              size={isSmDown ? "small" : "medium"}
              variant="outlined"
              color="secondary"
              startIcon={isSmDown ? null : <EmojiPeopleIcon />}
              onClick={() => handleViewDetails(event, 'consolidated')}
              disabled={!hasData}
              sx={{
                fontSize: isSmDown ? '0.7rem' : '0.75rem',
                minWidth: isSmDown ? 'auto' : 64,
                padding: isSmDown ? '2px 6px' : '4px 8px',
                '&:disabled': {
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }
              }}
            >
              {isSmDown ? 'C' : 'VIEW'}
            </Button>
          );
        }
      }
    ];

    if (isSmDown) {
      return [
        ...baseColumns,
        {
          field: 'actions',
          headerName: 'Actions',
          width: 100,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            const event = params.row || {};
            const attendanceCount = getAttendanceCount(event);
            const newPeopleCount = getNewPeopleCount(event);
            const consolidatedCount = getConsolidatedCount(event);

            return (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="View Attendance">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(event, 'attendance')}
                      disabled={attendanceCount === 0}
                      color="primary"
                      sx={{
                        '&:disabled': {
                          opacity: 0.3,
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="View New People">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(event, 'newPeople')}
                      disabled={newPeopleCount === 0}
                      color="success"
                      sx={{
                        '&:disabled': {
                          opacity: 0.3,
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      <PersonIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="View Consolidated">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(event, 'consolidated')}
                      disabled={consolidatedCount === 0}
                      color="secondary"
                      sx={{
                        '&:disabled': {
                          opacity: 0.3,
                          cursor: 'not-allowed'
                        }
                      }}
                    >
                      <EmojiPeopleIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          }
        }
      ];
    }

    return [...baseColumns, ...actionColumns];
  }, [isSmDown, getAttendanceCount, getNewPeopleCount, getConsolidatedCount, handleViewDetails]);


  React.useEffect(() => {
    console.log('📊 EventHistory component data:', {
      eventsCount: events?.length || 0,
      filteredEventsCount: filteredEvents.length,
      screenSize: {
        isSmDown,
        isMdDown,
        isLgDown
      }
    });
  }, [events, filteredEvents, isSmDown, isMdDown, isLgDown]);


  const SkeletonLoader = React.useCallback(() => (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
          height: isMdDown ? 'calc(100vh - 200px)' : 650,
          minHeight: isMdDown ? 400 : 650,
        }}
      >
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={400} />
          <Skeleton variant="rounded" height={52} />
        </Box>
      </Paper>
    </Box>
  ), [isMdDown]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (!filteredEvents || filteredEvents.length === 0) {
    return (
      <Paper sx={{
        p: isSmDown ? 2 : 4,
        textAlign: 'center',
        boxShadow: 3,
        m: isSmDown ? 1 : 0
      }}>
        <Typography variant={isSmDown ? "body1" : "h6"} color="text.secondary" gutterBottom>
          {events?.length === 0 ? 'No event history found' : 'No matching events found'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {events?.length === 0
            ? 'Closed events with attendance data will appear here'
            : 'Try a different search term'}
        </Typography>
        {onRefresh && (
          <Button
            variant="outlined"
            onClick={onRefresh}
            startIcon={<RefreshIcon />}
            size={isSmDown ? "small" : "medium"}
          >
            Refresh Events
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      p: isSmDown ? 0.5 : 1
    }}>
      <Paper
        variant="outlined"
        sx={{
          boxShadow: 2,
          overflow: 'hidden',
          width: '100%',
          height: isSmDown ? 'calc(100vh - 180px)' :
            isMdDown ? 'calc(100vh - 220px)' : 650,
          minHeight: isSmDown ? 400 : isMdDown ? 500 : 650,
        }}
      >
        <DataGrid
          rows={filteredEvents}
          columns={columns}
          loading={isLoading}
          slots={{
            toolbar: isSmDown ? null : GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: !isSmDown,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: isSmDown ? 10 : 25 }
            },
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }]
            }
          }}
          pageSizeOptions={isSmDown ? [5, 10] : [10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || row._id || Math.random().toString(36)}
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
              fontSize: isSmDown ? '0.75rem' : '0.875rem',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              fontSize: isSmDown ? '0.75rem' : '0.875rem',
            },
            '& .MuiDataGrid-cell[data-field="eventName"]': {
              justifyContent: 'flex-start',
              textAlign: 'left',
              paddingLeft: isSmDown ? 1 : 2,
            },
            '& .MuiDataGrid-virtualScroller': {
              minHeight: isSmDown ? 200 : 300,
            },
            '& .MuiDataGrid-footerContainer': {
              padding: isSmDown ? '8px' : '16px',
            },
          }}
        />
      </Paper>
    </Box>
  );
});

export default EventHistory;