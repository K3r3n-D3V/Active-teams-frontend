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
  Card,
  CardContent,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import PublicIcon from '@mui/icons-material/Public';

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
    hasPersonSteps: false,
  });

  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);
  const isDarkMode = theme.palette.mode === "dark";

  const darkModeStyles = {
    modalBg: isDarkMode ? theme.palette.background.paper : "#fff",
    modalBorder: isDarkMode ? `1px solid ${theme.palette.divider}` : "1px solid rgba(0,0,0,0.08)",
    headerBg: isDarkMode ? theme.palette.background.default : "#f8f9fa",
    headerColor: theme.palette.text.primary,
    textColor: theme.palette.text.primary,
    input: {
      "& .MuiOutlinedInput-root": {
        bgcolor: isDarkMode ? "#272727" : "#fff",
        color: theme.palette.text.primary,
        "& fieldset": {
          borderColor: isDarkMode ? theme.palette.divider : "rgba(0,0,0,0.23)",
        },
        "&:hover fieldset": {
          borderColor: theme.palette.primary.main,
        },
        "&.Mui-focused fieldset": {
          borderColor: theme.palette.primary.main,
        },
      },
      "& .MuiFormHelperText-root": {
        color: isDarkMode ? theme.palette.text.secondary : "rgba(0,0,0,0.6)",
      },
      "& .MuiInputLabel-root": {
        color: isDarkMode ? theme.palette.text.secondary : "rgba(0,0,0,0.6)",
      },
    },
    formControlLabel: {
      color: theme.palette.text.primary,
    },
  };

  useEffect(() => {
    if (open && selectedEventType) {
      setFormData({
        name: selectedEventType.name || "",
        description: selectedEventType.description || "",
        isTicketed: !!selectedEventType.isTicketed,
        isGlobal: !!selectedEventType.isGlobal,
        hasPersonSteps: !!selectedEventType.hasPersonSteps,
      });
    } else if (open && !selectedEventType) {
      resetForm();
    }
  }, [selectedEventType, open]);

  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

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

  const handleCheckboxChange = (name) => (event) => {
    const { checked } = event.target;
    
    setFormData((prev) => ({ ...prev, [name]: checked }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const nameCharCount = formData.name ? formData.name.length : 0;
  const descCharCount = formData.description ? formData.description.length : 0;

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSubmit();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isTicketed: false,
      isGlobal: false,
      hasPersonSteps: false,
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm() || loading) return;

    setLoading(true);
    try {
      const eventTypeName = formData.name.trim();
      
      const eventTypeData = {
        name: eventTypeName,
        description: formData.description.trim(),
        isTicketed: formData.isTicketed,
        isGlobal: formData.isGlobal,
        hasPersonSteps: formData.hasPersonSteps,
      };

      let result;
      if (selectedEventType && (selectedEventType.name || selectedEventType._id)) {
        result = await onSubmit(eventTypeData, selectedEventType._id || selectedEventType.name);
      } else {
        result = await onSubmit(eventTypeData);
      }

      if (setSelectedEventTypeObj) {
        const completeEventType = {
          ...eventTypeData,
          name: eventTypeName,
          _id: selectedEventType?._id || result?._id || result?.id,
        };
        
        setSelectedEventTypeObj(completeEventType);
      }

      resetForm();
      onClose();
      return result;
    } catch (error) {
      if (error.response?.data?.detail) {
        setErrors({ submit: error.response.data.detail });
      } else {
        setErrors({ submit: "Failed to save event type. Please try again." });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    
    if (typeof onClose === "function") onClose();
  };

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
          width: { xs: "95%", sm: "85%", md: "600px" },
          maxWidth: "600px",
          bgcolor: darkModeStyles.modalBg,
          color: darkModeStyles.textColor,
          borderRadius: 2,
          boxShadow: theme.shadows[10],
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          border: darkModeStyles.modalBorder,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            backgroundColor: darkModeStyles.headerBg,
            color: darkModeStyles.headerColor,
            padding: { xs: "16px 20px", sm: "20px 24px" },
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <CategoryIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: "600", fontSize: "1.25rem" }}>
              {selectedEventType ? "Edit Event Type" : "Create Event Type"}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {selectedEventType ? "Update existing event type details" : "Define a new type of event"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            disabled={loading}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
            
              <TextField
                inputRef={nameInputRef}
                label="Event Type Name"
                name="name"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                error={!!errors.name}
                helperText={
                  errors.name || 
                  `${nameCharCount}/50 characters` +
                  (nameCharCount > 45 ? " (approaching limit)" : "")
                }
                placeholder="e.g., Cell Group, Conference, Workshop, Training"
                disabled={loading}
                sx={{ mb: 3, ...darkModeStyles.input }}
              />

              <TextField
                label="Event Description"
                name="description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                error={!!errors.description}
                helperText={
                  errors.description || 
                  `${descCharCount}/500 characters` +
                  (descCharCount > 450 ? " (approaching limit)" : "")
                }
                placeholder="Describe the purpose and characteristics of this event type..."
                disabled={loading}
                sx={{ ...darkModeStyles.input }}
              />

              {/* IsGlobal option placed right below the Description box */}
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 2,
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ color: 'text.primary' }}>
                  IsGlobal Event:
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isGlobalTrue"
                      checked={formData.isGlobal === true}
                      onChange={() => setFormData(prev => ({ ...prev, isGlobal: true }))}
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label="True"
                  sx={{ color: darkModeStyles.formControlLabel.color }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isGlobalFalse"
                      checked={formData.isGlobal === false}
                      onChange={() => setFormData(prev => ({ ...prev, isGlobal: false }))}
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label="False"
                  sx={{ color: darkModeStyles.formControlLabel.color }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "600", mb: 2 }}>
                Event Type Settings
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
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
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">
                        Ticketed Event
                      </Typography>
                   
                    </Box>
                  }
                  sx={{ color: darkModeStyles.formControlLabel.color, alignItems: 'flex-start' }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      name="hasPersonSteps"
                      checked={formData.hasPersonSteps}
                      onChange={handleCheckboxChange("hasPersonSteps")}
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="500">
                        Training
                      </Typography>

                    </Box>
                  }
                  sx={{ color: darkModeStyles.formControlLabel.color, alignItems: 'flex-start' }}
                />
              </Box>

              {errors.submit && (
                <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
                  {errors.submit}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
              sx={{ minWidth: '100px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ minWidth: '120px' }}
            >
              {loading ? "Saving..." : selectedEventType ? "Update" : "Create"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EventTypesModal;