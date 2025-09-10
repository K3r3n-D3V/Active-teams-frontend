import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';

const EventsFilter = ({
  open,
  onClose,
  onApplyFilter,
  currentFilters = {},
  eventTypes = [],
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [selectedFilters, setSelectedFilters] = useState({
    eventType: '',
    eventName: '',
  });

  useEffect(() => {
    setSelectedFilters(prevFilters => ({
      ...prevFilters,
      ...currentFilters
    }));
  }, [currentFilters, open]);

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApplyFilter = () => {
    const activeFilters = Object.entries(selectedFilters).reduce((acc, [key, value]) => {
      if (value && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
    onApplyFilter(activeFilters);
    onClose();
  };

  const handleResetFilters = () => {
    setSelectedFilters({
      eventType: '',
      eventName: '',
    });
  };

  const handleClearAllFilters = () => {
    handleResetFilters();
    onApplyFilter({});
    onClose();
  };

  const activeFilterCount = Object.values(selectedFilters).filter(value => value && value !== '').length;

  const darkModeStyles = {
    dialog: {
      '& .MuiDialog-paper': {
        bgcolor: isDarkMode ? '#1e1e1e' : 'white',
        color: isDarkMode ? '#ffffff' : 'inherit',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '90%'
      }
    },
    select: {
      '& .MuiOutlinedInput-root': {
        bgcolor: isDarkMode ? '#2d2d2d' : 'white',
        color: isDarkMode ? '#ffffff' : 'inherit',
        '& fieldset': {
          borderColor: isDarkMode ? '#555' : 'rgba(0, 0, 0, 0.23)',
        },
        '&:hover fieldset': {
          borderColor: isDarkMode ? '#777' : 'rgba(0, 0, 0, 0.87)',
        },
        '&.Mui-focused fieldset': {
          borderColor: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
        },
      },
      '& .MuiInputLabel-root': {
        color: isDarkMode ? '#bbb' : 'rgba(0, 0, 0, 0.6)',
        '&.Mui-focused': {
          color: isDarkMode ? theme.palette.primary.main : theme.palette.primary.main,
        },
      },
    },
    menuProps: {
      PaperProps: {
        sx: {
          bgcolor: isDarkMode ? '#2d2d2d' : 'white',
          '& .MuiMenuItem-root': {
            color: isDarkMode ? '#ffffff' : 'inherit',
            '&:hover': {
              bgcolor: isDarkMode ? '#3d3d3d' : 'rgba(0, 0, 0, 0.04)',
            },
            '&.Mui-selected': {
              bgcolor: isDarkMode ? '#404040' : 'rgba(25, 118, 210, 0.08)',
              '&:hover': {
                bgcolor: isDarkMode ? '#4a4a4a' : 'rgba(25, 118, 210, 0.12)',
              },
            },
          },
        },
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={darkModeStyles.dialog}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterListIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Filter Events
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={`${activeFilterCount} active`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Event Type Filter */}
          <FormControl fullWidth sx={darkModeStyles.select}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={selectedFilters.eventType}
              label="Event Type"
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              MenuProps={darkModeStyles.menuProps}
            >
              <MenuItem value="">
                <em>All Event Types</em>
              </MenuItem>
              {eventTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Event Name Filter */}
          <TextField
            fullWidth
            label="Event Name"
            value={selectedFilters.eventName}
            onChange={(e) => handleFilterChange('eventName', e.target.value)}
            variant="outlined"
            sx={darkModeStyles.select}
          />

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{
                color: isDarkMode ? '#bbb' : 'text.secondary',
                mb: 1
              }}>
                Active Filters:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(selectedFilters).map(([key, value]) => {
                  if (!value || value === '') return null;

                  const filterLabels = {
                    eventType: 'Type',
                    eventName: 'Name',
                  };

                  return (
                    <Chip
                      key={key}
                      label={`${filterLabels[key]}: ${value}`}
                      size="small"
                      onDelete={() => handleFilterChange(key, '')}
                      deleteIcon={<ClearIcon />}
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Box display="flex" gap={2} width="100%" flexWrap="wrap">
          <Button
            onClick={handleResetFilters}
            variant="outlined"
            startIcon={<ClearIcon />}
            sx={{
              color: isDarkMode ? '#ffffff' : 'primary.main',
              borderColor: isDarkMode ? '#555' : 'primary.main',
              '&:hover': {
                borderColor: isDarkMode ? '#777' : 'primary.dark',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 118, 210, 0.04)',
              }
            }}
          >
            Reset
          </Button>

          <Button
            onClick={handleClearAllFilters}
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
          >
            Clear All
          </Button>

          <Button
            onClick={handleApplyFilter}
            variant="contained"
            startIcon={<FilterListIcon />}
            sx={{ minWidth: 120 }}
          >
            Apply Filter
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EventsFilter;
