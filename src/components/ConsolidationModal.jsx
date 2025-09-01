import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  TablePagination,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ConsolidationModal = ({ 
  open, 
  onClose, 
  attendeesWithStatus, 
  events, 
  currentEventId, 
  attendeesCount 
}) => {
  const [consolidationSearch, setConsolidationSearch] = useState("");
  const [consolidationPage, setConsolidationPage] = useState(0);
  const [consolidationRowsPerPage, setConsolidationRowsPerPage] = useState(10);
  const [commitmentDropdownOpen, setCommitmentDropdownOpen] = useState(false);
  const [selectedCommitmentType, setSelectedCommitmentType] = useState("");

  const theme = useTheme();
  const isXsDown = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isDarkMode = theme.palette.mode === "dark";

  // Responsive values
  const getResponsiveValue = (xs, sm, md, lg, xl) => {
    if (isXsDown) return xs;
    if (isSmDown) return sm;
    if (isMdDown) return md;
    if (isLgDown) return lg;
    return xl;
  };

  const buttonStyles = {
    backgroundColor: isDarkMode ? "white" : "black",
    color: isDarkMode ? "black" : "white",
    "&:hover": {
      backgroundColor: isDarkMode ? "#ddd" : "#222",
    },
    fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "1rem"),
    padding: getResponsiveValue("8px 12px", "10px 16px", "12px 20px", "12px 24px", "12px 24px"),
  };

  const tableSx = {
    overflowX: "auto",
    "& table": { 
      minWidth: isSmDown ? 800 : 650,
    },
    "& th, & td": {
      whiteSpace: "nowrap",
      fontSize: getResponsiveValue("0.7rem", "0.75rem", "0.8rem", "0.875rem", "0.875rem"),
      padding: getResponsiveValue("4px 8px", "6px 12px", "8px 16px", "12px 16px", "16px"),
    },
    "& th": {
      fontWeight: 600,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    }
  };

  const presentCount = attendeesWithStatus.filter(a => a.present).length;
  const presentAttendees = attendeesWithStatus.filter(a => a.present);
  
  const filteredPresentAttendees = presentAttendees.filter((a) => {
    const searchLower = consolidationSearch.toLowerCase();
    const searchFields = [
      a.name,
      a.surname,
      a.email,
      a.phone,
      a.leader12,
      a.leader144,
      a.leader1728,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchFields.includes(searchLower);
  });

  const paginatedPresentAttendees = filteredPresentAttendees.slice(
    consolidationPage * consolidationRowsPerPage,
    consolidationPage * consolidationRowsPerPage + consolidationRowsPerPage
  );

  // Mobile Card Component for Present Attendees
  const PresentAttendeeCard = ({ attendee }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1,
        '&:last-child': { mb: 0 },
        border: `1px solid ${theme.palette.success.main}`,
        backgroundColor: theme.palette.success.light + '0a',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {attendee.name} {attendee.surname}
          <Chip 
            label="Present" 
            size="small" 
            sx={{ ml: 1, fontSize: "0.7rem", height: 20 }} 
            color="success" 
          />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
          {attendee.email || "No email"}
        </Typography>
        {attendee.phone && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            {attendee.phone}
          </Typography>
        )}
        {(attendee.leader12 || attendee.leader144 || attendee.leader1728) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {attendee.leader12 && (
                <Chip label={`@12: ${attendee.leader12}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {attendee.leader144 && (
                <Chip label={`@144: ${attendee.leader144}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
              {attendee.leader1728 && (
                <Chip label={`@1728: ${attendee.leader1728}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem", height: 20 }} />
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={isSmDown}
      sx={{
        '& .MuiDialog-paper': {
          margin: isSmDown ? 0 : 3,
          width: isSmDown ? '100%' : 'auto',
          maxHeight: isSmDown ? '100%' : 'calc(100% - 48px)',
        }
      }}
    >
      <DialogTitle sx={{ fontSize: getResponsiveValue("1.1rem", "1.25rem", "1.5rem", "1.5rem", "1.5rem") }}>
        Consolidation - Present Attendees ({presentCount})
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        {/* Search and Actions */}
        <Grid container spacing={2} mb={2} alignItems="center">
          <Grid item xs={12} sm={8}>
            <TextField
              size="small"
              placeholder="Search present attendees..."
              value={consolidationSearch}
              onChange={(e) => {
                setConsolidationSearch(e.target.value);
                setConsolidationPage(0);
              }}
              fullWidth
              sx={{
                '& input': {
                  fontSize: getResponsiveValue("0.8rem", "0.85rem", "0.9rem", "1rem", "1rem")
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={() => setCommitmentDropdownOpen(!commitmentDropdownOpen)}
              fullWidth
              sx={{
                ...buttonStyles,
                position: 'relative'
              }}
            >
              Commitment
            </Button>
            {commitmentDropdownOpen && (
              <Paper
                sx={{
                  position: 'absolute',
                  zIndex: 1000,
                  mt: 1,
                  minWidth: 200,
                  boxShadow: theme.shadows[8]
                }}
              >
                <MenuItem 
                  onClick={() => {
                    setSelectedCommitmentType("first-time");
                    setCommitmentDropdownOpen(false);
                    toast.info("First Time Recommitment selected");
                  }}
                >
                  First Time Recommitment
                </MenuItem>
                <MenuItem 
                  onClick={() => {
                    setSelectedCommitmentType("recommitment");
                    setCommitmentDropdownOpen(false);
                    toast.info("Recommitment selected");
                  }}
                >
                  Recommitment
                </MenuItem>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Present Attendees Table/Cards */}
        {isSmDown ? (
          // Mobile Card View for Present Attendees
          <Box>
            {paginatedPresentAttendees.length > 0 ? (
              paginatedPresentAttendees.map((attendee) => (
                <PresentAttendeeCard key={attendee._id} attendee={attendee} />
              ))
            ) : (
              <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  {consolidationSearch ? "No matching attendees found." : "No attendees are present."}
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          // Desktop Table View for Present Attendees
          <TableContainer component={Paper} variant="outlined" sx={tableSx}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Leader @12</TableCell>
                  <TableCell>Leader @144</TableCell>
                  <TableCell>Leader @1728</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPresentAttendees.length > 0 ? (
                  paginatedPresentAttendees.map((attendee) => (
                    <TableRow 
                      key={attendee._id} 
                      hover
                      sx={{
                        backgroundColor: theme.palette.success.light + '0a',
                        '&:hover': {
                          backgroundColor: theme.palette.success.light + '15',
                        }
                      }}
                    >
                      <TableCell>
                        {attendee.name} {attendee.surname}
                      </TableCell>
                      <TableCell>{attendee.email || "-"}</TableCell>
                      <TableCell>{attendee.phone || "-"}</TableCell>
                      <TableCell>{attendee.leader12 || "-"}</TableCell>
                      <TableCell>{attendee.leader144 || "-"}</TableCell>
                      <TableCell>{attendee.leader1728 || "-"}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label="Present" 
                          size="small" 
                          color="success"
                          icon={<CheckCircleIcon />}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {consolidationSearch ? "No matching attendees found." : "No attendees are present."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination for Consolidation */}
        <TablePagination
          component="div"
          count={filteredPresentAttendees.length}
          page={consolidationPage}
          onPageChange={(event, newPage) => setConsolidationPage(newPage)}
          rowsPerPage={consolidationRowsPerPage}
          onRowsPerPageChange={(event) => {
            setConsolidationRowsPerPage(parseInt(event.target.value, 10));
            setConsolidationPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          sx={{
            mt: 2,
            '& .MuiTablePagination-toolbar': {
              fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "1rem"),
              minHeight: getResponsiveValue(48, 52, 56, 56, 56),
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: getResponsiveValue(1.5, 2, 2, 2, 2) }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Close
        </Button>
        {selectedCommitmentType && (
          <Button 
            variant="contained"
            sx={buttonStyles}
            onClick={() => {
              toast.success(`Processing ${selectedCommitmentType === 'first-time' ? 'First Time Recommitment' : 'Recommitment'} for ${presentCount} attendees`);
              setSelectedCommitmentType("");
            }}
          >
            Process {selectedCommitmentType === 'first-time' ? 'First Time' : 'Recommitment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConsolidationModal;