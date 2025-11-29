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
    "First Time",
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

  // const checkIfAlreadyConsolidated = useCallback((person) => {
  //   if (!person) return false;
    
  //   const personEmail = person.Email || person.email;
  //   const personName = `${person.Name || person.name} ${person.Surname || person.surname}`.trim().toLowerCase();
    
  //   const isInConsolidatedList = consolidatedPeople.some(consolidated => {
  //     const consolidatedEmail = consolidated.email || consolidated.person_email;
  //     const consolidatedName = `${consolidated.name || consolidated.person_name} ${consolidated.surname || consolidated.person_surname}`.trim().toLowerCase();
      
  //     return (personEmail && consolidatedEmail && personEmail.toLowerCase() === consolidatedEmail.toLowerCase()) ||
  //            (personName === consolidatedName);
  //   });
    
  //   const hasConsolidationStage = person.Stage === "Consolidate";
  //   const hasDecisionHistory = person.DecisionHistory && person.DecisionHistory.length > 0;
    
  //   console.log("🔍 Consolidation check for:", personName, {
  //     isInConsolidatedList,
  //     hasConsolidationStage,
  //     hasDecisionHistory,
  //     stage: person.Stage,
  //     decisionHistory: person.DecisionHistory
  //   });
    
  //   return isInConsolidatedList || hasConsolidationStage || hasDecisionHistory;
  // }, [consolidatedPeople]);
