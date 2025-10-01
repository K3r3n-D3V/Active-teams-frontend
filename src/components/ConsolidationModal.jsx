import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import dayjs from "dayjs";
import axios from "axios";
import Autocomplete from "@mui/material/Autocomplete";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
const ConsolidationModal = ({ open, onClose, onFinish }) => {
  const [recipient, setRecipient] = useState(null); 
  const [assignedTo, setAssignedTo] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [taskStage, setTaskStage] = useState("First-time Commitment");
  const [loading, setLoading] = useState(false);

  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // set datetime when modal opens
  useEffect(() => {
    if (open) {
      setDateTime(dayjs().format("YYYY/MM/DD, HH:mm"));
      setRecipient(null);
      setAssignedTo("");
    }
  }, [open]);

  // fetch recipients from backend
  const fetchRecipients = async (query) => {
    if (!query) {
      setRecipients([]);
      return;
    }
    try {
      setLoadingRecipients(true);
      const res = await axios.get(`${BASE_URL}/people/search`, {
        params: { query, limit: 20 },
      });
      setRecipients(res.data.results || []);
    } catch (err) {
      console.error("Error fetching recipients:", err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  // update assignedTo whenever recipient changes
  useEffect(() => {
    if (recipient) {
      setAssignedTo(
        recipient["Leader @ 1728"] ||
          recipient["Leader @144"] ||
          recipient["Leader @12"] ||
          "No Leader"
      );
    } else {
      setAssignedTo("");
    }
  }, [recipient]);

  // submit consolidation task
  const handleFinish = async () => {
    if (!recipient) return;

    const task = {
      taskType: "Church - Consolidation",
      recipientId: recipient._id,
      recipientName: `${recipient.Name} ${recipient.Surname}`,
      assignedTo,
      dateTime,
      taskStage,
      status: "Open",
    };

    onClose();
    setLoading(true);

    try {
      await axios.post(`${BASE_URL}/tasks`, task);
      onFinish(task);
    } catch (err) {
      console.error("Error creating consolidation task:", err);
    } finally {
      setLoading(false);
    }
  };

  // shared style for round inputs
  const roundedInput = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "15px",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs" // ✅ keeps popup small on all screens
      PaperProps={{
        sx: {
          borderRadius: 3, // ✅ rounded popup
          m: 2,            // ✅ margin so it doesn’t stick to screen edges
        },
      }}
    >
      <DialogTitle>Consolidation</DialogTitle>
      <DialogContent dividers>
        {/* Task Type */}
        <TextField
          label="Task Type"
          value="Church - Consolidation"
          fullWidth
          margin="normal"
          disabled
          sx={roundedInput}
        />

        {/* Recipient (searchable) */}
        <Autocomplete
          options={recipients}
          loading={loadingRecipients}
          getOptionLabel={(option) =>
            `${option.Name || ""} ${option.Surname || ""}`
          }
          value={recipient}
          onChange={(e, newValue) => setRecipient(newValue)}
          onInputChange={(e, newInput) => fetchRecipients(newInput)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Recipient *"
              margin="normal"
              fullWidth
              required
              sx={roundedInput}
            />
          )}
        />

        {/* Assigned To */}
        <TextField
          label="Assigned To"
          value={assignedTo}
          fullWidth
          margin="normal"
          disabled
          sx={roundedInput}
        />

        {/* Date & Time */}
        <TextField
          label="Due Date & Time"
          value={dateTime}
          fullWidth
          margin="normal"
          disabled
          sx={roundedInput}
        />

        {/* Task Stage */}
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

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <LoadingButton
          onClick={handleFinish}
          variant="contained"
          color="primary"
          loading={loading}
          disabled={!recipient}
        >
          Finish
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConsolidationModal;
