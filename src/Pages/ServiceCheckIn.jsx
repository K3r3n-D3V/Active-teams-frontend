import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  useTheme,
  useMediaQuery,
  TablePagination,
} from "@mui/material";
import AddPersonDialog from "../components/AddPersonDialog";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ServiceCheckIn() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    dob: "",
    email: "",
    homeAddress: "",
    phone: "",
    invitedBy: "",
    gender: "",
  });

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const isDarkMode = theme.palette.mode === "dark";

  // Fetch all events on mount
  useEffect(() => {
    fetch("/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0].id);
      })
      .catch(() => toast.error("Failed to load events"));
  }, []);

  // Fetch attendees whenever selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`/api/events/${selectedEventId}/attendees`)
      .then((res) => res.json())
      .then(setAttendees)
      .catch(() => toast.error("Failed to load attendees"));
  }, [selectedEventId]);

  // Toggle present status (update backend & state)
  const handlePresentToggle = (attendeeId, currentPresent) => {
    fetch(`/api/attendees/${attendeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ present: !currentPresent }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update attendance");
        setAttendees((prev) =>
          prev.map((a) =>
            a.id === attendeeId ? { ...a, present: !currentPresent } : a
          )
        );
        toast.success("Attendance updated");
      })
      .catch(() => toast.error("Failed to update attendance"));
  };

  // Add new person and associate with current event
  const handleSaveDetails = () => {
    return new Promise((resolve, reject) => {
      if (!formData.name || !formData.email) {
        reject(new Error("Name and Email are required"));
        return;
      }
      if (!selectedEventId) {
        reject(new Error("Select an event first"));
        return;
      }

      const newPerson = {
        name: `${formData.name} ${formData.surname}`.trim(),
        email: formData.email,
        phone: formData.phone,
        leader: "New",
        present: false,
        firstTime: true,
        eventId: selectedEventId,
      };

      fetch("/api/attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPerson),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to add attendee");
          return res.json();
        })
        .then((addedAttendee) => {
          setAttendees((prev) => [...prev, addedAttendee]);
          setFormData({
            name: "",
            surname: "",
            dob: "",
            email: "",
            homeAddress: "",
            phone: "",
            invitedBy: "",
            gender: "",
          });
          setOpenDialog(false);
          toast.success("Person added");
          resolve();
        })
        .catch((err) => {
          toast.error(err.message);
          reject(err);
        });
    });
  };

  // Filter and paginate attendees
  const filteredAttendees = attendees.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedAttendees = filteredAttendees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const presentCount = attendees.filter((a) => a.present).length;
  const attendeesCount = attendees.length;

  const buttonStyles = {
    backgroundColor: isDarkMode ? "white" : "black",
    color: isDarkMode ? "black" : "white",
    "&:hover": {
      backgroundColor: isDarkMode ? "#ddd" : "#222",
    },
  };

  return (
    <Box p={2} maxWidth="100%" sx={{ maxWidth: 900, margin: "auto" }}>
      <ToastContainer />
      <Typography
        variant={isSmDown ? "h6" : "h5"}
        fontWeight={700}
        gutterBottom
        sx={{ textAlign: "center" }}
      >
        Service Check-In
      </Typography>

      <Grid container spacing={1.5} mb={3}>
        <Grid item xs={6} sm={6} sx={{ width: "40%" }}>
          <Paper
            variant="outlined"
            sx={{ p: 1, textAlign: "center", fontWeight: "bold" }}
          >
            {presentCount}
            <Typography variant="body2">Attendees Present</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={6} sx={{ width: "40%" }}>
          <Paper
            variant="outlined"
            sx={{ p: 1, textAlign: "center", fontWeight: "bold" }}
          >
            {attendeesCount}
            <Typography variant="body2">Total Attendees</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center" mb={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel id="service-label">Event</InputLabel>
            <Select
              labelId="service-label"
              value={selectedEventId || ""}
              label="Event"
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={2}>
          <Button
            variant="contained"
            fullWidth
            sx={buttonStyles}
            onClick={() => setOpenDialog(true)}
            disabled={!selectedEventId}
          >
            Add Person
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small" aria-label="service check-in table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5, fontSize: "0.8rem" }}>Name</TableCell>
              <TableCell sx={{ py: 0.5, fontSize: "0.8rem" }}>Email</TableCell>
              <TableCell align="center" sx={{ py: 0.5, fontSize: "0.8rem" }}>
                Absent/Present
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAttendees.map((attendee) => (
              <TableRow
                key={attendee.id}
                sx={{
                  backgroundColor: attendee.firstTime
                    ? "rgba(0,0,255,0.05)"
                    : "inherit",
                  "& td": { py: 0.5, fontSize: "0.8rem" },
                }}
              >
                <TableCell>
                  <Typography fontWeight={600} fontSize="0.8rem">
                    {attendee.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {attendee.phone}
                  </Typography>
                  <Box mt={0.3}>
                    <Chip
                      label={`Leader ${attendee.leader || ""}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        mr: 1,
                      }}
                    />
                    {attendee.firstTime && (
                      <Chip
                        label="First Time"
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 600, fontSize: "0.65rem" }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ wordBreak: "break-word", maxWidth: 150 }}>
                  {attendee.email}
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={attendee.present}
                    onChange={() =>
                      handlePresentToggle(attendee.id, attendee.present)
                    }
                    color="success"
                    icon={
                      <Box
                        sx={{
                          borderRadius: "50%",
                          border: "1.5px solid #c4c4c4",
                          width: 24,
                          height: 24,
                        }}
                      />
                    }
                    checkedIcon={
                      <Box
                        sx={{
                          borderRadius: "50%",
                          border: "1.5px solid #3cc13c",
                          width: 24,
                          height: 24,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          color: "#3cc13c",
                        }}
                      >
                        ✓
                      </Box>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
            {paginatedAttendees.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 2 }}>
                  No attendees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
        rowsPerPageOptions={[5, 10, 20, 50, 100]}
        labelRowsPerPage="Rows per page:"
      />

      <AddPersonDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveDetails}
        formData={formData}
        setFormData={setFormData}
      />

      <Box mt={2} textAlign="right">
        <Button variant="contained" size="small" sx={{ ...buttonStyles, minWidth: 80 }}>
          Save
        </Button>
      </Box>
    </Box>
  );
}
