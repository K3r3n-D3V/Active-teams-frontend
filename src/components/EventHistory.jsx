import React, { useState } from 'react';
import {
  Box,
  Paper,
  Button,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Stack,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';

function EventHistory({ 
  onViewDetails, 
  onViewNewPeople, 
  onViewConverts, 
  events, 
  isLoading = false,
  onRefresh 
}) {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    event: null,
    type: null,
    data: []
  });
  
  const [detailSearch, setDetailSearch] = useState('');
  const [detailPage, setDetailPage] = useState(0);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(25);

  // Debug: Log what events we're receiving
  React.useEffect(() => {
    if (events && events.length > 0) {
      console.log('📅 EventHistory received events:', events);
      console.log('📊 Sample event data:', events[0]);
      
      // Debug the actual data structure
      if (events[0]?.attendanceData?.length > 0) {
        console.log('👥 First attendance data:', events[0].attendanceData[0]);
        console.log('🔍 Leader fields check:', {
          leader1: events[0].attendanceData[0].leader1,
          leader12: events[0].attendanceData[0].leader12,
          leader144: events[0].attendanceData[0].leader144
        });
      }
      
      if (events[0]?.newPeopleData?.length > 0) {
        console.log('👶 First new person data:', events[0].newPeopleData[0]);
        console.log('🔍 New person leader fields:', {
          leader1: events[0].newPeopleData[0].leader1,
          leader12: events[0].newPeopleData[0].leader12,
          leader144: events[0].newPeopleData[0].leader144
        });
      }
      
      if (events[0]?.consolidatedData?.length > 0) {
        console.log('🤝 First consolidation data:', events[0].consolidatedData[0]);
        console.log('🔍 Consolidation leader fields:', {
          leader1: events[0].consolidatedData[0].leader1,
          leader12: events[0].consolidatedData[0].leader12,
          leader144: events[0].consolidatedData[0].leader144
        });
      }
    }
  }, [events]);

  const handleViewDetails = (event, type) => {
    let data = [];
    
    switch (type) {
      case 'attendance':
        data = event.attendanceData || [];
        if (onViewDetails) {
          onViewDetails(event, data);
          return;
        }
        break;
      case 'newPeople':
        data = event.newPeopleData || [];
        if (onViewNewPeople) {
          onViewNewPeople(event, data);
          return;
        }
        break;
      case 'consolidated':
        data = event.consolidatedData || [];
        if (onViewConverts) {
          onViewConverts(event, data);
          return;
        }
        break;
    }
    
    console.log(`👁️ Viewing ${type} for ${event.eventName}:`, {
      count: data.length,
      sample: data[0],
      dataStructure: data.length > 0 ? Object.keys(data[0]) : 'No data',
      leaderFields: data[0] ? {
        leader1: data[0].leader1,
        leader12: data[0].leader12,
        leader144: data[0].leader144
      } : 'No data'
    });
    
    setDetailsDialog({
      open: true,
      event: event,
      type: type,
      data: data
    });
    setDetailSearch('');
    setDetailPage(0);
  };

  const handleCloseDetails = () => {
    setDetailsDialog({
      open: false,
      event: null,
      type: null,
      data: []
    });
  };

  const filteredDetailData = detailsDialog.data.filter(item => {
    if (!detailSearch.trim()) return true;

    const searchTerms = detailSearch.toLowerCase().trim().split(/\s+/);

    let searchableFields = [];

    if (detailsDialog.type === 'consolidated') {
      searchableFields = [
        item.person_name || item.name || '',
        item.person_surname || item.surname || '',
        item.person_email || item.email || '',
        item.person_phone || item.phone || '',
        item.assigned_to || '',
        item.decision_type || '',
        item.notes || '',
        item.assigned_to_email || ''
      ];
    } else if (detailsDialog.type === 'newPeople') {
      searchableFields = [
        item.name || '',
        item.surname || '',
        item.email || '',
        item.phone || '',
        item.leader1 || '',
        item.leader12 || '',
        item.leader144 || '',
        item.gender || '',
        item.invitedBy || ''
      ];
    } else {
      // attendance
      searchableFields = [
        item.name || '',
        item.surname || '',
        item.email || '',
        item.phone || '',
        item.leader1 || '',
        item.leader12 || '',
        item.leader144 || '',
        item.gender || '',
        item.invitedBy || ''
      ];
    }

    return searchTerms.every(term =>
      searchableFields.some(field =>
        field.toLowerCase().includes(term)
      )
    );
  });

  const paginatedDetailData = filteredDetailData.slice(
    detailPage * detailRowsPerPage,
    detailPage * detailRowsPerPage + detailRowsPerPage
  );

  const getDialogTitle = () => {
    if (!detailsDialog.event) return '';
    
    const titles = {
      attendance: `Attendance for ${detailsDialog.event.eventName}`,
      newPeople: `New People for ${detailsDialog.event.eventName}`,
      consolidated: `Decisions for ${detailsDialog.event.eventName}`
    };
    
    return titles[detailsDialog.type] || '';
  };

  // Helper function to get display value for leader fields
  const getLeaderDisplay = (value) => {
    return value && value.trim() !== "" ? value : "—";
  };

  const columns = [
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
      headerName: 'Decisions',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography fontWeight={600} color="secondary.main">
            {params.row.consolidated || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            commitments
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
          VIEW ({params.row.attendance || 0})
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
          startIcon={<VisibilityIcon />}
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
          VIEW ({params.row.newPeople || 0})
        </Button>
      )
    },
    {
      field: 'viewConsolidated',
      headerName: 'Decisions',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<VisibilityIcon />}
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
          VIEW ({params.row.consolidated || 0})
        </Button>
      )
    }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 300,
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading event history...
        </Typography>
      </Box>
    );
  }

  // Show empty state
  if (!events || events.length === 0) {
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
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{ mt: 2 }}
          >
            Refresh Events
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Debug Info Banner */}
      {events.length > 0 && (
        <Alert 
          severity="info" 
          icon={<InfoIcon />}
          sx={{ mb: 2, fontSize: '0.8rem', py: 0.5 }}
        >
          Showing {events.length} closed events. Click VIEW buttons to see detailed data including leader assignments.
        </Alert>
      )}

      {/* Toolbar with refresh button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="h6" fontWeight={600}>
          Event History
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {events.length} closed events
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
          rows={events}
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

      {/* Details Dialog - Now only shown if parent component doesn't handle it */}
      {!onViewDetails && !onViewNewPeople && !onViewConverts && (
        <Dialog
          open={detailsDialog.open}
          onClose={handleCloseDetails}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              boxShadow: 6,
              maxHeight: '90vh',
              ...(isSmDown && {
                margin: 2,
                maxHeight: '85vh',
                width: 'calc(100% - 32px)',
              })
            }
          }}
        >
          <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
            {getDialogTitle()}
            <Typography variant="body2" color="text.secondary">
              Total: {detailsDialog.data.length}
            </Typography>
            <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
              {detailsDialog.type === 'consolidated' 
                ? 'Showing consolidation/decision records' 
                : detailsDialog.type === 'newPeople'
                ? 'Showing new/first-time visitors'
                : 'Showing regular attendees'}
            </Alert>
          </DialogTitle>

          <DialogContent
            dividers
            sx={{
              maxHeight: isSmDown ? 600 : 700,
              overflowY: 'auto',
              p: isSmDown ? 1 : 2
            }}
          >
            <TextField
              size="small"
              placeholder="Search..."
              value={detailSearch}
              onChange={(e) => {
                setDetailSearch(e.target.value);
                setDetailPage(0);
              }}
              fullWidth
              sx={{ mb: 2, boxShadow: 1 }}
            />

            {/* MOBILE VIEW */}
            {isSmDown ? (
              <Box>
                {paginatedDetailData.map((item, idx) => (
                  <Card key={item._id || item.id || idx} variant="outlined" sx={{ mb: 1, boxShadow: 2 }}>
                    <CardContent sx={{ p: 1.5 }}>
                      {detailsDialog.type === 'consolidated' ? (
                        <>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.person_name || item.name} {item.person_surname || item.surname}
                          </Typography>
                          {item.person_email || item.email ? (
                            <Typography variant="body2" color="text.secondary">
                              {item.person_email || item.email}
                            </Typography>
                          ) : null}
                          {item.person_phone || item.phone ? (
                            <Typography variant="body2" color="text.secondary">
                              {item.person_phone || item.phone}
                            </Typography>
                          ) : null}
                          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={0.5}>
                            <Chip
                              label={item.decision_type || 'Commitment'}
                              size="small"
                              color={item.decision_type === 'recommitment' ? 'primary' : 'secondary'}
                            />
                            <Chip
                              label={`Assigned: ${item.assigned_to || 'Not assigned'}`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                          {/* LEADER FIELDS FOR CONSOLIDATIONS */}
                          <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
                            {item.leader1 && item.leader1.trim() !== "" && (
                              <Chip 
                                label={`@1: ${item.leader1}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {item.leader12 && item.leader12.trim() !== "" && (
                              <Chip 
                                label={`@12: ${item.leader12}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {item.leader144 && item.leader144.trim() !== "" && (
                              <Chip 
                                label={`@144: ${item.leader144}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                          </Stack>
                        </>
                      ) : detailsDialog.type === 'newPeople' ? (
                        <>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.name} {item.surname}
                          </Typography>
                          {item.email && (
                            <Typography variant="body2" color="text.secondary">
                              {item.email}
                            </Typography>
                          )}
                          {item.phone && (
                            <Typography variant="body2" color="text.secondary">
                              {item.phone}
                            </Typography>
                          )}
                          {item.invitedBy && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Invited by: {item.invitedBy}
                            </Typography>
                          )}
                          {/* LEADER FIELDS FOR NEW PEOPLE */}
                          <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
                            {item.leader1 && item.leader1.trim() !== "" && (
                              <Chip 
                                label={`@1: ${item.leader1}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {item.leader12 && item.leader12.trim() !== "" && (
                              <Chip 
                                label={`@12: ${item.leader12}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {item.leader144 && item.leader144.trim() !== "" && (
                              <Chip 
                                label={`@144: ${item.leader144}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {(!item.leader1 || item.leader1.trim() === "") && 
                             (!item.leader12 || item.leader12.trim() === "") && 
                             (!item.leader144 || item.leader144.trim() === "") && (
                              <Typography variant="caption" color="text.secondary">
                                No leader assignments
                              </Typography>
                            )}
                          </Stack>
                        </>
                      ) : (
                        <>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.name} {item.surname}
                          </Typography>
                          {item.email && (
                            <Typography variant="body2" color="text.secondary">
                              {item.email}
                            </Typography>
                          )}
                          {item.phone && (
                            <Typography variant="body2" color="text.secondary">
                              {item.phone}
                            </Typography>
                          )}
                          {/* LEADER FIELDS DISPLAY */}
                          <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
                            {item.leader1 && item.leader1.trim() !== "" && (
                              <Chip 
                                label={`@1: ${item.leader1}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {item.leader12 && item.leader12.trim() !== "" && (
                              <Chip 
                                label={`@12: ${item.leader12}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {item.leader144 && item.leader144.trim() !== "" && (
                              <Chip 
                                label={`@144: ${item.leader144}`} 
                                size="small" 
                                sx={{ fontSize: '0.6rem', height: 18 }} 
                              />
                            )}
                            {(!item.leader1 || item.leader1.trim() === "") && 
                             (!item.leader12 || item.leader12.trim() === "") && 
                             (!item.leader144 || item.leader144.trim() === "") && (
                              <Typography variant="caption" color="text.secondary">
                                No leader assignments
                              </Typography>
                            )}
                          </Stack>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {paginatedDetailData.length === 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    No matching data
                  </Typography>
                )}
              </Box>
            ) : (
              /* DESKTOP TABLE */
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    
                    {detailsDialog.type === 'consolidated' ? (
                      <>
                        <TableCell sx={{ fontWeight: 600 }}>Decision Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @1</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @12</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @144</TableCell>
                      </>
                    ) : detailsDialog.type === 'newPeople' ? (
                      <>
                        <TableCell sx={{ fontWeight: 600 }}>Invited By</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @1</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @12</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @144</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @1</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @12</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Leader @144</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Invited By</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedDetailData.map((item, idx) => (
                    <TableRow key={item._id || item.id || idx} hover>
                      <TableCell>{detailPage * detailRowsPerPage + idx + 1}</TableCell>
                      
                      {/* Name - handles different field names */}
                      <TableCell>
                        {detailsDialog.type === 'consolidated'
                          ? `${item.person_name || item.name || ''} ${item.person_surname || item.surname || ''}`
                          : `${item.name || ''} ${item.surname || ''}`}
                      </TableCell>
                      
                      {/* Email - handles different field names */}
                      <TableCell>
                        {detailsDialog.type === 'consolidated'
                          ? item.person_email || item.email || '—'
                          : item.email || '—'}
                      </TableCell>
                      
                      {/* Phone - handles different field names */}
                      <TableCell>
                        {detailsDialog.type === 'consolidated'
                          ? item.person_phone || item.phone || '—'
                          : item.phone || '—'}
                      </TableCell>

                      {detailsDialog.type === 'consolidated' ? (
                        <>
                          <TableCell>
                            <Chip
                              label={item.decision_type ? item.decision_type.charAt(0).toUpperCase() + item.decision_type.slice(1) : 'Commitment'}
                              size="small"
                              color={item.decision_type === 'recommitment' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>{item.assigned_to || 'Not assigned'}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Active'}
                              size="small"
                              color={item.status === 'completed' ? 'success' : 'default'}
                            />
                          </TableCell>
                          {/* LEADER FIELDS FOR CONSOLIDATIONS */}
                          <TableCell>{getLeaderDisplay(item.leader1)}</TableCell>
                          <TableCell>{getLeaderDisplay(item.leader12)}</TableCell>
                          <TableCell>{getLeaderDisplay(item.leader144)}</TableCell>
                        </>
                      ) : detailsDialog.type === 'newPeople' ? (
                        <>
                          <TableCell>{item.invitedBy || '—'}</TableCell>
                          <TableCell>{item.gender || '—'}</TableCell>
                          {/* LEADER FIELDS FOR NEW PEOPLE */}
                          <TableCell>{getLeaderDisplay(item.leader1)}</TableCell>
                          <TableCell>{getLeaderDisplay(item.leader12)}</TableCell>
                          <TableCell>{getLeaderDisplay(item.leader144)}</TableCell>
                        </>
                      ) : (
                        <>
                          {/* LEADER FIELDS FOR ATTENDEES */}
                          <TableCell>{getLeaderDisplay(item.leader1)}</TableCell>
                          <TableCell>{getLeaderDisplay(item.leader12)}</TableCell>
                          <TableCell>{getLeaderDisplay(item.leader144)}</TableCell>
                          <TableCell>{item.gender || '—'}</TableCell>
                          <TableCell>{item.invitedBy || '—'}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}

                  {paginatedDetailData.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={detailsDialog.type === 'consolidated' ? 10 : 
                                 detailsDialog.type === 'newPeople' ? 8 : 8}
                        align="center"
                      >
                        No matching data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            <Box mt={1}>
              <TablePagination
                component="div"
                count={filteredDetailData.length}
                page={detailPage}
                onPageChange={(e, newPage) => setDetailPage(newPage)}
                rowsPerPage={detailRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setDetailRowsPerPage(parseInt(e.target.value, 10));
                  setDetailPage(0);
                }}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: isSmDown ? 1 : 2 }}>
            <Button onClick={handleCloseDetails} variant="outlined" size={isSmDown ? 'small' : 'medium'}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

export default EventHistory;