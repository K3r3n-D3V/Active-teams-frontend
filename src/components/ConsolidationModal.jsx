import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Box,
  Typography,
  Alert,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import dayjs from "dayjs";
import axios from "axios";
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "lodash";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

const ConsolidationModal = ({ open, onClose, onFinish, attendeesWithStatus = [] }) => {
  const [recipient, setRecipient] = useState(null); 
  const [assignedTo, setAssignedTo] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [taskStage, setTaskStage] = useState("First-time Commitment");
  const [loading, setLoading] = useState(false);

  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Enhanced debounced search with better error handling
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setRecipients([]);
        return;
      }
      
      try {
        setLoadingRecipients(true);
        setError("");
        
        const res = await axios.get(`${BASE_URL}/people/search`, {
          params: { 
            query: query.trim(),
            limit: 25,
            fields: "Name,Surname,Phone,Email,Leader @ 1728,Leader @144,Leader @12,leader1,leader12,leader144" 
          },
        });
        
        if (res.data && Array.isArray(res.data.results)) {
          setRecipients(res.data.results);
        } else if (res.data && Array.isArray(res.data)) {
          setRecipients(res.data);
        } else {
          setRecipients([]);
        }
      } catch (err) {
        console.error("Error fetching recipients:", err);
        setError("Failed to search people. Please try again.");
        setRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    }, 350),
    []
  );

  // Alternative: Search from local attendees if API fails
  const searchLocalAttendees = useCallback((query) => {
    if (!query || query.length < 2) {
      setRecipients([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = attendeesWithStatus.filter(person => {
      const searchString = `${person.name || ''} ${person.surname || ''} ${person.email || ''} ${person.phone || ''}`.toLowerCase();
      return searchString.includes(searchTerm);
    });

    setRecipients(filtered.slice(0, 25));
  }, [attendeesWithStatus]);

  // Combined search function
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    // Try API search first, fallback to local search
    if (attendeesWithStatus.length > 0) {
      searchLocalAttendees(query);
    } else {
      debouncedSearch(query);
    }
  }, [debouncedSearch, searchLocalAttendees, attendeesWithStatus.length]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setDateTime(dayjs().format("YYYY/MM/DD, HH:mm"));
      setRecipient(null);
      setAssignedTo("");
      setRecipients([]);
      setSearchQuery("");
      setError("");
    }
  }, [open]);

  // Get the appropriate leader for the recipient
  const getLeader = (person) => {
    return (
      person["Leader @ 1728"] ||
      person["Leader @144"] || 
      person["Leader @12"] ||
      person.leader144 ||
      person.leader12 ||
      person.leader1 ||
      "No Leader Assigned"
    );
  };

  // Get leader contact info if available
  const getLeaderInfo = (person) => {
    const leader = getLeader(person);
    if (leader === "No Leader Assigned") {
      return { name: leader, hasLeader: false };
    }
    return { name: leader, hasLeader: true };
  };

  // Update assignedTo whenever recipient changes
  useEffect(() => {
    if (recipient) {
      const leaderInfo = getLeaderInfo(recipient);
      setAssignedTo(leaderInfo.name);
    } else {
      setAssignedTo("");
    }
  }, [recipient]);

  // Submit consolidation task - FIXED with memberID
  const handleFinish = async () => {
    if (!recipient) return;

    const leaderInfo = getLeaderInfo(recipient);
    
    // Generate a unique memberID if not available
    const memberID = recipient._id || recipient.id || `consolidation-${Date.now()}`;
    
    // Prepare task data according to your EXACT backend TaskModel schema
    const taskData = {
      name: `Consolidation: ${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
      taskType: "Church - Consolidation",
      description: `Follow up with ${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname} who made a ${taskStage.toLowerCase()}`,
      followup_date: new Date().toISOString(),
      status: "Open",
      assignedfor: leaderInfo.name,
      type: "followup",
      priority: "high",
      memberID: memberID, // ✅ ADDED REQUIRED FIELD
      contacted_person: {
        name: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
        email: recipient.Email || recipient.email || "",
        phone: recipient.Phone || recipient.phone || ""
      },
      // Add consolidation-specific fields
      consolidation_type: taskStage,
      recipient_name: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
      recipient_email: recipient.Email || recipient.email || "",
      recipient_phone: recipient.Phone || recipient.phone || "",
      decision_date: new Date().toISOString().split('T')[0],
      // Add any other required fields
      taskName: `Consolidation - ${taskStage}`,
      assignedTo: leaderInfo.name,
      email: recipient.Email || recipient.email || ""
    };

    console.log("📤 Sending task data to backend:", taskData);

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Token available:", !!token);

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(`${BASE_URL}/tasks`, taskData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Task creation response:", response.data);

      // Call onFinish with consolidation data for service check-in
      onFinish({
        ...response.data,
        consolidatedCount: 1,
        recipientName: taskData.recipient_name,
        assignedTo: taskData.assignedfor,
        taskStage: taskData.consolidation_type
      });
      
      onClose();
      
      // Reset form
      setRecipient(null);
      setAssignedTo("");
      setTaskStage("First-time Commitment");
      
    } catch (err) {
      console.error("❌ Error creating consolidation task:", err);
      
      // Detailed error logging
      if (err.response) {
        console.error("📡 Server response error:", {
          status: err.response.status,
          data: err.response.data,
        });
        
        // Show validation errors if available
        if (err.response.data && err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            // Pydantic validation errors
            const errorMessages = err.response.data.detail.map(error => 
              `${error.loc && error.loc[1] ? error.loc[1] : 'Field'}: ${error.msg}`
            ).join(', ');
            setError(`Validation errors: ${errorMessages}`);
          } else {
            setError(`Server error: ${err.response.data.detail}`);
          }
        } else {
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        console.error("🌐 Network error:", err.request);
        setError("Network error: Could not connect to server. Please check your connection.");
      } else {
        console.error("⚡ Request setup error:", err.message);
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Try the consolidation endpoint instead (if tasks endpoint still fails)
  const handleFinishAlternative = async () => {
    if (!recipient) return;

    const leaderInfo = getLeaderInfo(recipient);
    
    // Try using the consolidation endpoint instead
    const consolidationData = {
      person_name: recipient.Name || recipient.name,
      person_surname: recipient.Surname || recipient.surname,
      person_email: recipient.Email || recipient.email || "",
      person_phone: recipient.Phone || recipient.phone || "",
      decision_type: taskStage === "First-time Commitment" ? "first_time" : "recommitment",
      decision_date: new Date().toISOString().split('T')[0],
      assigned_to: leaderInfo.name,
      event_id: "", // You might need to pass the current event ID here
      notes: `Consolidation task created for ${taskStage}`,
      leaders: [
        leaderInfo.name, // Leader @1
        "", // Leader @12 (if available)
        "", // Leader @144 (if available)
        ""  // Leader @1728 (if available)
      ]
    };

    console.log("📤 Trying consolidation endpoint with data:", consolidationData);

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(`${BASE_URL}/consolidations`, consolidationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("✅ Consolidation creation response:", response.data);

      onFinish({
        ...response.data,
        consolidatedCount: 1,
        recipientName: `${consolidationData.person_name} ${consolidationData.person_surname}`,
        assignedTo: consolidationData.assigned_to,
        taskStage: taskStage
      });
      
      onClose();
      
      setRecipient(null);
      setAssignedTo("");
      setTaskStage("First-time Commitment");
      
    } catch (err) {
      console.error("❌ Error creating consolidation:", err);
      
      if (err.response) {
        console.error("Consolidation endpoint error:", err.response.data);
        setError(`Consolidation error: ${err.response.data?.detail || err.response.data?.message || 'Unknown error'}`);
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (recipients.length > 0 && !recipient) {
        setRecipient(recipients[0]);
      }
    }
  };

  // Input styles
  const roundedInput = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "15px",
    },
  };

  // SIMPLIFIED: Render person option with only name
  const renderPersonOption = (props, option) => {
    const fullName = `${option.Name || option.name || ""} ${option.Surname || option.surname || ""}`.trim();
    return (
      <li {...props} key={option._id || option.id}>
        <Typography variant="body1">
          {fullName}
        </Typography>
      </li>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          m: 5,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" component="div">
          Consolidation Assignment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Assign follow-up task for new converts
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Task Type */}
        <TextField
          label="Task Type"
          value="Church - Consolidation"
          fullWidth
          margin="normal"
          disabled
          sx={roundedInput}
        />

        {/* Recipient Search - SIMPLIFIED */}
        <Autocomplete
          options={recipients}
          loading={loadingRecipients}
          getOptionLabel={(option) =>
            `${option.Name || option.name || ""} ${option.Surname || option.surname || ""}`.trim()
          }
          value={recipient}
          onChange={(e, newValue) => setRecipient(newValue)}
          onInputChange={(e, newInputValue) => {
            handleSearch(newInputValue);
          }}
          filterOptions={(x) => x}
          renderOption={renderPersonOption}
          noOptionsText={
            searchQuery.length < 2 
              ? "Type at least 2 characters to search..." 
              : "No people found"
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search Person *"
              margin="normal"
              fullWidth
              required
              onKeyPress={handleKeyPress}
              placeholder="Search by name..."
              helperText="Search for the person who made a decision"
              sx={roundedInput}
            />
          )}
        />

        {/* Assigned To (Leader) */}
        <TextField
          label="Assigned To Leader"
          value={assignedTo}
          fullWidth
          margin="normal"
          disabled
          helperText={
            assignedTo === "No Leader Assigned" 
              ? "Warning: This person has no leader assigned for follow-up"
              : "Automatically assigned to person's leader"
          }
          color={assignedTo === "No Leader Assigned" ? "warning" : "primary"}
          sx={roundedInput}
        />

        {/* Date & Time */}
        <TextField
          label="Due Date & Time"
          value={dateTime}
          fullWidth
          margin="normal"
          disabled
          helperText="Automatically set to current date/time"
          sx={roundedInput}
        />

        {/* Task Stage - REMOVED "General Follow-up" */}
        <TextField
          select
          label="Task Stage"
          value={taskStage}
          onChange={(e) => setTaskStage(e.target.value)}
          fullWidth
          margin="normal"
          sx={roundedInput}
        >
          <MenuItem value="First-time Commitment">
            First-time Commitment
          </MenuItem>
          <MenuItem value="Re-commitment">Re-commitment</MenuItem>
          {/* REMOVED: <MenuItem value="Follow-up">General Follow-up</MenuItem> */}
        </TextField>

        {/* Status */}
        <TextField
          label="Status"
          value="Open"
          fullWidth
          margin="normal"
          disabled
          sx={roundedInput}
        />

      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <LoadingButton
          onClick={handleFinish}
          variant="contained"
          color="primary"
          loading={loading}
          disabled={!recipient || assignedTo === "No Leader Assigned"}
          sx={{ minWidth: 100 }}
        >
          Assign Task
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConsolidationModal;