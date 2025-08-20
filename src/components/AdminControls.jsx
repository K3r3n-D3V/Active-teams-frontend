import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { DragDropBoard } from '../People/DragDropBoard'; 
// adjust path based on where DragDropBoard actually lives

export const AdminControls = ({ 
  isOpen, 
  onClose, 
  people, 
  selectedLeader, 
  onLeaderChange,
  isAdmin,
  onAdminToggle,
  currentUser // NEW: pass logged-in user's name here
}) => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    // Extract unique leaders from people data
    let uniqueLeaders = [...new Set(people.map(person => person.cellLeader))];

    // Only super admins can see all leaders
    const superAdmins = ['Gavin Ensline', 'Vicky Ensline'];
    if (!superAdmins.includes(currentUser)) {
      uniqueLeaders = uniqueLeaders.filter(l => l === currentUser);
    }

    setLeaders(uniqueLeaders);
  }, [people, currentUser]);

  const getLeaderStats = (leader) => {
    const leaderPeople = people.filter(person => person.cellLeader === leader);
    const stages = ['Win', 'Consolidate', 'Disciple', 'Send'];
    const stats = stages.map(stage => ({
      stage,
      count: leaderPeople.filter(person => person.stage === stage).length
    }));
    return { total: leaderPeople.length, stages: stats };
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AdminPanelSettings />
          Admin Controls
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {/* Admin Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={isAdmin}
                onChange={(e) => onAdminToggle(e.target.checked)}
              />
            }
            label="Enable Admin Mode"
            sx={{ mb: 3 }}
          />

          {isAdmin && (
            <>
              {/* Leader Filter */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Filter by Cell Leader</InputLabel>
                <Select
                  value={selectedLeader || ''}
                  onChange={(e) => onLeaderChange(e.target.value || null)}
                  label="Filter by Cell Leader"
                >
                  <MenuItem value="">
                    <em>All Leaders</em>
                  </MenuItem>
                  {leaders.map(leader => (
                    <MenuItem key={leader} value={leader}>
                      {leader}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Leader Statistics */}
              {selectedLeader && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedLeader}'s Disciples
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total: {getLeaderStats(selectedLeader).total} people
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {getLeaderStats(selectedLeader).stages.map(({ stage, count }) => (
                      <Chip
                        key={stage}
                        label={`${stage}: ${count}`}
                        variant="outlined"
                        color={count > 0 ? "primary" : "default"}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* All Leaders Overview */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  All Leaders Overview
                </Typography>
                <Stack spacing={1}>
                  {leaders.map(leader => {
                    const stats = getLeaderStats(leader);
                    return (
                      <Box
                        key={leader}
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                        onClick={() => onLeaderChange(leader)}
                      >
                        <Typography variant="subtitle2">{leader}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total: {stats.total}
                        </Typography>
                        <Stack direction="row" spacing={0.5} mt={1}>
                          {stats.stages.map(({ stage, count }) => (
                            <Chip
                              key={stage}
                              label={`${stage}: ${count}`}
                              size="small"
                              variant="outlined"
                              color={count > 0 ? "primary" : "default"}
                            />
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
