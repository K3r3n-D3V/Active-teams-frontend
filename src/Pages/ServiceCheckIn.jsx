import React, { useState, useEffect } from "react";
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
  IconButton,
  useTheme,
  useMediaQuery,
  TablePagination,
  MenuItem,
  Select,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import AddPersonDialog from "../components/AddPersonDialog";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";
import { EmojiPeople } from "@mui/icons-material"
import { Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

const BASE_URL = "http://localhost:8000";

function ServiceCheckIn() {
  const [attendees, setAttendees] = useState(() => {
    const stored = localStorage.getItem("attendees");
    return stored ? JSON.parse(stored) : [];
  });
  const [events, setEvents] = useState(() => {
    const stored = localStorage.getItem("events");
    return stored ? JSON.parse(stored) : [];
  });
  const [currentEventId, setCurrentEventId] = useState(
    localStorage.getItem("currentEventId") || ""
  );
  
  // Store check-ins per event: { eventId: [personId, personId, ...] }
  const [eventCheckIns, setEventCheckIns] = useState(() => {
    const stored = localStorage.getItem("eventCheckIns");
    return stored ? JSON.parse(stored) : {};
  });
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [firstTimeAddedIds, setFirstTimeAddedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null); // null = add mode

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    dob: "",
    homeAddress: "",
    invitedBy: "",
    email: "",
    phone: "",
    gender: "",
    leader12: "",
    leader144: "",
    leader1728: "",
  });

