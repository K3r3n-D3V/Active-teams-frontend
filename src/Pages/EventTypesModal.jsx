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

  // responsive helpers (smaller devices)
  const { breakpoints } = theme;

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
          width: { xs: "95%", sm: "85%", md: "700px" },
           maxWidth: "700px",
           bgcolor: isDarkMode ? 'background.paper' : 'background.default',
           color: 'text.primary',
           borderRadius: "12px",
           boxShadow: theme.shadows[10],
           overflow: "hidden",
           maxHeight: "90vh",
           display: "flex",
           flexDirection: "column",
           border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
         }}
       >
         {/* Header */}
         <Box
           sx={{
             backgroundColor: isDarkMode ? 'primary.dark' : 'primary.main',
             color: 'primary.contrastText',
             padding: { xs: "12px 16px", sm: "16px 20px", md: "20px 24px" },
             display: "flex",
             justifyContent: "space-between",
             alignItems: "center",
           }}
         >
           <Typography variant="h5" component="h2" sx={{ fontWeight: "bold" }}>
             {selectedEventType ? "Edit Event Type" : "Create New Event Type"}
           </Typography>
           <IconButton
             onClick={handleClose}
             disabled={loading}
             sx={{
               color: 'primary.contrastText',
               '&:hover': {
                 backgroundColor: 'rgba(255, 255, 255, 0.1)',
               },
             }}
           >
             <CloseIcon />
           </IconButton>
         </Box>
 
         {/* Content */}
         <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
           {/* Event Type Name */}
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
             placeholder="Enter event type name..."
             disabled={loading}
             sx={{
               mb: 3,
               '& .MuiOutlinedInput-root': {
                 '&:hover fieldset': {
                   borderColor: 'primary.main',
                 },
               },
             }}
           />

           {/* Checkboxes */}
           <Box
             sx={{
               display: "flex",
               flexWrap: "wrap",
               gap: { xs: 1, sm: 2 },
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
             value={formData.description}
             onChange={handleInputChange}
             error={!!errors.description}
             helperText={
               errors.description || 
               `${descCharCount}/500 characters` +
               (descCharCount > 450 ? " (approaching limit)" : "") +
               " - Describe the purpose and details of this event type"
             }
             placeholder="Enter a detailed description of this event type..."
             disabled={loading}
             sx={{
               mb: 3,
               '& .MuiOutlinedInput-root': {
                 '&:hover fieldset': {
                   borderColor: 'primary.main',
                 },
               },
             }}
           />

           {/* Buttons - responsive: stack on xs */}
           <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3, flexDirection: { xs: "column-reverse", sm: "row" } }}>
             <Button
               variant="outlined"
               onClick={handleClose}
               disabled={loading}
               sx={{ width: { xs: "100%", sm: "auto" }, flex: 1 }}
             >
               Cancel
             </Button>
             <Button
               variant="contained"
               onClick={handleSubmit}
               disabled={loading}
               sx={{ width: { xs: "100%", sm: "auto" }, flex: 1 }}
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