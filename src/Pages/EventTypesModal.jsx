import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  useTheme,
  IconButton,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CategoryIcon from "@mui/icons-material/Category";

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
    description: "",
    isTicketed: false,
    isGlobal: false,
  });

  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);
  const isDarkMode = theme.palette.mode === "dark";

  useEffect(() => {
    if (open && selectedEventType) {
      setFormData({
        name: selectedEventType.name || "",
        description: selectedEventType.description || "",
        isTicketed: !!selectedEventType.isTicketed,
        isGlobal: typeof selectedEventType.isGlobal === "boolean" 
          ? selectedEventType.isGlobal 
          : false,
      });
    } else if (open && !selectedEventType) {
      resetForm();
    }
  }, [selectedEventType, open]);

  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isTicketed: false,
      isGlobal: false,
    });
    setErrors({});
  };

  const handleCheckboxChange = (name) => (event) => {
    setFormData((prev) => ({ ...prev, [name]: event.target.checked }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Event Type Name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || loading) return;

    setLoading(true);
    try {
      const eventTypeData = {
        name: formData.name.trim().toLowerCase(),
        eventTypeName: formData.name.trim().toLowerCase(),
        description: formData.description.trim().toLowerCase(),
        isTicketed: formData.isTicketed,
        isGlobal: formData.isGlobal,
        isEventType: true,
      };

      let result;
      if (selectedEventType?._id) {
        result = await onSubmit(eventTypeData, selectedEventType._id);
      } else {
        result = await onSubmit(eventTypeData);
      }

      if (setSelectedEventTypeObj) {
        setSelectedEventTypeObj({
          ...eventTypeData,
          _id: result?._id,
        });
      }

      resetForm();
      onClose();
    } catch (error) {
      setErrors({
        submit: error.response?.data?.detail || "Failed to save event type.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          width: "600px",
          bgcolor: "background.paper",
          borderRadius: 2,
          mx: "auto",
          my: "10vh",
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <CategoryIcon color="primary" />
          <Typography variant="h6" sx={{ flex: 1 }}>
            {selectedEventType ? "Edit Event Type" : "Create Event Type"}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>
          <TextField
            inputRef={nameInputRef}
            label="Event Type Name"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            error={!!errors.name}
            helperText={errors.name}
          />

          <TextField
            label="Event Description"
            name="description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 3 }}
            error={!!errors.description}
            helperText={errors.description}
          />

          {/* Visibility Settings */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "rgba(0,0,0,0.02)", borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              Who can see this event type?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
              True: All users can see this event type
              False: Only Admin/LeaderAt12 can see this event type
            </Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isGlobal === true}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isGlobal: true,
                      }))
                    }
                  />
                }
                label="True"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isGlobal === false}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isGlobal: false,
                      }))
                    }
                  />
                }
                label="False"
              />
            </Box>
          </Box>

          {/* Form Type Settings */}
          <Box sx={{ mb: 3, p: 2, bgcolor: "rgba(0,123,255,0.05)", borderRadius: 1 }}>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Form Type Settings:
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isTicketed}
                  onChange={handleCheckboxChange("isTicketed")}
                />
              }
              label="Ticketed Event"
              sx={{ display: "block" }}
            />
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>How this works:</strong>
              All events show basic fields (Event Name, Date, Location, etc.)
              Ticketed events add price tiers section
              Training events show only basic fields (no price tiers)
              Built-in CELLS events show basic fields + leader @1 and @12 fields
            </Typography>
          </Alert>

          {errors.submit && (
            <Typography color="error" sx={{ mt: 2 }}>
              {errors.submit}
            </Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={handleClose} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EventTypesModal;