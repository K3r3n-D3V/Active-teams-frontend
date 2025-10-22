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

const ConsolidationModal = ({ open, onClose, onFinish, attendeesWithStatus = [], consolidatedPeople = [] }) => {
  const [recipient, setRecipient] = useState(null); 
  const [assignedTo, setAssignedTo] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [taskStage, setTaskStage] = useState(""); // ✅ Start empty to force selection
  const [loading, setLoading] = useState(false);

  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [alreadyConsolidated, setAlreadyConsolidated] = useState(false);

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
            fields: "Name,Surname,Phone,Email,Leader @1,Leader @12,Leader @144,Leader @1728,leader1,leader12,leader144,leader1728,Stage,DecisionHistory" 
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
      setTaskStage(""); // ✅ Force user to select decision type
      setRecipients([]);
      setSearchQuery("");
      setError("");
      setAlreadyConsolidated(false);
    }
  }, [open]);

  // Check if person is already consolidated
  const checkIfAlreadyConsolidated = useCallback((person) => {
    if (!person) return false;
    
    const personEmail = person.Email || person.email;
    const personName = `${person.Name || person.name} ${person.Surname || person.surname}`.trim().toLowerCase();
    
    // Check in current consolidated people list
    const isInConsolidatedList = consolidatedPeople.some(consolidated => {
      const consolidatedEmail = consolidated.email || consolidated.person_email;
      const consolidatedName = `${consolidated.name || consolidated.person_name} ${consolidated.surname || consolidated.person_surname}`.trim().toLowerCase();
      
      return (personEmail && consolidatedEmail && personEmail.toLowerCase() === consolidatedEmail.toLowerCase()) ||
             (personName === consolidatedName);
    });
    
    // Check person's stage and decision history
    const hasConsolidationStage = person.Stage === "Consolidate";
    const hasDecisionHistory = person.DecisionHistory && person.DecisionHistory.length > 0;
    
    console.log("🔍 Consolidation check for:", personName, {
      isInConsolidatedList,
      hasConsolidationStage,
      hasDecisionHistory,
      stage: person.Stage,
      decisionHistory: person.DecisionHistory
    });
    
    return isInConsolidatedList || hasConsolidationStage || hasDecisionHistory;
  }, [consolidatedPeople]);

  // Get the appropriate leader for the recipient
  const getLeaderHierarchy = (person) => {
    const leader1 = person["Leader @1"] || person.leader1;
    const leader12 = person["Leader @12"] || person.leader12;
    const leader144 = person["Leader @144"] || person.leader144;
    const leader1728 = person["Leader @1728"] || person.leader1728;

    console.log("👥 Leader hierarchy for person:", {
      name: person.Name || person.name,
      leader1,
      leader12,
      leader144,
      leader1728
    });

    // Return the most immediate leader (lowest level)
    if (leader1 && leader1.trim()) {
      console.log("✅ Assigning to Leader @1:", leader1);
      return { 
        leader: leader1, 
        level: 1,
        hasLeader: true 
      };
    } else if (leader12 && leader12.trim()) {
      console.log("✅ Assigning to Leader @12:", leader12);
      return { 
        leader: leader12, 
        level: 12,
        hasLeader: true 
      };
    } else if (leader144 && leader144.trim()) {
      console.log("✅ Assigning to Leader @144:", leader144);
      return { 
        leader: leader144, 
        level: 144,
        hasLeader: true 
      };
    } else if (leader1728 && leader1728.trim()) {
      console.log("✅ Assigning to Leader @1728:", leader1728);
      return { 
        leader: leader1728, 
        level: 1728,
        hasLeader: true 
      };
    } else {
      console.log("❌ No leader found for person");
      return { 
        leader: "No Leader Assigned", 
        level: 0,
        hasLeader: false 
      };
    }
  };

  // Update assignedTo whenever recipient changes
  useEffect(() => {
    if (recipient) {
      const leaderInfo = getLeaderHierarchy(recipient);
      setAssignedTo(leaderInfo.leader);
      
      // Check if person is already consolidated
      const isAlreadyConsolidated = checkIfAlreadyConsolidated(recipient);
      setAlreadyConsolidated(isAlreadyConsolidated);
      
      if (isAlreadyConsolidated) {
        setError("This person has already been consolidated. Please select someone else.");
      } else {
        setError("");
      }
      
      console.log("🎯 Auto-assigned to leader:", leaderInfo);
    } else {
      setAssignedTo("");
      setAlreadyConsolidated(false);
      setError("");
    }
  }, [recipient, checkIfAlreadyConsolidated]);

  // Handle task stage change
  const handleTaskStageChange = (event) => {
    setTaskStage(event.target.value);
    console.log("📝 Task stage changed to:", event.target.value);
  };

  // Submit consolidation task
  const handleFinish = async () => {
    if (!recipient) {
      setError("Please select a person for consolidation");
      return;
    }

    if (!taskStage) {
      setError("Please select a decision type");
      return;
    }

    if (alreadyConsolidated) {
      setError("This person has already been consolidated and cannot be consolidated again.");
      return;
    }

    const leaderInfo = getLeaderHierarchy(recipient);
    
    if (!leaderInfo.hasLeader) {
      setError("Cannot create consolidation task: This person has no leader assigned for follow-up");
      return;
    }

    // Double-check consolidation status
    const finalCheck = checkIfAlreadyConsolidated(recipient);
    if (finalCheck) {
      setError("This person has already been consolidated. Please select someone else.");
      return;
    }

    // Generate a unique memberID if not available
    const memberID = recipient._id || recipient.id || `consolidation-${Date.now()}`;
    
    // Map task stage to backend decision type
    const decisionType = taskStage === "First-time Commitment" ? "first_time" : "recommitment";
    
    // Prepare task data according to your EXACT backend TaskModel schema
    const taskData = {
      name: `Consolidation: ${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
      taskType: "Church - Consolidation",
      description: `Follow up with ${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname} who made a ${taskStage.toLowerCase()}`,
      followup_date: new Date().toISOString(),
      status: "Open",
      assignedfor: leaderInfo.leader, // ✅ Using the consolidatee's leader
      type: "followup",
      priority: "high",
      memberID: memberID,
      contacted_person: {
        name: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
        email: recipient.Email || recipient.email || "",
        phone: recipient.Phone || recipient.phone || ""
      },
      // Add consolidation-specific fields
      consolidation_type: taskStage,
      decision_type: decisionType, // ✅ Proper decision type mapping
      recipient_name: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
      recipient_email: recipient.Email || recipient.email || "",
      recipient_phone: recipient.Phone || recipient.phone || "",
      decision_date: new Date().toISOString().split('T')[0],
      // Add any other required fields
      taskName: `Consolidation - ${taskStage}`,
      assignedTo: leaderInfo.leader, // ✅ Also set assignedTo field
      email: recipient.Email || recipient.email || "",
      leader_level: leaderInfo.level // For tracking which level leader was assigned
    };

    console.log("📤 Sending task data to backend:", taskData);
    console.log("🎯 Decision Type:", decisionType);
    console.log("👥 Assigned To:", leaderInfo.leader);

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
        taskStage: taskData.consolidation_type,
        decisionType: decisionType,
        leaderLevel: leaderInfo.level
      });
      
      onClose();
      
      // Reset form
      setRecipient(null);
      setAssignedTo("");
      setTaskStage(""); // ✅ Reset to empty
      setAlreadyConsolidated(false);
      
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

  // Render person option with consolidation status
  const renderPersonOption = (props, option) => {
    const fullName = `${option.Name || option.name || ""} ${option.Surname || option.surname || ""}`.trim();
    const isConsolidated = checkIfAlreadyConsolidated(option);
    
    return (
      <li {...props} key={option._id || option.id}>
        <Box>
          <Typography variant="body1">
            {fullName}
            {isConsolidated && (
              <Typography 
                component="span" 
                variant="caption" 
                color="error" 
                sx={{ ml: 1 }}
              >
                (Already Consolidated)
              </Typography>
            )}
          </Typography>
          {option.Email && (
            <Typography variant="caption" color="text.secondary">
              {option.Email}
            </Typography>
          )}
        </Box>
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
          m: 2,
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

        {/* Recipient Search */}
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

        {/* Assigned To (Leader) - AUTO-SET */}
        <TextField
          label="Assigned To Leader"
          value={assignedTo}
          fullWidth
          margin="normal"
          disabled
          helperText={
            assignedTo === "No Leader Assigned" 
              ? "Warning: This person has no leader assigned for follow-up"
              : "Automatically assigned to person's immediate leader"
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

        {/* Task Stage - FIXED: Now properly changeable and required */}
        <TextField
          select
          label="Decision Type *"
          value={taskStage}
          onChange={handleTaskStageChange}
          fullWidth
          margin="normal"
          required
          error={!taskStage}
          helperText={!taskStage ? "Please select a decision type" : ""}
          sx={roundedInput}
        >
          <MenuItem value="First-time Commitment">
            First-time Commitment
          </MenuItem>
          <MenuItem value="Re-commitment">Re-commitment</MenuItem>
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

        {/* Selected Person Info */}
        {recipient && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Person:
            </Typography>
            <Typography variant="body2">
              <strong>Name:</strong> {recipient.Name || recipient.name} {recipient.Surname || recipient.surname}
            </Typography>
            {(recipient.Phone || recipient.phone) && (
              <Typography variant="body2">
                <strong>Phone:</strong> {recipient.Phone || recipient.phone}
              </Typography>
            )}
            {(recipient.Email || recipient.email) && (
              <Typography variant="body2">
                <strong>Email:</strong> {recipient.Email || recipient.email}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Assigned Leader:</strong> {assignedTo}
            </Typography>
            <Typography variant="body2">
              <strong>Decision Type:</strong> {taskStage || "Not selected"}
            </Typography>
            {alreadyConsolidated && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                <strong>⚠️ Already Consolidated:</strong> This person has already been assigned for follow-up
              </Typography>
            )}
          </Box>
        )}
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
          disabled={!recipient || !taskStage || assignedTo === "No Leader Assigned" || alreadyConsolidated}
          sx={{ minWidth: 100 }}
        >
          Assign Task
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConsolidationModal;