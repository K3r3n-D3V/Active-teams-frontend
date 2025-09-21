import React, { useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from "@mui/material";
import { MoonLoader } from "react-spinners";

const EventTypesModal = ({ open, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventTypeName: "",
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

    if (!formData.eventTypeName.trim()) {
      newErrors.eventTypeName = "Event type name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      eventTypeName: "",
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
        name: formData.eventTypeName.trim(),
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
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: "80%", md: "60%", lg: "50%" },
          maxWidth: "600px",
          bgcolor: "white",
          boxShadow: 24,
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          overflowY: "auto",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <Typography
          variant="h4"
          component="h2"
          sx={{
            textAlign: "center",
            mb: 3,
            fontFamily: "arial",
            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          Create New Event Type
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Event Type Name */}
        <TextField
          label="Event Type Name"
          name="eventTypeName"
          fullWidth
          margin="normal"
          value={formData.eventTypeName}
          onChange={handleChange}
          error={!!errors.eventTypeName}
          helperText={errors.eventTypeName}
          placeholder="e.g., Workshop, Conference, Training"
          required
        />

        {/* Description */}
        <TextField
          label="Description"
          name="description"
          fullWidth
          margin="normal"
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={errors.description}
          multiline
          rows={4}
          placeholder="Describe what this event type is for..."
          required
        />

        {/* Checkboxes */}
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
            Event Type Settings
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                name="isTicketed"
                checked={formData.isTicketed}
                onChange={handleChange}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Ticketed Event Type
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Events of this type will require payment
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="isGlobal"
                checked={formData.isGlobal}
                onChange={handleChange}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Global Event Type
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available across all locations and branches
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="hasPersonSteps"
                checked={formData.hasPersonSteps}
                onChange={handleChange}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Person Steps
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Track individual progress and steps for attendees
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: "1rem",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            fullWidth
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: "1rem",
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <MoonLoader size={16} color="white" />
                <span>Creating...</span>
              </Box>
            ) : (
              "Create Event Type"
            )}
          </Button>
        </Box>

        {/* Preview Section */}
        {formData.eventTypeName && (
          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Preview:
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              {formData.eventTypeName}
            </Typography>
            {formData.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {formData.description}
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {formData.isTicketed && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: "primary.main",
                    color: "white",
                    borderRadius: 1,
                  }}
                >
                  Ticketed
                </Typography>
              )}
              {formData.isGlobal && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: "success.main",
                    color: "white",
                    borderRadius: 1,
                  }}
                >
                  Global
                </Typography>
              )}
              {formData.hasPersonSteps && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: "info.main",
                    color: "white",
                    borderRadius: 1,
                  }}
                >
                  Person Steps
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default EventTypesModal;
