import React, { useContext, useEffect, useState, useRef } from "react";
import AvatarEditor from "react-avatar-editor";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";

const genders = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function Profile() {
  const { user, accessToken, updateProfilePic } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    dob: "",
    email: "",
    address: "",
    phone: "",
    invitedBy: "",
    gender: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [scale, setScale] = useState(1.2);
  const editorRef = useRef(null);

  // Populate form with user data when loaded
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        surname: user.surname || "",
        dob: user.dob || "",
        email: user.email || "",
        address: user.address || "",
        phone: user.phone || "",
        invitedBy: user.invitedBy || "",
        gender: user.gender || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  // Handle input changes
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Handle profile picture file select
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Upload cropped image to backend or update context (simulate here)
  const handleSaveProfilePic = async () => {
    if (editorRef.current) {
      // Get cropped image as blob
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob(async (blob) => {
        // You can now upload `blob` to backend
        // For demo, we convert to base64 and update context
        const reader = new FileReader();
        reader.onloadend = () => {
          updateProfilePic(reader.result); // update in context
          setSelectedImage(null);
          setSuccessMsg("Profile picture updated");
        };
        reader.readAsDataURL(blob);
      }, "image/png");
    }
  };

  // Validate passwords (if changing)
  const validatePasswords = () => {
    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        setError("New password and confirmation do not match");
        return false;
      }
      if (!form.currentPassword) {
        setError("Please enter current password to change password");
        return false;
      }
    }
    return true;
  };

  // Submit updated profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!validatePasswords()) return;

    setLoading(true);
    try {
      // Prepare payload
      const payload = {
        name: form.name,
        surname: form.surname,
        dob: form.dob,
        email: form.email,
        address: form.address,
        phone: form.phone,
        invitedBy: form.invitedBy,
        gender: form.gender,
      };

      // Include password change if requested
      if (form.currentPassword && form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
        payload.confirmPassword = form.confirmPassword;
      }

      const res = await fetch(`http://localhost:8000/profile/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update profile");
      }

      setSuccessMsg("Profile updated successfully");

      // Optionally refresh user profile after update by refetching or updating context here

      // Clear password fields
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" mb={2}>
        Profile
      </Typography>

      {/* Profile picture section */}
      <Box mb={3} textAlign="center">
        {user?.profilePic ? (
          <img
            src={user.profilePic}
            alt="Profile"
            style={{ width: 120, height: 120, borderRadius: "50%" }}
          />
        ) : (
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: "grey.300",
              display: "inline-block",
            }}
          />
        )}

        <Box mt={1}>
          <input
            accept="image/*"
            id="upload-profile-pic"
            type="file"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
          <label htmlFor="upload-profile-pic">
            <Button variant="outlined" component="span" size="small">
              Change Picture
            </Button>
          </label>
        </Box>
      </Box>

      {/* Image cropping editor */}
      {selectedImage && (
        <Box mb={3} textAlign="center">
          <AvatarEditor
            ref={editorRef}
            image={selectedImage}
            width={150}
            height={150}
            border={50}
            borderRadius={75}
            color={[255, 255, 255, 0.6]} // RGBA
            scale={scale}
            rotate={0}
          />

          <Box mt={2}>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
          </Box>

          <Box mt={2}>
            <Button variant="contained" onClick={handleSaveProfilePic}>
              Save Picture
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={() => setSelectedImage(null)}
              sx={{ ml: 2 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Surname"
          value={form.surname}
          onChange={handleChange("surname")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Date of Birth"
          type="date"
          value={form.dob}
          onChange={handleChange("dob")}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Address"
          value={form.address}
          onChange={handleChange("address")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChange={handleChange("phone")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Invited By"
          value={form.invitedBy}
          onChange={handleChange("invitedBy")}
          fullWidth
          margin="normal"
        />
        <TextField
          select
          label="Gender"
          value={form.gender}
          onChange={handleChange("gender")}
          fullWidth
          margin="normal"
        >
          {genders.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <Typography variant="h6" mt={4}>
          Change Password
        </Typography>
        <TextField
          label="Current Password"
          type="password"
          value={form.currentPassword}
          onChange={handleChange("currentPassword")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="New Password"
          type="password"
          value={form.newPassword}
          onChange={handleChange("newPassword")}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange("confirmPassword")}
          fullWidth
          margin="normal"
        />

        <Box mt={3} textAlign="center">
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Update Profile
          </Button>
        </Box>
      </form>

      {/* Feedback messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={6000}
        onClose={() => setSuccessMsg("")}
      >
        <Alert severity="success" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
