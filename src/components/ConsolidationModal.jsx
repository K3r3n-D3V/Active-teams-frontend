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

const ConsolidationModal = ({ open, onClose, onFinish, attendeesWithStatus = [], consolidatedPeople = [], currentEventId }) => {
  const [recipient, setRecipient] = useState(null); 
  const [assignedTo, setAssignedTo] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [taskStage, setTaskStage] = useState("");
  const [loading, setLoading] = useState(false);

  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [alreadyConsolidated, setAlreadyConsolidated] = useState(false);

  const decisionTypes = [
    "Commitment",
    "Recommitment"
  ];

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

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (attendeesWithStatus.length > 0) {
      searchLocalAttendees(query);
    } else {
      debouncedSearch(query);
    }
  }, [debouncedSearch, searchLocalAttendees, attendeesWithStatus.length]);

  useEffect(() => {
    if (open) {
      setDateTime(dayjs().format("YYYY/MM/DD, HH:mm"));
      setRecipient(null);
      setAssignedTo("");
      setTaskStage("");
      setRecipients([]);
      setSearchQuery("");
      setError("");
      setAlreadyConsolidated(false);
    }
  }, [open]);

  const checkIfAlreadyConsolidated = useCallback((person) => {
    if (!person) return false;
    
    const personEmail = person.Email || person.email;
    const personName = `${person.Name || person.name} ${person.Surname || person.surname}`.trim().toLowerCase();
    
    const isInConsolidatedList = consolidatedPeople.some(consolidated => {
      const consolidatedEmail = consolidated.email || consolidated.person_email;
      const consolidatedName = `${consolidated.name || consolidated.person_name} ${consolidated.surname || consolidated.person_surname}`.trim().toLowerCase();
      
      return (personEmail && consolidatedEmail && personEmail.toLowerCase() === consolidatedEmail.toLowerCase()) ||
             (personName === consolidatedName);
    });
    
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

  const getHighestAvailableLeader = (person) => {
    const leader1 = person["Leader @1"] || person.leader1;
    const leader12 = person["Leader @12"] || person.leader12;
    const leader144 = person["Leader @144"] || person.leader144;
    const leader1728 = person["Leader @1728"] || person.leader1728;

    console.log("👥 Person's leader relationships:", {
      leader1,
      leader12, 
      leader144,
      leader1728
    });

    if (leader1728 && leader1728.trim()) {
      console.log("✅ Assigning to highest leader: Leader @1728:", leader1728);
      return { 
        leader: leader1728, 
        level: 1728,
        hasLeader: true
      };
    } else if (leader144 && leader144.trim()) {
      console.log("✅ Assigning to highest leader: Leader @144:", leader144);
      return { 
        leader: leader144, 
        level: 144,
        hasLeader: true
      };
    } else if (leader12 && leader12.trim()) {
      console.log("✅ Assigning to highest leader: Leader @12:", leader12);
      return { 
        leader: leader12, 
        level: 12,
        hasLeader: true
      };
    } else if (leader1 && leader1.trim()) {
      console.log("✅ Assigning to highest leader: Leader @1:", leader1);
      return { 
        leader: leader1, 
        level: 1,
        hasLeader: true
      };
    } else {
      console.log("❌ No leaders found for person");
      return { 
        leader: "No Leader Assigned", 
        level: 0,
        hasLeader: false 
      };
    }
  };

  useEffect(() => {
    if (recipient) {
      const leaderInfo = getHighestAvailableLeader(recipient);
      setAssignedTo(leaderInfo.leader);
      
      const isAlreadyConsolidated = checkIfAlreadyConsolidated(recipient);
      setAlreadyConsolidated(isAlreadyConsolidated);
      
      if (isAlreadyConsolidated) {
        setError("This person has already been consolidated. Please select someone else.");
      } else {
        setError("");
      }
      
      console.log("🎯 Auto-assigned to highest leader:", leaderInfo);
    } else {
      setAssignedTo("");
      setAlreadyConsolidated(false);
      setError("");
    }
  }, [recipient, checkIfAlreadyConsolidated]);

  const handleTaskStageChange = (event) => {
    setTaskStage(event.target.value);
    console.log("📝 Decision type changed to:", event.target.value);
  };

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

  const leaderInfo = getHighestAvailableLeader(recipient);
  
  if (!leaderInfo.hasLeader) {
    setError("Cannot create consolidation task: No leader available for assignment");
    return;
  }

  const finalCheck = checkIfAlreadyConsolidated(recipient);
  if (finalCheck) {
    setError("This person has already been consolidated. Please select someone else.");
    return;
  }

  const decisionType = taskStage.toLowerCase() === 'recommitment' ? 'recommitment' : 'first_time';
  
  // Get leader's email from the cached people data
  const leaderEmail = await findLeaderEmail(leaderInfo.leader);
  
  const consolidationData = {
    person_name: recipient.Name || recipient.name,
    person_surname: recipient.Surname || recipient.surname,
    person_email: recipient.Email || recipient.email || "",
    person_phone: recipient.Phone || recipient.phone || "",
    decision_type: decisionType,
    decision_date: new Date().toISOString().split('T')[0],
    assigned_to: leaderInfo.leader,
    assigned_to_email: leaderEmail, // Add leader's email
    event_id: currentEventId,
    leaders: [
      recipient["Leader @1"] || recipient.leader1 || "",
      recipient["Leader @12"] || recipient.leader12 || "",
      recipient["Leader @144"] || recipient.leader144 || "",
      recipient["Leader @1728"] || recipient.leader1728 || ""
    ]
  };

  console.log("📤 Sending consolidation data to backend:", consolidationData);
  console.log("👥 Leader assignment:", {
    leader: leaderInfo.leader,
    email: leaderEmail,
    level: leaderInfo.level
  });

  setLoading(true);

  try {
    const token = localStorage.getItem("token");
    console.log("🔑 Token available:", !!token);

    if (!token) {
      throw new Error("No authentication token found");
    }

    // Create consolidation record
    const response = await axios.post(`${BASE_URL}/consolidations`, consolidationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("✅ Consolidation creation response:", response.data);

    onFinish({
      ...response.data,
      recipientName: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
      assignedTo: leaderInfo.leader,
      taskStage: taskStage,
      decisionType: decisionType,
      leaderLevel: leaderInfo.level,
      task_id: response.data.task_id,
      recipient_email: recipient.Email || recipient.email || "",
      recipient_phone: recipient.Phone || recipient.phone || "",
      leader_email: leaderEmail
    });
    
    onClose();
    
    setRecipient(null);
    setAssignedTo("");
    setTaskStage("");
    setAlreadyConsolidated(false);
    
  } catch (err) {
    console.error("❌ Error creating consolidation:", err);
    
    if (err.response) {
      console.error("📡 Server response error:", {
        status: err.response.status,
        data: err.response.data,
      });
      
      if (err.response.data && err.response.data.detail) {
        setError(`Server error: ${err.response.data.detail}`);
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

// Helper function to find leader's email
const findLeaderEmail = async (leaderName) => {
  if (!leaderName) return "";
  
  try {
    // First try to search in the cached people data
    const cachedLeader = people_cache.data.find(person => 
      person.FullName?.toLowerCase() === leaderName.toLowerCase() ||
      person.Name?.toLowerCase() === leaderName.toLowerCase()
    );
    
    if (cachedLeader?.Email) {
      console.log(`✅ Found leader email in cache: ${cachedLeader.Email}`);
      return cachedLeader.Email;
    }
    
    // If not found in cache, try API search
    const token = localStorage.getItem("token");
    const searchResponse = await axios.get(`${BASE_URL}/people/search`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        query: leaderName,
        limit: 5
      }
    });
    
    if (searchResponse.data?.results?.length > 0) {
      const foundLeader = searchResponse.data.results.find(person => 
        person.Name?.toLowerCase() === leaderName.toLowerCase() ||
        person.FullName?.toLowerCase() === leaderName.toLowerCase()
      );
      
      if (foundLeader?.Email) {
        console.log(`✅ Found leader email via API: ${foundLeader.Email}`);
        return foundLeader.Email;
      }
    }
    
    console.log(`⚠️ Could not find email for leader: ${leaderName}`);
    return "";
    
  } catch (error) {
    console.error("Error searching for leader email:", error);
    return "";
  }
};

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (recipients.length > 0 && !recipient) {
        setRecipient(recipients[0]);
      }
    }
  };

  const roundedInput = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "15px",
    },
  };

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

        <TextField
          label="Task Type"
          value="Church - Consolidation"
          fullWidth
          margin="normal"
          disabled
          sx={roundedInput}
        />

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

        <TextField
          label="Assigned To Leader"
          value={assignedTo}
          fullWidth
          margin="normal"
          disabled
          helperText={
            assignedTo === "No Leader Assigned"
              ? "Warning: No leader available for assignment"
              : "Automatically assigned to person's highest level leader"
          }
          color={assignedTo === "No Leader Assigned" ? "warning" : "primary"}
          sx={roundedInput}
        />

        <TextField
          label="Due Date & Time"
          value={dateTime}
          fullWidth
          margin="normal"
          disabled
          helperText="Automatically set to current date/time"
          sx={roundedInput}
        />

        <TextField
          select
          label="Decision Type *"
          value={taskStage}
          onChange={handleTaskStageChange}
          fullWidth
          margin="normal"
          required
          error={!taskStage}
          helperText={!taskStage ? "Please select the decision made" : "Select the type of decision the person made"}
          sx={roundedInput}
        >
          {decisionTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

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
          disabled={!recipient || !taskStage || !assignedTo || assignedTo === "No Leader Assigned" || alreadyConsolidated}
          sx={{ minWidth: 100 }}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConsolidationModal;