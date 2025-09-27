import React, { useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
} from "@mui/material";

const EventTypesModal = ({ open, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", // Changed from eventGroupName to match backend
    isTicketed: false,
    isGlobal: false,
    hasPersonSteps: false,
    description: "",
  });

  const [errors, setErrors] = useState({});

  // Handle checkbox changes with mutual exclusivity
  const handleCheckboxChange = (name) => (event) => {
    const { checked } = event.target;
    
    setFormData((prev) => {
      // If checking a box, uncheck the others
      if (checked) {
        return {
          ...prev,
          isTicketed: name === 'isTicketed',
          isGlobal: name === 'isGlobal',
          hasPersonSteps: name === 'hasPersonSteps',
          [name]: checked,
        };
      } else {
        // If unchecking, just update the specific checkbox
        return {
          ...prev,
          [name]: checked,
        };
      }
    });

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
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
      newErrors.name = "Event Group Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Event Group Name must be at least 2 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    // Validate that at least one event type is selected
    if (!formData.isTicketed && !formData.isGlobal && !formData.hasPersonSteps) {
      newErrors.eventType = "Please select at least one event type";
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
    if (!validateForm()) return;

    setLoading(true);
    try {
      const eventTypeData = {
        name: formData.name.trim(),
        isTicketed: formData.isTicketed,
        isGlobal: formData.isGlobal,
        hasPersonSteps: formData.hasPersonSteps,
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
      };

      await onSubmit(eventTypeData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating event type:", error);
      // Error handling would be done in the parent component
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

  // Determine which event type is selected for display
  const getSelectedEventType = () => {
    if (formData.isTicketed) return "Ticketed Event";
    if (formData.isGlobal) return "Global Event";
    if (formData.hasPersonSteps) return "Personal Steps Event";
    return "No event type selected";
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
            Create New Event Group
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
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "20px",
              color: "white",
              fontWeight: "bold",
              transition: "all 0.2s ease",
              opacity: loading ? 0.6 : 1,
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
            label="Event Group Name"
            name="name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={handleInputChange}
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Enter event group name (e.g., CELLS, SERVICE, etc.)"
            disabled={loading}
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

          {/* Event Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
              Event Type (Select One):
            </Typography>
            
            {errors.eventType && (
              <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
                {errors.eventType}
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTicketed"
                    checked={formData.isTicketed}
                    onChange={handleCheckboxChange('isTicketed')}
                    color="primary"
                    disabled={loading}
                    sx={{ 
                      '& .MuiSvgIcon-root': { fontSize: 20 }
                    }}
                  />
                }
                label="Ticketed"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.95rem',
                    color: '#333',
                    fontWeight: formData.isTicketed ? 'bold' : 'normal'
                  }
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    name="isGlobal"
                    checked={formData.isGlobal}
                    onChange={handleCheckboxChange('isGlobal')}
                    color="primary"
                    disabled={loading}
                    sx={{ 
                      '& .MuiSvgIcon-root': { fontSize: 20 }
                    }}
                  />
                }
                label="Global Event"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.95rem',
                    color: '#333',
                    fontWeight: formData.isGlobal ? 'bold' : 'normal'
                  }
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    name="hasPersonSteps"
                    checked={formData.hasPersonSteps}
                    onChange={handleCheckboxChange('hasPersonSteps')}
                    color="primary"
                    disabled={loading}
                    sx={{ 
                      '& .MuiSvgIcon-root': { fontSize: 20 }
                    }}
                  />
                }
                label="Person Steps"
                sx={{ 
                  '& .MuiFormControlLabel-label': { 
                    fontSize: '0.95rem',
                    color: '#333',
                    fontWeight: formData.hasPersonSteps ? 'bold' : 'normal'
                  }
                }}
              />
            </Box>

            {/* Selected type indicator */}
            {formData.isTicketed || formData.isGlobal || formData.hasPersonSteps ? (
              <Typography variant="body2" sx={{ 
                color: '#1976d2', 
                fontStyle: 'italic',
                mt: 1 
              }}>
                Selected: {getSelectedEventType()}
              </Typography>
            ) : null}
          </Box>

          {/* Description */}
          <TextField
            label="Event Description"
            name="description"
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            error={!!errors.description}
            helperText={errors.description || "Describe the purpose and details of this event group"}
            placeholder="Enter a detailed description of this event group..."
            disabled={loading}
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