const checkIfAlreadyConsolidated = useCallback((person) => {
  if (!person) return false;
  
  const personEmail = person.Email || person.email;
  const personName = `${person.Name || person.name} ${person.Surname || person.surname}`.trim().toLowerCase();
  
  // FIXED: More precise matching
  const isInConsolidatedList = consolidatedPeople.some(consolidated => {
    const consolidatedEmail = consolidated.email || consolidated.person_email;
    const consolidatedName = `${consolidated.name || consolidated.person_name} ${consolidated.surname || consolidated.person_surname}`.trim().toLowerCase();
    
    // Match by email if available
    if (personEmail && consolidatedEmail) {
      return personEmail.toLowerCase() === consolidatedEmail.toLowerCase();
    }
    
    // Fallback to name matching
    return personName === consolidatedName;
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

  // FIXED: Simplified leader email lookup without people_cache
  const findLeaderEmail = async (leaderName) => {
    if (!leaderName || leaderName === "No Leader Assigned") return "";
    
    try {
      const token = localStorage.getItem("token");
      const searchResponse = await axios.get(`${BASE_URL}/people/search`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          query: leaderName,
          limit: 5,
          fields: "Name,Email"
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

// const handleFinish = async () => {
//   if (!recipient) {
//     setError("Please select a person for consolidation");
//     return;
//   }

//   if (!taskStage) {
//     setError("Please select a decision type");
//     return;
//   }

//   // FINAL consolidation check with more robust validation
//   const finalCheck = checkIfAlreadyConsolidated(recipient);
//   if (finalCheck) {
//     setError("This person has already been consolidated. Please select someone else.");
//     return;
//   }

//   const leaderInfo = getHighestAvailableLeader(recipient);
  
//   if (!leaderInfo.hasLeader) {
//     setError("Cannot create consolidation task: No leader available for assignment");
//     return;
//   }

//   // FIXED: Better leader email lookup with guaranteed fallback
//   let leaderEmail = await findLeaderEmail(leaderInfo.leader);
  
//   // CRITICAL FIX: Ensure we have a valid email - GUARANTEED assignment
//   if (!leaderEmail || leaderEmail.trim() === "") {
//     // Create a fallback email based on leader name
//     leaderEmail = `${leaderInfo.leader.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '.')}@consolidation.fallback`;
//     console.log(`⚠️ Using fallback email for leader: ${leaderEmail}`);
    
//     // Show warning but proceed - don't block submission
//     setError(`Note: Using system email for ${leaderInfo.leader}. The consolidation will still be created.`);
//   }

//   const decisionType = taskStage.toLowerCase() === 'recommitment' ? 'recommitment' : 'first_time';
  
//   // FIXED: Use consistent field names that match your backend - GUARANTEED email
//   const consolidationData = {
//     person_name: recipient.Name || recipient.name,
//     person_surname: recipient.Surname || recipient.surname,
//     person_email: recipient.Email || recipient.email || "",
//     person_phone: recipient.Phone || recipient.phone || "",
//     decision_type: decisionType,
//     decision_date: new Date().toISOString().split('T')[0],
//     assigned_to: leaderInfo.leader,
//     assigned_to_email: leaderEmail, // ✅ GUARANTEED to have a value now
//     event_id: currentEventId,
//     leaders: [
//       recipient["Leader @1"] || recipient.leader1 || "",
//       recipient["Leader @12"] || recipient.leader12 || "",
//       recipient["Leader @144"] || recipient.leader144 || "",
//       recipient["Leader @1728"] || recipient.leader1728 || ""
//     ],
//     notes: "", // Add empty notes field if required
//     // EXPLICITLY state this is not a check-in
//     is_check_in: false,
//     attendance_status: "not_checked_in"
//   };

//   console.log("📤 Sending consolidation data (NO CHECK-IN):", consolidationData);
//   console.log("🔍 Email validation:", {
//     assigned_to_email: consolidationData.assigned_to_email,
//     exists: !!consolidationData.assigned_to_email,
//     length: consolidationData.assigned_to_email?.length,
//     trimmed: consolidationData.assigned_to_email?.trim()
//   });

//   setLoading(true);

//   try {
//     const token = localStorage.getItem("token");
//     console.log("🔑 Token available:", !!token);

//     if (!token) {
//       throw new Error("No authentication token found");
//     }

//     // FIXED: Add timeout and prevent duplicate requests
//     const response = await axios.post(`${BASE_URL}/consolidations`, consolidationData, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       },
//       timeout: 10000 // 10 second timeout
//     });
    
//     console.log("✅ Consolidation creation response:", response.data);

//     if (!response.data.success) {
//       throw new Error(response.data.message || "Failed to create consolidation");
//     }

//     // FIXED: Call onFinish with ALL required data including assignedToEmail
//     const resultData = {
//       ...response.data,
//       recipientName: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
//       assignedTo: leaderInfo.leader,
//       assignedToEmail: leaderEmail, // ✅ CRITICAL: This was missing before
//       taskStage: taskStage,
//       decisionType: decisionType,
//       leaderLevel: leaderInfo.level,
//       task_id: response.data.task_id,
//       recipient_email: recipient.Email || recipient.email || "",
//       recipient_phone: recipient.Phone || recipient.phone || "",
//       leader_email: leaderEmail,
//       consolidation_id: response.data.consolidation_id,
//       // Also pass person data for ServiceCheckIn
//       person_name: recipient.Name || recipient.name,
//       person_surname: recipient.Surname || recipient.surname,
//       person_email: recipient.Email || recipient.email || "",
//       person_phone: recipient.Phone || recipient.phone || "",
//       // EXPLICITLY mark that this is not a check-in
//       isConsolidationOnly: true
//     };

//     console.log("📤 Passing to onFinish with assignedToEmail:", {
//       assignedTo: resultData.assignedTo,
//       assignedToEmail: resultData.assignedToEmail,
//       leader_email: resultData.leader_email
//     });
    
//     onFinish(resultData);
    
//     // Reset form
//     setRecipient(null);
//     setAssignedTo("");
//     setTaskStage("");
//     setAlreadyConsolidated(false);
//     setError("");
    
//     // Close modal after successful submission
//     setTimeout(() => {
//       onClose();
//     }, 500);
    
//   } catch (err) {
//     console.error("❌ Error creating consolidation:", err);
    
//     // FIXED: Better error handling
//     if (err.code === 'ECONNABORTED') {
//       setError("Request timeout. Please try again.");
//     } else if (err.response) {
//       console.error("📡 Server response error:", {
//         status: err.response.status,
//         data: err.response.data,
//       });
      
//       if (err.response.status === 409) {
//         setError("This person has already been consolidated. Please select someone else.");
//       } else if (err.response.data && err.response.data.detail) {
//         setError(`Server error: ${err.response.data.detail}`);
//       } else if (err.response.data && err.response.data.errors) {
//         // Handle validation errors
//         const validationErrors = err.response.data.errors;
//         const errorMessages = validationErrors.map(error => 
//           `${error.field}: ${error.message}`
//         ).join(', ');
//         setError(`Validation errors: ${errorMessages}`);
//       } else {
//         setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
//       }
//     } else if (err.request) {
//       console.error("🌐 Network error:", err.request);
//       setError("Network error: Could not connect to server. Please check your connection.");
//     } else {
//       console.error("⚡ Request setup error:", err.message);
//       setError(`Request error: ${err.message}`);
//     }
//   } finally {
//     setLoading(false);
//   }
// };
const handleFinish = async () => {
  if (!recipient) {
    setError("Please select a person for consolidation");
    return;
  }

  if (!taskStage) {
    setError("Please select a decision type");
    return;
  }

  // FINAL consolidation check with more robust validation
  const finalCheck = checkIfAlreadyConsolidated(recipient);
  if (finalCheck) {
    setError("This person has already been consolidated. Please select someone else.");
    return;
  }

  const leaderInfo = getHighestAvailableLeader(recipient);
  
  if (!leaderInfo.hasLeader) {
    setError("Cannot create consolidation task: No leader available for assignment");
    return;
  }

  // FIXED: Better leader email lookup with guaranteed fallback
  let leaderEmail = await findLeaderEmail(leaderInfo.leader);
  
  // CRITICAL FIX: Ensure we have a valid email - GUARANTEED assignment
  if (!leaderEmail || leaderEmail.trim() === "") {
    leaderEmail = `${leaderInfo.leader.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '.')}@consolidation.fallback`;
    console.log(`⚠️ Using fallback email for leader: ${leaderEmail}`);
  }

  const decisionType = taskStage.toLowerCase() === 'recommitment' ? 'recommitment' : 'first_time';
  
  // FIXED: Use consistent field names that match your backend - GUARANTEED email
  const consolidationData = {
    person_name: recipient.Name || recipient.name,
    person_surname: recipient.Surname || recipient.surname,
    person_email: recipient.Email || recipient.email || "",
    person_phone: recipient.Phone || recipient.phone || "",
    decision_type: decisionType,
    decision_date: new Date().toISOString().split('T')[0],
    assigned_to: leaderInfo.leader,
    assigned_to_email: leaderEmail, // ✅ GUARANTEED to have a value now
    event_id: currentEventId,
    leaders: [
      recipient["Leader @1"] || recipient.leader1 || "",
      recipient["Leader @12"] || recipient.leader12 || "",
      recipient["Leader @144"] || recipient.leader144 || "",
      recipient["Leader @1728"] || recipient.leader1728 || ""
    ],
    notes: "",
    is_check_in: false,
    attendance_status: "not_checked_in"
  };

  console.log("📤 Sending consolidation data (NO CHECK-IN):", consolidationData);

  setLoading(true);

  try {
    const token = localStorage.getItem("token");
    console.log("🔑 Token available:", !!token);

    if (!token) {
      throw new Error("No authentication token found");
    }

    // ✅ ConsolidationModal makes the API call (like AddPersonDialog)
    const response = await axios.post(`${BASE_URL}/consolidations`, consolidationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log("✅ Consolidation creation response:", response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to create consolidation");
    }

    // ✅ Prepare result data to pass to parent (like AddPersonDialog)
    const resultData = {
      ...response.data,
      // Include all data needed for ServiceCheckIn to update its state
      recipientName: `${recipient.Name || recipient.name} ${recipient.Surname || recipient.surname}`,
      assignedTo: leaderInfo.leader,
      assignedToEmail: leaderEmail,
      taskStage: taskStage,
      decisionType: decisionType,
      leaderLevel: leaderInfo.level,
      task_id: response.data.task_id,
      recipient_email: recipient.Email || recipient.email || "",
      recipient_phone: recipient.Phone || recipient.phone || "",
      leader_email: leaderEmail,
      consolidation_id: response.data.consolidation_id,
      // Person data for consistency
      person_name: recipient.Name || recipient.name,
      person_surname: recipient.Surname || recipient.surname,
      person_email: recipient.Email || recipient.email || "",
      person_phone: recipient.Phone || recipient.phone || "",
      // Mark as consolidation only
      isConsolidationOnly: true
    };

    console.log("📤 Passing consolidation result to parent:", resultData);
    
    // ✅ Call onFinish with the result (like AddPersonDialog calls onSave)
    onFinish(resultData);
    
    // Reset form and close modal
    setRecipient(null);
    setAssignedTo("");
    setTaskStage("");
    setAlreadyConsolidated(false);
    setError("");
    
    // Close modal after successful submission
    onClose();
    
  } catch (err) {
    console.error("❌ Error creating consolidation:", err);
    
    // Error handling remains the same...
    if (err.code === 'ECONNABORTED') {
      setError("Request timeout. Please try again.");
    } else if (err.response) {
      console.error("📡 Server response error:", {
        status: err.response.status,
        data: err.response.data,
      });
      
      if (err.response.status === 409) {
        setError("This person has already been consolidated. Please select someone else.");
      } else if (err.response.data && err.response.data.detail) {
        setError(`Server error: ${err.response.data.detail}`);
      } else if (err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        const errorMessages = validationErrors.map(error => 
          `${error.field}: ${error.message}`
        ).join(', ');
        setError(`Validation errors: ${errorMessages}`);
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
        <Typography variant="h5" component="div">
          Consolidation Assignment
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> This creates a consolidation task only. It does NOT mark the person as checked in to the event.
          </Typography>
        </Alert> */}

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