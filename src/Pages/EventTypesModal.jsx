// EventTypesModal.jsx

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
  
  setFormData((prev) => {
    const newData = { ...prev, [name]: checked };
    
    if (name === "isGlobal" && checked) {
      newData.hasPersonSteps = false;
    } else if (name === "hasPersonSteps" && checked) {
      newData.isGlobal = false;
    }
    
    return newData;
  });

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

 // Replace the Modal return statement (around line 170-250)
return (
  <Modal
    open={open}
    onClose={handleClose}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: { xs: "16px", sm: "24px" },
      backdropFilter: "blur(4px)",
    }}
  >
    <Box
      sx={{
        width: { xs: "95%", sm: "85%", md: "620px" },
        maxWidth: "620px",
        bgcolor: darkModeStyles.modalBg,
        color: darkModeStyles.textColor,
        borderRadius: "16px",
        boxShadow: isDarkMode 
          ? "0 24px 48px rgba(0,0,0,0.4)" 
          : "0 24px 48px rgba(0,0,0,0.15)",
        overflow: "hidden",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        border: darkModeStyles.modalBorder,
        position: "relative",
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          zIndex: 1,
        }
      }}
    >
      {/* Header - Enhanced */}
      <Box
        sx={{
          backgroundColor: darkModeStyles.headerBg,
          color: darkModeStyles.headerColor,
          padding: { xs: "20px", sm: "24px" },
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pt: 3, // Extra padding for the gradient bar
        }}
      >
        <Box
          sx={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: isDarkMode 
              ? "rgba(33, 150, 243, 0.1)" 
              : "rgba(33, 150, 243, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${isDarkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.15)'}`,
          }}
        >
          <CategoryIcon 
            color="primary" 
            sx={{ 
              fontSize: "24px",
              color: theme.palette.primary.main 
            }} 
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: "700", 
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
              background: isDarkMode 
                ? `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.secondary.light})`
                : `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {selectedEventType ? "Edit Event Type" : "Create Event Type"}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              mt: 0.5,
              fontSize: "0.875rem",
            }}
          >
            {selectedEventType ? "Update existing event type details" : "Define a new type of event"}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            width: "40px",
            height: "40px",
            color: 'text.secondary',
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
            borderRadius: "10px",
            '&:hover': {
              backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              transform: "rotate(90deg)",
              transition: "transform 0.3s ease",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

        {/* Content */}
        {/* Content - Enhanced Cards */}
      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1, overflow: 'auto' }}>
        {/* Basic Information Card */}
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 3, 
            borderRadius: "14px",
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "#fcfcfc",
            border: `1px solid ${isDarkMode ? theme.palette.divider : "#eaeaea"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              position: "relative",
              paddingLeft: "12px",
            }}>
              <Box sx={{
                position: "absolute",
                left: 0,
                width: "4px",
                height: "24px",
                backgroundColor: theme.palette.primary.main,
                borderRadius: "2px"
              }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: "600", 
                  fontSize: "1rem",
                  color: theme.palette.text.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Basic Information
              </Typography>
            </Box>
            
            {/* Enhanced TextField for Name */}
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{errors.name || "Enter a descriptive name for this event type"}</span>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: nameCharCount > 45 ? "error.main" : nameCharCount > 35 ? "warning.main" : "text.secondary",
                      fontWeight: nameCharCount > 45 ? 600 : 400,
                    }}
                  >
                    {nameCharCount}/50
                  </Typography>
                </Box>
              }
              placeholder="e.g., Cell Group, Conference, Workshop, Training"
              disabled={loading}
              sx={{ 
                mb: 3, 
                '& .MuiOutlinedInput-root': {
                  borderRadius: "10px",
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#fff",
                  transition: "all 0.2s ease",
                  '&:hover': {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#f9f9f9",
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.07)" : "#fff",
                    boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                }
              }}
            />

            {/* Enhanced TextField for Description */}
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{errors.description || "Describe the purpose and characteristics"}</span>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: descCharCount > 450 ? "error.main" : descCharCount > 400 ? "warning.main" : "text.secondary",
                      fontWeight: descCharCount > 450 ? 600 : 400,
                    }}
                  >
                    {descCharCount}/500
                  </Typography>
                </Box>
              }
              placeholder="Describe the purpose and characteristics of this event type..."
              disabled={loading}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: "10px",
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#fff",
                  transition: "all 0.2s ease",
                  '&:hover': {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#f9f9f9",
                  },
                  '&.Mui-focused': {
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.07)" : "#fff",
                    boxShadow: `0 0 0 3px ${theme.palette.primary.main}15`,
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 500,
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Event Type Settings Card - Enhanced */}
        <Card 
          variant="outlined" 
          sx={{ 
            borderRadius: "14px",
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.02)" : "#fcfcfc",
            border: `1px solid ${isDarkMode ? theme.palette.divider : "#eaeaea"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            overflow: "visible",
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              position: "relative",
              paddingLeft: "12px",
            }}>
              <Box sx={{
                position: "absolute",
                left: 0,
                width: "4px",
                height: "24px",
                backgroundColor: theme.palette.secondary.main,
                borderRadius: "2px"
              }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: "600", 
                  fontSize: "1rem",
                  color: theme.palette.text.primary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Event Type Settings
              </Typography>
            </Box>

            {/* Add the enhanced checkbox cards here (the ones I showed you) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
              }}
            >
              {/* Ticketed Event Checkbox - Enhanced */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${formData.isTicketed ? theme.palette.warning.main + '40' : isDarkMode ? theme.palette.divider : "#e0e0e0"}`,
                  backgroundColor: formData.isTicketed 
                    ? isDarkMode 
                      ? "rgba(255, 152, 0, 0.05)" 
                      : "rgba(255, 152, 0, 0.03)"
                    : "transparent",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: formData.isTicketed ? theme.palette.warning.main : theme.palette.primary.main,
                    backgroundColor: formData.isTicketed 
                      ? isDarkMode 
                        ? "rgba(255, 152, 0, 0.08)" 
                        : "rgba(255, 152, 0, 0.05)"
                      : isDarkMode 
                        ? "rgba(255,255,255,0.03)" 
                        : "rgba(0,0,0,0.02)",
                  }
                }}
                onClick={() => {
                  if (!loading) {
                    handleCheckboxChange("isTicketed")({ target: { checked: !formData.isTicketed } });
                  }
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <Checkbox
                      name="isTicketed"
                      checked={formData.isTicketed}
                      onChange={handleCheckboxChange("isTicketed")}
                      color="warning"
                      disabled={loading}
                      sx={{ 
                        mr: 1.5,
                        '&.Mui-checked': {
                          color: theme.palette.warning.main,
                        }
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          Ticketed Event
                        </Typography>
                        {formData.isTicketed && (
                          <Box sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            backgroundColor: theme.palette.warning.main + '20',
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: theme.palette.warning.dark,
                          }}>
                            SELECTED
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: "0.85rem" }}>
                        Requires payment or ticket purchase for attendance
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Global Event Checkbox - Enhanced */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${formData.isGlobal ? theme.palette.info.main + '40' : isDarkMode ? theme.palette.divider : "#e0e0e0"}`,
                  backgroundColor: formData.isGlobal 
                    ? isDarkMode 
                      ? "rgba(33, 150, 243, 0.05)" 
                      : "rgba(33, 150, 243, 0.03)"
                    : "transparent",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: formData.isGlobal ? theme.palette.info.main : theme.palette.primary.main,
                    backgroundColor: formData.isGlobal 
                      ? isDarkMode 
                        ? "rgba(33, 150, 243, 0.08)" 
                        : "rgba(33, 150, 243, 0.05)"
                      : isDarkMode 
                        ? "rgba(255,255,255,0.03)" 
                        : "rgba(0,0,0,0.02)",
                  }
                }}
                onClick={() => {
                  if (!loading) {
                    handleCheckboxChange("isGlobal")({ target: { checked: !formData.isGlobal } });
                  }
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <Checkbox
                      name="isGlobal"
                      checked={formData.isGlobal}
                      onChange={handleCheckboxChange("isGlobal")}
                      color="info"
                      disabled={loading}
                      sx={{ 
                        mr: 1.5,
                        '&.Mui-checked': {
                          color: theme.palette.info.main,
                        }
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          Global Event
                        </Typography>
                        {formData.isGlobal && (
                          <Box sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            backgroundColor: theme.palette.info.main + '20',
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: theme.palette.info.dark,
                          }}>
                            SELECTED
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: "0.85rem" }}>
                        Organization-wide events (not tied to personal steps)
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Personal Steps Event Checkbox - Enhanced */}
              <Card
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  border: `1px solid ${formData.hasPersonSteps ? theme.palette.secondary.main + '40' : isDarkMode ? theme.palette.divider : "#e0e0e0"}`,
                  backgroundColor: formData.hasPersonSteps 
                    ? isDarkMode 
                      ? "rgba(156, 39, 176, 0.05)" 
                      : "rgba(156, 39, 176, 0.03)"
                    : "transparent",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: formData.hasPersonSteps ? theme.palette.secondary.main : theme.palette.primary.main,
                    backgroundColor: formData.hasPersonSteps 
                      ? isDarkMode 
                        ? "rgba(156, 39, 176, 0.08)" 
                        : "rgba(156, 39, 176, 0.05)"
                      : isDarkMode 
                        ? "rgba(255,255,255,0.03)" 
                        : "rgba(0,0,0,0.02)",
                  }
                }}
                onClick={() => {
                  if (!loading) {
                    handleCheckboxChange("hasPersonSteps")({ target: { checked: !formData.hasPersonSteps } });
                  }
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <Checkbox
                      name="hasPersonSteps"
                      checked={formData.hasPersonSteps}
                      onChange={handleCheckboxChange("hasPersonSteps")}
                      color="secondary"
                      disabled={loading}
                      sx={{ 
                        mr: 1.5,
                        '&.Mui-checked': {
                          color: theme.palette.secondary.main,
                        }
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          Personal Steps Event
                        </Typography>
                        {formData.hasPersonSteps && (
                          <Box sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: "4px",
                            backgroundColor: theme.palette.secondary.main + '20',
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: theme.palette.secondary.dark,
                          }}>
                            SELECTED
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: "0.85rem" }}>
                        Cell groups or discipleship meetings with leader hierarchy
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {errors.submit && (
              <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
                {errors.submit}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Buttons - Enhanced */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          gap: 2, 
          mt: 4,
          pt: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={loading}
            sx={{ 
              minWidth: '100px',
              borderRadius: "10px",
              padding: "10px 24px",
              fontWeight: 600,
              fontSize: "0.95rem",
              textTransform: "none",
              letterSpacing: "0.3px",
              borderColor: isDarkMode ? "rgba(255,255,255,0.23)" : "rgba(0,0,0,0.23)",
              color: theme.palette.text.primary,
              "&:hover": {
                borderColor: theme.palette.primary.main,
                backgroundColor: isDarkMode 
                  ? "rgba(33, 150, 243, 0.08)" 
                  : "rgba(33, 150, 243, 0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ 
              minWidth: '140px',
              borderRadius: "10px",
              padding: "10px 32px",
              fontWeight: 600,
              fontSize: "0.95rem",
              textTransform: "none",
              letterSpacing: "0.3px",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: "0 4px 12px rgba(33, 150, 243, 0.3)",
              "&:hover": {
                background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: "0 6px 20px rgba(33, 150, 243, 0.4)",
                transform: "translateY(-2px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
              "&.Mui-disabled": {
                background: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                color: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.26)",
                boxShadow: "none",
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ 
                  width: "16px", 
                  height: "16px", 
                  border: "2px solid rgba(255,255,255,0.3)", 
                  borderTopColor: "#fff", 
                  borderRadius: "50%", 
                  animation: "spin 1s linear infinite",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" }
                  }
                }} />
                Saving...
              </Box>
            ) : selectedEventType ? "Update Event Type" : "Create Event Type"}
          </Button>
        </Box>
      </Box>
      </Box>
    </Modal>
  );
};

export default EventTypesModal;