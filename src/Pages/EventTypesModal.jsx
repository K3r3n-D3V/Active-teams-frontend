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
  useMediaQuery, 
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

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isTicketed: false,
    isTraining: false,  
    isGlobal: false,
  });

  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);
  const isDarkMode = theme.palette.mode === "dark";
  console.log("Selected Event Type in Modal:", isDarkMode);

  useEffect(() => {
    if (open && selectedEventType) {
      setFormData({
        name: selectedEventType.name || "",
        description: selectedEventType.description || "",
        isTicketed: !!selectedEventType.isTicketed,
        isTraining: !!selectedEventType.isTraining, 
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
      isTraining: false,  
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
        isTraining: formData.isTraining,
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

   // Calculates modal width based on screen size
  const getModalWidth = () => {
    if (isMobile) return '95%';
    if (isTablet) return '80%';
    return '600px';
  };

  // Calculates vertical margin based on screen size
  const getVerticalMargin = () => {
    if (isMobile) return '5vh';
    return '10vh';
  };


  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      sx={{
        overflow: 'auto',
      }}
    >
      <Box
        sx={{
          width: getModalWidth(),
          maxWidth: '600px',
          minWidth: isMobile ? 'auto' : '400px',
          bgcolor: "background.paper",
          borderRadius: isMobile ? 1 : 2,
          mx: "auto",
          my: getVerticalMargin(),
          maxHeight: isMobile ? '90vh' : '80vh',
          overflow: 'auto',
          boxShadow: 24,
          outline: 'none',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: isMobile ? 1.5 : 2, 
          display: "flex", 
          alignItems: "center", 
          gap: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}>
          <CategoryIcon color="primary" sx={{ fontSize: isMobile ? 20 : 24 }} />
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ flex: 1, fontWeight: 600 }}>
            {selectedEventType ? "Edit Event Type" : "Create Event Type"}
          </Typography>
          <IconButton onClick={handleClose} size={isMobile ? "small" : "medium"}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: isMobile ? 2 : 3 }}>
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
            size={isMobile ? "small" : "medium"}
          />

          <TextField
            label="Event Description"
            name="description"
            fullWidth
            multiline
            rows={isMobile ? 2 : 3}
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 3 }}
            error={!!errors.description}
            helperText={errors.description}
            size={isMobile ? "small" : "medium"}
          />

          {/* Visibility Settings */}
          <Box sx={{ 
            mb: 3, 
            p: isMobile ? 1.5 : 2, 
            bgcolor: "rgba(0,0,0,0.01)", 
            borderRadius: 1 
          }}>
            <Typography fontWeight={600} sx={{ mb: 2, fontSize: isMobile ? '0.95rem' : '1rem' }}>
              isGlobal Event
            </Typography>
            
            <Box sx={{ 
              display: "flex", 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 1 : 2 
            }}>
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
                    size={isMobile ? "small" : "medium"}
                  />
                }
                label="True"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: isMobile ? '0.9rem' : '1rem',
                  }
                }}
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
                    size={isMobile ? "small" : "medium"}
                  />
                }
                label="False"
                sx={{
                  '& .MuiTypography-root': {
                    fontSize: isMobile ? '0.9rem' : '1rem',
                  }
                }}
              />
            </Box>
          </Box>

          {/* Form Type Settings */}
          <Box sx={{ 
            mb: 3, 
            p: isMobile ? 1.5 : 2, 
            bgcolor: "rgba(0,123,255,0.05)", 
            borderRadius: 1 
          }}>
            <Typography fontWeight={600} sx={{ mb: 2, fontSize: isMobile ? '0.95rem' : '1rem' }}>
              Type Settings:
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isTicketed}
                  onChange={handleCheckboxChange("isTicketed")}
                  size={isMobile ? "small" : "medium"}
                />
              }
              label="Ticketed Event"
              sx={{ 
                mb: 2, 
                display: 'block',
                '& .MuiTypography-root': {
                  fontSize: isMobile ? '0.9rem' : '1rem',
                }
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isTraining}
                  onChange={handleCheckboxChange("isTraining")}
                  size={isMobile ? "small" : "medium"}
                />
              }
              label="Training Event"
              sx={{ 
                display: 'block',
                '& .MuiTypography-root': {
                  fontSize: isMobile ? '0.9rem' : '1rem',
                }
              }}
            />
          </Box>

          {errors.submit && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.submit}
            </Alert>
          )}

          {/* Buttons */}
          <Box sx={{ 
            display: "flex", 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: "flex-end", 
            mt: 3,
            gap: isMobile ? 1 : 2,
          }}>
            <Button 
              onClick={handleClose} 
              sx={{ 
                mr: isMobile ? 0 : 2,
                width: isMobile ? '100%' : 'auto',
              }}
              variant="outlined"
              fullWidth={isMobile}
              size={isMobile ? "small" : "medium"}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                width: isMobile ? '100%' : 'auto',
              }}
              fullWidth={isMobile}
              size={isMobile ? "small" : "medium"}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default EventTypesModal;