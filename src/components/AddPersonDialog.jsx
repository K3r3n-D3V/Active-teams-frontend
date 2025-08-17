// AddPersonDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
} from "@mui/material";

export default function AddPersonDialog({ open, onClose, onSave, formData, setFormData }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add New Person</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {/* Left column */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Name :"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <TextField
              label="Date Of Birth :"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <TextField
              label="Home Address :"
              name="homeAddress"
              value={formData.homeAddress}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <TextField
              label="Invited By :"
              name="invitedBy"
              value={formData.invitedBy}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          </Grid>

          {/* Right column */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Surname :"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <TextField
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <TextField
              label="Phone Number :"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
            <TextField
              label="Gender :"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              fullWidth
              size="small"
              margin="dense"
              sx={{
                borderRadius: 2,
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          sx={{
            backgroundColor: "black",
            color: "white",
            "&:hover": { backgroundColor: "#222" },
            borderRadius: 2,
            minWidth: 120,
            px: 3,
          }}
        >
          Save Details
        </Button>
      </DialogActions>
    </Dialog>
  );
}
