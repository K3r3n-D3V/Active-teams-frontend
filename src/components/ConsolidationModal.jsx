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

const ConsolidationModal = ({ open, onClose, attendeesWithStatus, onFinish }) => {
  const [recipient, setRecipient] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [taskStage, setTaskStage] = useState("First-time Commitment");
  const [loading, setLoading] = useState(false);

  // Set real-time datetime when modal opens
  useEffect(() => {
    if (open) {
      setDateTime(dayjs().format("YYYY/MM/DD, HH:mm"));
    }
  }, [open]);

  // Auto-fill leader when recipient changes
  useEffect(() => {
    const selected = attendeesWithStatus.find((a) => a._id === recipient);
    if (selected) {
      setAssignedTo(
        selected.leader1728 ||
          selected.leader144 ||
          selected.leader12 ||
          "No Leader"
      );
    } else {
      setAssignedTo("");
    }
  }, [recipient, attendeesWithStatus]);

  const handleFinish = async () => {
    const task = {
      taskType: "Church - Consolidation",
      recipientId: recipient,
      recipientName:
        attendeesWithStatus.find((a) => a._id === recipient)?.name || "",
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

  // ✅ shared style for round inputs
  const roundedInput = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "15px",
    },
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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

        {/* Recipient */}
        <Autocomplete
          options={attendeesWithStatus.filter((a) => a.present)}
          getOptionLabel={(option) => `${option.name} ${option.surname}`}
          value={attendeesWithStatus.find((a) => a._id === recipient) || null}
          onChange={(e, newValue) => {
            setRecipient(newValue ? newValue._id : "");
          }}
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

        {/* Task Stage dropdown */}
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
