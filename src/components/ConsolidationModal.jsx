import React, { useState, useEffect, useCallback, useContext } from "react";
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
import Autocomplete from "@mui/material/Autocomplete";
import { debounce } from "lodash";
import { AuthContext } from "../contexts/AuthContext";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;

function resolveLeadersFromPerson(person) {
  if (!person) return {};

  if (Array.isArray(person.leaders) && person.leaders.length > 0) {
    const map = {};
    for (const l of person.leaders) {
      if (l?.level != null && l?.name) {
        map[`leader${l.level}`] = l.name;
      }
    }
    if (Object.keys(map).length > 0) return map;
  }

  const map = {};
  for (const key of Object.keys(person)) {
    if (/^leader\d+$/.test(key) && person[key]) map[key] = person[key];
  }
  if (Object.keys(map).length > 0) return map;

  return {
    leader1: person["Leader @1"] || person.leader1 || "",
    leader12: person["Leader @12"] || person.leader12 || "",
    leader144: person["Leader @144"] || person.leader144 || "",
    leader1728: person["Leader @1728"] || person.leader1728 || "",
  };
}

function getHighestAvailableLeader(person) {
  const leaders = resolveLeadersFromPerson(person);

  const entries = Object.entries(leaders)
    .map(([key, name]) => ({
      level: parseInt(key.replace("leader", ""), 10),
      name: name || "",
    }))
    .filter(e => !isNaN(e.level) && e.name.trim())
    .sort((a, b) => b.level - a.level);

  if (entries.length > 0) {
    const top = entries[0];
    return { leader: top.name, level: top.level, hasLeader: true };
  }

  return { leader: "No Leader Assigned", level: 0, hasLeader: false };
}

