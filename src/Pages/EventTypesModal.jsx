import React, { useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";

const EventTypesModal = ({ open, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventGroupName: "",
    isTicketed: false,
    isGlobal: false,
    hasPersonSteps: false,
    description: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

    if (!formData.eventGroupName.trim()) {
      newErrors.eventGroupName = "Event type name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      eventGroupName: "",
      isTicketed: false,
      isGlobal: false,
      hasPersonSteps: false,
      description: "",
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const eventTypeData = {
        name: formData.eventGroupName.trim(),
        isTicketed: formData.isTicketed,
        isGlobal: formData.isGlobal,
        hasPersonSteps: formData.hasPersonSteps,
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
      };

      await onSubmit(eventTypeData);
      resetForm();
      onClose();
       alert('Event type has been created successfully!');
      //   if (onEventTypeCreated) {
      //   onEventTypeCreated(res.data.name);  // Or res.data.eventType if that’s the key
      // }
    } catch (error) {
      console.error("Error creating event type:", error);
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

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Box
        sx={{
          width: { xs: "95%", sm: "80%", md: "500px" },
          maxWidth: "500px",
          bgcolor: "white",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: "#333",
            color: "white",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: "bold",
              margin: 0,
              fontSize: "1.5rem",
            }}
          >
            Create New Event Type
          </Typography>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "20px",
              color: "white",
              fontWeight: "bold",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>
        </Box>

        {/* Body */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {/* Event Group Name */}
          <TextField
            label=""
            name="eventGroupName"
            fullWidth
            margin="normal"
            value={formData.eventGroupName}
            onChange={handleChange}
            error={!!errors.eventGroupName}
            helperText={errors.eventGroupName}
            placeholder="Event Type Name"
            sx={{
              mb: 3,
              mt: 0,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#ddd',
                },
                '&:hover fieldset': {
                  borderColor: '#bbb',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
            }}
          />

          {/* Checkboxes */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTicketed"
                    checked={formData.isTicketed}
                    onChange={handleChange}
                    color="primary"
                    sx={{ 
                      '& .MuiSvgIcon-root': { fontSize: 20 }
                    }}
                  />
                }
                label="Ticketed"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.95rem',
                    color: '#333'
                  }
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    name="isGlobal"
                    checked={formData.isGlobal}
                    onChange={handleChange}
                    color="primary"
                    sx={{ 
                      '& .MuiSvgIcon-root': { fontSize: 20 }
                    }}
                  />
                }
                label="Global Event"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.95rem',
                    color: '#333'
                  }
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    name="hasPersonSteps"
                    checked={formData.hasPersonSteps}
                    onChange={handleChange}
                    color="primary"
                    sx={{ 
                      '& .MuiSvgIcon-root': { fontSize: 20 }
                    }}
                  />
                }
                label="Person Steps"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.95rem',
                    color: '#333'
                  }
                }}
              />
            </Box>
          </Box>

          {/* Description */}
          <TextField
            label=""
            name="description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
            placeholder="Event Description"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#ddd',
                },
                '&:hover fieldset': {
                  borderColor: '#bbb',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1976d2',
                },
              },
            }}
          />

          {/* Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              mt: 3
            }}
          >
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
              sx={{
                flex: 1,
                py: 1.2,
                fontSize: "0.95rem",
                textTransform: "uppercase",
                fontWeight: "500",
                borderColor: "#ddd",
                color: "#666",
                '&:hover': {
                  borderColor: "#bbb",
                  backgroundColor: "rgba(0,0,0,0.04)"
                }
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                flex: 1,
                py: 1.2,
                fontSize: "0.95rem",
                textTransform: "uppercase",
                fontWeight: "500",
                backgroundColor: "#1976d2",
                '&:hover': {
                  backgroundColor: "#1565c0"
                }
              }}
            >
              {loading ? "Creating..." : "Submit"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EventTypesModal;