const handleEditClick = (person) => {
  setEditingPerson(person);
  setFormData({
    name: person.name || "",
    surname: person.surname || "",
    dob: person.dob || "",
    homeAddress: person.homeAddress || "",
    email: person.email || "",
    phone: person.phone || "",
    gender: person.gender || "",
    invitedBy: person.invitedBy || "",
    leader12: person.leader12 || "",
    leader144: person.leader144 || "",
    leader1728: person.leader1728 || ""
  });
  setOpenDialog(true);
};

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

  const containerPadding = getResponsiveValue(1, 2, 3, 4, 4);
  const titleVariant = getResponsiveValue("subtitle1", "h6", "h5", "h4", "h4");
  const cardSpacing = getResponsiveValue(1, 2, 2, 3, 3);

  // Persist attendees to localStorage
  useEffect(() => {
    localStorage.setItem("attendees", JSON.stringify(attendees));
  }, [attendees]);

  // Persist events to localStorage
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  // Persist current event to localStorage
  useEffect(() => {
    localStorage.setItem("currentEventId", currentEventId);
  }, [currentEventId]);

  // Persist event check-ins to localStorage
  useEffect(() => {
    localStorage.setItem("eventCheckIns", JSON.stringify(eventCheckIns));
  }, [eventCheckIns]);

  // Function to get attendees with current event's check-in status
  const getAttendeesWithPresentStatus = () => {
    const currentEventCheckIns = eventCheckIns[currentEventId] || [];
    return attendees.map(attendee => ({
      ...attendee,
      present: currentEventCheckIns.includes(attendee._id)
    }));
  };

  const toArray = (resData) =>
    Array.isArray(resData)
      ? resData
      : Array.isArray(resData?.results)
      ? resData.results
      : Array.isArray(resData?.events)
      ? resData.events
      : [];

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/events`);
        const raw = toArray(res.data);
        const normalized = raw.map((e) => ({
          id: e._id || e.id || e.eventId,
          eventName: e.eventName || e.name || e.title || "Untitled Event",
        }));
        setEvents(normalized);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.detail || "Failed to fetch events");
      }
    };
    fetchEvents();
  }, []);

  // Fetch all people on component mount
  useEffect(() => {
    const fetchAllPeople = async () => {
      try {
        let allPeople = [];
        let localPage = 1;
        const perPage = 200;
        let total = Infinity;

        while (allPeople.length < total) {
          const res = await axios.get(
            `${BASE_URL}/people?page=${localPage}&perPage=${perPage}`
          );
          console.log("people>>>>>>>", res.data);
          const results = toArray(res.data);
          const peoplePage = results.map((p) => ({
            _id: p._id || p.id || `${p.Email || p.Name || ""}-${localPage}`,
            name: p.Name || p.name || "",
            surname: p.Surname || p.surname || "",
            email: p.Email || p.email || "",
            phone: p.Number || p.phone || "",
            leader12: p["Leader @12"] || p.leader12 || "",
            leader144: p["Leader @144"] || p.leader144 || "",
            leader1728: p["Leader @ 1728"] || p.leader1728 || "",
          }));

          allPeople = allPeople.concat(peoplePage);

          const apiTotal =
            typeof res.data?.total === "number" ? res.data.total : allPeople.length;
          total = Math.max(apiTotal, allPeople.length);

          if (results.length === 0) break;
          localPage += 1;
        }

        setAttendees(allPeople);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.detail || error.message);
      }
    };

    fetchAllPeople();
  }, []);

  
  const handleAddClick = () => {
    setEditingPerson(null); // Reset to Add mode
    setFormData(initialFormState);
    setOpenDialog(true);
  };

  // Updated handler for when a new person is successfully created
//   const handlePersonSave = (responseData) => {
//   console.log("Person save response:", responseData);

//   const newPersonData = responseData.person || responseData;
//   const newPersonId = responseData.id || responseData._id || newPersonData._id;

//   const newPerson = {
//     _id: newPersonId,
//     name: newPersonData.Name || formData.name,
//     surname: newPersonData.Surname || formData.surname,
//     email: newPersonData.Email || formData.email,
//     phone: newPersonData.Phone || newPersonData.Number || formData.phone,
//     leader12: newPersonData["Leader @12"] || formData.leader12 || "",
//     leader144: newPersonData["Leader @144"] || formData.leader144 || "",
//     leader1728: newPersonData["Leader @ 1728"] || formData.leader1728 || "",
//   };

//   setAttendees((prevAttendees) => {
//     const exists = prevAttendees.some(att => att._id === newPersonId);

//     if (exists) {
//       // EDIT MODE: replace existing person in the list
//       return prevAttendees.map(att => att._id === newPersonId ? newPerson : att);
//     } else {
//       // ADD MODE: add new person on top
//       // Add "first time" flag here only for new entries
//       newPerson.isNew = true;
//       return [newPerson, ...prevAttendees];
//     }
//   });

//   if (!prevAttendees.some(att => att._id === newPersonId)) {
//     // For new additions, track first time IDs and toast
//     setFirstTimeAddedIds((prev) => [...prev, newPersonId]);
//     setTimeout(() => {
//       setFirstTimeAddedIds((prev) => prev.filter(id => id !== newPersonId));
//     }, 10000);

//     toast.success(`${newPerson.name} ${newPerson.surname} added successfully!`);
//     setPage(0);
//   } else {
//     toast.success(`${newPerson.name} ${newPerson.surname} updated successfully!`);
//   }
// };
const handlePersonSave = (responseData) => {
  console.log("Person save response:", responseData);

  const newPersonData = responseData.person || responseData;
  const newPersonId = responseData.id || responseData._id || newPersonData._id;

  const newPerson = {
    _id: newPersonId,
    name: newPersonData.Name || formData.name,
    surname: newPersonData.Surname || formData.surname,
    email: newPersonData.Email || formData.email,
    phone: newPersonData.Phone || newPersonData.Number || formData.phone,
    leader12: newPersonData["Leader @12"] || formData.leader12 || "",
    leader144: newPersonData["Leader @144"] || formData.leader144 || "",
    leader1728: newPersonData["Leader @ 1728"] || formData.leader1728 || "",
  };

  let isNew = false;

  setAttendees((prevAttendees) => {
    const exists = prevAttendees.some(att => att._id === newPersonId);

    if (exists) {
      // EDIT MODE: replace existing person in the list
      return prevAttendees.map(att => att._id === newPersonId ? newPerson : att);
    } else {
      // ADD MODE: add new person on top
      isNew = true;
      newPerson.isNew = true; // mark first time
      return [newPerson, ...prevAttendees];
    }
  });

  if (isNew) {
    setFirstTimeAddedIds((prev) => [...prev, newPersonId]);
    setPage(0);
    toast.success(`${newPerson.name} ${newPerson.surname} added successfully!`);
    setTimeout(() => {
      setFirstTimeAddedIds((prev) => prev.filter(id => id !== newPersonId));
    }, 10000);
  } else {
    toast.success(`${newPerson.name} ${newPerson.surname} updated successfully!`);
  }
};

  // Get attendees with present status for current event
  const attendeesWithStatus = getAttendeesWithPresentStatus();

  const lc = search.toLowerCase();
  const filteredAttendees = attendeesWithStatus.filter((a) => {
    const bag = [
      a.name,
      a.surname,
      a.email,
      a.phone,
      a.leader12,
      a.leader144,
      a.leader1728,
      firstTimeAddedIds.includes(a._id) ? "first time" : "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return bag.includes(lc);
  });

  const paginatedAttendees = filteredAttendees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const presentCount = attendeesWithStatus.filter((a) => a.present).length;
  const attendeesCount = attendees.length;

  const buttonStyles = {
    backgroundColor: isDarkMode ? "white" : "black",
    color: isDarkMode ? "black" : "white",
    "&:hover": {
      backgroundColor: isDarkMode ? "#ddd" : "#222",
    },
    fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "1rem"),
    padding: getResponsiveValue("8px 12px", "10px 16px", "12px 20px", "12px 24px", "12px 24px"),
  };

  const handleToggleCheckIn = async (attendee) => {
    if (!currentEventId) {
      toast.error("Please select an event");
      return;
    }

    try {
      const isCurrentlyPresent = attendee.present;
      
      if (!isCurrentlyPresent) {
        // Check in
        const res = await axios.post(`${BASE_URL}/checkin`, {
          event_id: currentEventId,
          name: attendee.name,
        });
        toast.success(res.data?.message || "Checked in");
        
        // Add to event check-ins
        setEventCheckIns(prev => ({
          ...prev,
          [currentEventId]: [...(prev[currentEventId] || []), attendee._id]
        }));
      } else {
        // Check out
        const res = await axios.post(`${BASE_URL}/uncapture`, {
          event_id: currentEventId,
          name: attendee.name,
        });
        toast.info(res.data?.message || "Uncaptured");
        
        // Remove from event check-ins
        setEventCheckIns(prev => ({
          ...prev,
          [currentEventId]: (prev[currentEventId] || []).filter(id => id !== attendee._id)
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  // Load existing check-ins when event changes
  useEffect(() => {
    const loadEventCheckIns = async () => {
      if (!currentEventId) return;
      
      try {
        // Try to fetch existing check-ins for this event from the server
        const res = await axios.get(`${BASE_URL}/events/${currentEventId}/checkins`);
        const checkedInPeople = toArray(res.data);
        
        // Extract person IDs from the response
        const checkedInIds = checkedInPeople
          .map(person => {
            // Try to match by name if no direct ID match
            const matchedAttendee = attendees.find(a => 
              a.name === (person.name || person.Name) || 
              a._id === (person._id || person.id)
            );
            return matchedAttendee?._id;
          })
          .filter(Boolean);
        
        if (checkedInIds.length > 0) {
          setEventCheckIns(prev => ({
            ...prev,
            [currentEventId]: checkedInIds
          }));
        }
      } catch (err) {
        console.log("Could not fetch existing check-ins, using local state");
        // If API call fails, we'll rely on the localStorage state
      }
    };

    if (currentEventId && attendees.length > 0) {
      loadEventCheckIns();
    }
  }, [currentEventId, attendees]);

  // Mobile Card Component for better mobile experience
  const AttendeeCard = ({ attendee }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 1,
        '&:last-child': { mb: 0 },
        // Highlight new additions
        ...(firstTimeAddedIds.includes(attendee._id) && {
          border: `2px solid ${theme.palette.success.main}`,
          backgroundColor: theme.palette.success.light + '0a',
        })
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {attendee.name} {attendee.surname}
              {firstTimeAddedIds.includes(attendee._id) && (
                <Chip 
                  label="First Time" 
                  size="small" 
                  sx={{ ml: 1, fontSize: "0.7rem", height: 20 }} 
                  color="success" 
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
              {attendee.email || "No email"}
            </Typography>
            {attendee.phone && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                {attendee.phone}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => handleToggleCheckIn(attendee)}
            color="success"
            disabled={!currentEventId}
            size="small"
            title={currentEventId ? "Toggle present" : "Select an event first"}
          >
            {attendee.present ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
          </IconButton>
        </Box>
        
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

  return (
    <Box 
      p={containerPadding} 
      sx={{ 
        maxWidth: "1400px", 
        margin: "0 auto", 
        mt: getResponsiveValue(2, 3, 4, 5, 5),
        minHeight: "100vh"
      }}
    >
      <ToastContainer 
        position={isSmDown ? "bottom-center" : "top-right"}
        autoClose={3000}
        hideProgressBar={isSmDown}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{
          fontSize: getResponsiveValue("0.8rem", "0.85rem", "0.9rem", "1rem", "1rem")
        }}
      />
      
      <Typography
        variant={titleVariant}
        fontWeight={700}
        gutterBottom
        textAlign="center"
        sx={{ mb: cardSpacing }}
      >
        Service Check-In
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={cardSpacing} mb={cardSpacing}>
        <Grid item xs={6}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3), 
              textAlign: "center", 
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: theme.shadows[2],
                transform: "translateY(-1px)"
              }
            }}
            onClick={() => setModalOpen(true)}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <GroupIcon color="primary" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography 
                variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} 
                fontWeight={600}
                color="primary"
              >
                {presentCount}
              </Typography>
            </Stack>
            <Typography 
              variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")}
              color="text.secondary"
            >
              Present
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: getResponsiveValue(1.5, 2, 2.5, 3, 3), 
              textAlign: "center",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: theme.shadows[1],
              }
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
              <PersonIcon color="action" sx={{ fontSize: getResponsiveValue(20, 24, 28, 32, 32) }} />
              <Typography 
                variant={getResponsiveValue("h6", "h5", "h4", "h4", "h3")} 
                fontWeight={600}
              >
                {attendeesCount}
              </Typography>
            </Stack>
            <Typography 
              variant={getResponsiveValue("caption", "body2", "body2", "body1", "body1")}
              color="text.secondary"
            >
              Total
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Controls */}
      <Grid container spacing={cardSpacing} mb={cardSpacing} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <Select
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
            value={currentEventId}
            onChange={(e) => setCurrentEventId(e.target.value)}
            displayEmpty
            fullWidth
            sx={{
              fontSize: getResponsiveValue("0.8rem", "0.85rem", "0.9rem", "1rem", "1rem")
            }}
          >
            <MenuItem value="">Select Event</MenuItem>
            {events.map((ev) => (
              <MenuItem key={ev.id} value={ev.id}>
                {ev.eventName}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} md={5}>
          <TextField
            size={getResponsiveValue("small", "small", "medium", "medium", "medium")}
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            fullWidth
            sx={{
              '& input': {
                fontSize: getResponsiveValue("0.8rem", "0.85rem", "0.9rem", "1rem", "1rem")
              }
            }}
          />
        </Grid>
        
       
<Grid item xs={12} md={3}>
  <Tooltip title="Add Person">
    <EmojiPeople
      onClick={() => setOpenDialog(true)}
      sx={{
        cursor: 'pointer',
        fontSize: 36, // size of the icon, adjust as needed
        color:  isDarkMode ? "white" : "black",
        '&:hover': {
          color: 'primary.dark',
        },
      }}
    />
  </Tooltip>
</Grid>

<Grid item xs={12} md={3}>
  <Tooltip title="Add Person">
    <PersonAddIcon
      onClick={() => setOpenDialog(true)}
      sx={{
        cursor: 'pointer',
        fontSize: 36, // size of the icon, adjust as needed
        color:  isDarkMode ? "white" : "black",
        '&:hover': {
          color: 'primary.dark',
        },
      }}
    />
  </Tooltip>
</Grid>
</Grid>

      {/* Table/Cards */}
      {isSmDown ? (
        // Mobile Card View
        <Box>
          {paginatedAttendees.length > 0 ? (
            paginatedAttendees.map((attendee) => (
              <AttendeeCard key={attendee._id} attendee={attendee} />
            ))
          ) : (
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No attendees found.
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        // Desktop Table View
        <TableContainer component={Paper} variant="outlined" sx={tableSx}>
          <Table size={getResponsiveValue("small", "small", "medium", "medium", "medium")} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                {/* <TableCell>Email</TableCell> */}
                <TableCell>Phone</TableCell>
                <TableCell>Leader @12</TableCell>
                <TableCell>Leader @144</TableCell>
                <TableCell>Leader @1728</TableCell>
                <TableCell align="center">Present</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAttendees.length > 0 ? (
                paginatedAttendees.map((attendee) => (
                  <TableRow 
                    key={attendee._id} 
                    hover
                    sx={{
                      // Highlight new additions
                      ...(firstTimeAddedIds.includes(attendee._id) && {
                        backgroundColor: theme.palette.success.light + '0a',
                        '&:hover': {
                          backgroundColor: theme.palette.success.light + '15',
                        }
                      })
                    }}
                  >
                    <TableCell>
                      {attendee.name} {attendee.surname}
                      {firstTimeAddedIds.includes(attendee._id) && (
                        <Chip 
                          label="First Time" 
                          size="small" 
                          sx={{ ml: 1, fontSize: "0.7rem", height: 20 }} 
                          color="success" 
                        />
                      )}
                    </TableCell>
                    {/* <TableCell>{attendee.email || "-"}</TableCell> */}
                    <TableCell>{attendee.phone || "-"}</TableCell>
                    <TableCell>{attendee.leader12 || "-"}</TableCell>
                    <TableCell>{attendee.leader144 || "-"}</TableCell>
                    <TableCell>{attendee.leader1728 || "-"}</TableCell>
                    <TableCell align="center">
                        <IconButton
    onClick={() => handleEditClick(attendee)}
    color="primary"
    size="small"
    title="Edit person"
    sx={{ ml: 1 }}
  >
    <EditIcon />
  </IconButton>
                      <IconButton
                        onClick={() => handleToggleCheckIn(attendee)}
                        color="success"
                        disabled={!currentEventId}
                        size="small"
                        title={currentEventId ? "Toggle present" : "Select an event first"}
                      >
                        {attendee.present ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No attendees found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredAttendees.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={getResponsiveValue([5, 10], [5, 10, 20], [5, 10, 20, 50], [5, 10, 20, 50], [5, 10, 20, 50])}
        sx={{
          mt: 2,
          '& .MuiTablePagination-toolbar': {
            fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "1rem"),
            minHeight: getResponsiveValue(48, 52, 56, 56, 56),
          },
          '& .MuiTablePagination-select': {
            fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "1rem"),
          },
          '& .MuiTablePagination-displayedRows': {
            fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "1rem"),
          }
        }}
      />

      <AddPersonDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handlePersonSave}
        formData={formData}
        setFormData={setFormData}
        isEdit={Boolean(editingPerson)} 
        personId={editingPerson?._id || null}
      />

      {/* Attendees Present Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
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
          Attendees Present ({presentCount})
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2, fontSize: getResponsiveValue("0.9rem", "1rem", "1rem", "1rem", "1rem") }}>
            Total Present: {presentCount}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {attendeesWithStatus
              .filter((a) => a.present)
              .map((a) => (
                <Box 
                  component="li" 
                  key={a._id} 
                  sx={{ 
                    mb: 1, 
                    fontSize: getResponsiveValue("0.85rem", "0.9rem", "1rem", "1rem", "1rem"),
                    listStyle: "disc"
                  }}
                >
                  {a.name} {a.surname}
                  {a.email && (
                    <Typography 
                      component="span" 
                      color="text.secondary" 
                      sx={{ 
                        ml: 1, 
                        fontSize: getResponsiveValue("0.75rem", "0.8rem", "0.875rem", "0.875rem", "0.875rem") 
                      }}
                    >
                      ({a.email})
                    </Typography>
                  )}
                </Box>
              ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: getResponsiveValue(1.5, 2, 2, 2, 2) }}>
          <Button 
            onClick={() => setModalOpen(false)}
            variant="contained"
            sx={buttonStyles}
            fullWidth={isSmDown}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ServiceCheckIn;