const ConsolidationModal = ({
  open,
  onClose,
  onFinish,
  attendeesWithStatus = [],
  consolidatedPeople = [],
  currentEventId,
}) => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { authFetch } = useContext(AuthContext);

  const decisionTypes = ["First Time", "Recommitment"];

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) { setRecipients([]); return; }
      try {
        setLoadingRecipients(true);
        setError("");
        const response = await authFetch(
          `${BASE_URL}/people/search?query=${encodeURIComponent(query.trim())}&limit=25`
        );
        if (response.ok) {
          const data = await response.json();
          setRecipients(
            Array.isArray(data.results) ? data.results
              : Array.isArray(data) ? data
                : []
          );
        } else {
          setRecipients([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search people. Please try again.");
        setRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    }, 350),
    [authFetch]
  );

  const searchLocalAttendees = useCallback((query) => {
    if (!query || query.length < 2) { setRecipients([]); return; }
    const term = query.toLowerCase().trim();
    const filtered = attendeesWithStatus.filter(p => {
      const s = `${p.name || ''} ${p.surname || ''} ${p.email || ''} ${p.phone || ''}`.toLowerCase();
      return s.includes(term);
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
      setIsSubmitting(false);
    }
  }, [open]);

  const checkIfAlreadyConsolidated = useCallback((person) => {
    if (!person) return false;

    if (!consolidatedPeople || consolidatedPeople.length === 0) return false;

    const personEmail = (person.Email || person.email || "").trim().toLowerCase();
    const personFirstName = (person.Name || person.name || "").trim().toLowerCase();
    const personLastName = (person.Surname || person.surname || "").trim().toLowerCase();
    const personFullName = `${personFirstName} ${personLastName}`.trim();

    if (!personEmail && !personFullName) return false;

    return consolidatedPeople.some((c) => {
      const cEmail = (c.email || c.person_email || "").trim().toLowerCase();
      const cFirstName = (c.name || c.person_name || "").trim().toLowerCase();
      const cLastName = (c.surname || c.person_surname || "").trim().toLowerCase();
      const cFullName = `${cFirstName} ${cLastName}`.trim();

      if (personEmail && cEmail && personEmail === cEmail) return true;

      if (
        personFullName &&
        cFullName &&
        personFullName.length > 2 &&
        cFullName.length > 2 &&
        personFullName === cFullName
      ) {
        return true;
      }

      return false;
    });
  }, [consolidatedPeople]);

  useEffect(() => {
    if (recipient) {
      const leaderInfo = getHighestAvailableLeader(recipient);
      setAssignedTo(leaderInfo.leader);

      const isAlready = checkIfAlreadyConsolidated(recipient);
      setAlreadyConsolidated(isAlready);

      if (isAlready) {
        setError("This person has already been consolidated. Please select someone else.");
      } else {
        setError("");
      }
    } else {
      setAssignedTo("");
      setAlreadyConsolidated(false);
      setError("");
    }
  }, [recipient, checkIfAlreadyConsolidated]);

  const handleFinish = async () => {
    if (isSubmitting) return;

    setError("");

    if (!recipient) {
      setError("Please select a person for consolidation");
      return;
    }
    if (!taskStage) {
      setError("Please select a decision type");
      return;
    }

    const isAlready = checkIfAlreadyConsolidated(recipient);
    if (isAlready) {
      setAlreadyConsolidated(true);
      setError("This person has already been consolidated. Please select someone else.");
      return;
    }

    const leaderInfo = getHighestAvailableLeader(recipient);
    if (!leaderInfo.hasLeader) {
      setError("Cannot create consolidation task: No leader available for this person.");
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    const decisionType =
      taskStage.toLowerCase() === "recommitment" ? "recommitment" : "first_time";

    const leadersMap = resolveLeadersFromPerson(recipient);
    const leadersArray = [
      leadersMap.leader1 || "",
      leadersMap.leader12 || "",
      leadersMap.leader144 || "",
      leadersMap.leader1728 || "",
    ];

    try {
      const consolidationData = {
        person_name: recipient.Name || recipient.name || "",
        person_surname: recipient.Surname || recipient.surname || "",
        person_email: recipient.Email || recipient.email || "",
        person_phone: recipient.Phone || recipient.phone || "",
        decision_type: decisionType,
        decision_date: new Date().toISOString().split("T")[0],
        assigned_to: leaderInfo.leader,
        assigned_to_email: "",
        event_id: currentEventId,
        leaders: leadersArray,
        source: "service_consolidation",
        person_data: {
          id: recipient._id || recipient.id || "",
          name: recipient.Name || recipient.name || "",
          surname: recipient.Surname || recipient.surname || "",
          email: recipient.Email || recipient.email || "",
          phone: recipient.Phone || recipient.phone || "",
        },
      };

      console.log("Consolidation payload:", consolidationData);

      const response = await authFetch(
        `${BASE_URL}/service-checkin/create-consolidation`,
        {
          method: "POST",
          body: JSON.stringify(consolidationData),
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        setRecipient(null);
        setAssignedTo("");
        setTaskStage("");
        setAlreadyConsolidated(false);
        setError("");
        setIsSubmitting(false);
        setLoading(false);

        onClose();

        onFinish({
          ...responseData,
          recipientName: `${recipient.Name || recipient.name || ""} ${recipient.Surname || recipient.surname || ""}`.trim(),
          assignedTo: responseData.assigned_to || leaderInfo.leader,
          taskStage,
          decisionType,
          leaderLevel: leaderInfo.level,
          task_id: responseData.task_id,
          recipient_email: recipient.Email || recipient.email || "",
          recipient_phone: recipient.Phone || recipient.phone || "",
          leader_email: responseData.assigned_to_email || "",
          isConsolidationOnly: true,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData?.detail
            ? `Error: ${errorData.detail}`
            : `Server error (${response.status})`
        );
        setIsSubmitting(false);
        setLoading(false);
      }
    } catch (err) {
      console.error("Consolidation error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const roundedInput = {
    "& .MuiOutlinedInput-root": { borderRadius: "15px" },
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
              <Typography component="span" variant="caption" color="error" sx={{ ml: 1 }}>
                (Already Consolidated)
              </Typography>
            )}
          </Typography>
          {(option.Email || option.email) && (
            <Typography variant="caption" color="text.secondary">
              {option.Email || option.email}
            </Typography>
          )}
        </Box>
      </li>
    );
  };

  const isSubmitDisabled =
    loading ||
    isSubmitting ||
    !recipient ||
    !taskStage ||
    !assignedTo ||
    assignedTo === "No Leader Assigned" ||
    alreadyConsolidated;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, m: 2, maxHeight: "90vh" } }}
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
          onInputChange={(e, newInputValue) => handleSearch(newInputValue)}
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
              ? "Warning: No leader found for this person"
              : "Automatically assigned to this person's direct leader"
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
          onChange={(e) => setTaskStage(e.target.value)}
          fullWidth
          margin="normal"
          required
          error={!taskStage && isSubmitting}
          helperText={!taskStage && isSubmitting ? "Please select the decision made" : ""}
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
        <Button
          onClick={onClose}
          color="inherit"
          disabled={loading || isSubmitting}
        >
          Cancel
        </Button>
        <LoadingButton
          onClick={handleFinish}
          variant="contained"
          color="primary"
          loading={loading}
          disabled={isSubmitDisabled}
          sx={{ minWidth: 100 }}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConsolidationModal;