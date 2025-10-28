import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  IconButton,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const EventTypesModal = ({
  open,
  onClose,
  onSubmit,
  setSelectedEventTypeObj,
  selectedEventType,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    isTicketed: false,
    isGlobal: false,
    hasPersonSteps: false,
    description: "",
  });

  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);

  const nameCharCount = formData.name.length;
  const descCharCount = formData.description.length;

  const isDarkMode = theme.palette.mode === 'dark';

  const handleCheckboxChange = (name) => (event) => {
    const { checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Event Type Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Event Type Name must be at least 2 characters";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "Event Type Name must be less than 50 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (formData.description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      isTicketed: false,
      isGlobal: false,
      hasPersonSteps: false,
      description: "",
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm() || loading) return;

    setLoading(true);
    try {
      const eventTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isTicketed: formData.isTicketed,
        isGlobal: formData.isGlobal,
        hasPersonSteps: formData.hasPersonSteps,
      };

      let result;
      
      if (selectedEventType && selectedEventType.name) {
        result = await onSubmit(eventTypeData, selectedEventType.name);
      } else {
        result = await onSubmit(eventTypeData);
      }

      if (setSelectedEventTypeObj) {
        setSelectedEventTypeObj({
          ...eventTypeData,
          _id: selectedEventType?._id || result?._id,
        });
      }

      resetForm();
      onClose();
      return result;
    } catch (error) {
      console.error("Error saving event type:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  useEffect(() => {
    if (selectedEventType && open) {
      setFormData({
        name: selectedEventType.name || "",
        description: selectedEventType.description || "",
        isTicketed: !!selectedEventType.isTicketed,
        isGlobal: !!selectedEventType.isGlobal,
        hasPersonSteps: !!selectedEventType.hasPersonSteps,
      });
    } else if (!open) {
      resetForm();
    }
  }, [selectedEventType, open]);

  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current.focus();
      }, 100);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Box
  sx={{
    width: { xs: "95%", sm: "80%", md: "700px" }, // ⬅️ wider modal
    maxWidth: "700px",
    bgcolor: "#1e1e1e",
    color: "#f1f1f1",
    borderRadius: "12px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  }}
>
  {/* Header */}
  <Box
    sx={{
      backgroundColor: "#111",
      color: "white",
      padding: "20px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
      {selectedEventType ? "Create New Event Type":"Edit Event Type"}
    </Typography>
    <button
      onClick={handleClose}
      disabled={loading}
      style={{
        background: "rgba(255, 255, 255, 0.15)",
        border: "none",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: "20px",
        color: "white",
        transition: "all 0.2s ease",
      }}
    >
      ×
    </button>
  </Box>

  {/* Body */}
  <Box sx={{ flex: 1, overflowY: "auto", padding: "24px" }}>
    {/* Event Type Name */}
    <TextField
      label="Event Type Name"
      name="name"
      fullWidth
      margin="normal"
      value={formData.name}
      onChange={handleInputChange}
      error={!!errors.name}
      helperText={errors.name}
      placeholder={selectedEventType ? "Edit event type name" : "Create an event type"}
      disabled={loading}
      sx={{
        mb: 3,
        input: { color: "#fff" },
        label: { color: "#aaa" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "#555" },
          "&:hover fieldset": { borderColor: "#888" },
        },
      }}
    />

    {/* Checkboxes - now in one line */}
    <Box
      sx={{
        display: "flex",
        flexWrap: "nowrap", // ✅ keep in one line
        gap: 1,
        alignItems: "center",
        mb: 3,
      }}
    >
      <FormControlLabel
        control={
          <Checkbox
            name="isTicketed"
            checked={formData.isTicketed}
            onChange={handleCheckboxChange("isTicketed")}
            color="primary"
            disabled={loading}
            sx={{ color: "#bbb" }}
          />
        }
        label="Ticketed Event"
      />
      <FormControlLabel
        control={
          <Checkbox
            name="isGlobal"
            checked={formData.isGlobal}
            onChange={handleCheckboxChange("isGlobal")}
            color="primary"
            disabled={loading}
            sx={{ color: "#bbb" }}
          />
        }
        label="Global Event"
      />
      <FormControlLabel
        control={
          <Checkbox
            name="hasPersonSteps"
            checked={formData.hasPersonSteps}
            onChange={handleCheckboxChange("hasPersonSteps")}
            color="primary"
            disabled={loading}
            sx={{ color: "#bbb" }}
          />
        }
        label="Personal Steps Event"
      />
    </Box>

    {/* Description */}
    <TextField
      label="Event Description"
      name="description"
      fullWidth
      multiline
      rows={4}
      size="normal"
      value={formData.description}
      onChange={handleInputChange}
      error={!!errors.description}
      helperText={errors.description || "Describe the purpose and details of this event type"}
      placeholder="Enter a detailed description of this event type..."
      disabled={loading}
      sx={{
        mb: 3,
        textarea: { color: "#fff" },
        label: { color: "#aaa" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "#555" },
          "&:hover fieldset": { borderColor: "#888" },
        },
      }}
    />

    {/* Buttons */}
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}>
      <Button variant="outlined" onClick={handleClose} disabled={loading} sx={{ flex: 1, borderColor: "#888", color: "#ccc" }}>
        Cancel
      </Button>
      <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ flex: 1 }}>
        {loading ? "Saving..." : "Submit"}
      </Button>
    </Box>
  </Box>
</Box>

    </Modal>
  );
};

export default EventTypesModal;