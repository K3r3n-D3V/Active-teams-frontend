import React, { useState, useCallback, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  Avatar,
  Snackbar,
  Alert,
  Slider,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Cropper from "react-easy-crop";
import getCroppedImg from "../components/cropImageHelper";
import { UserContext } from "../contexts/UserContext.jsx";
import LogoutIcon from '@mui/icons-material/Logout';
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const carouselTexts = [
  "We are THE ACTIVE CHURCH",
  "A church raising a NEW GENERATION.",
  "A generation that will CHANGE THIS NATION.",
  "To God be the GLORY",
  "Amen.",
];

export default function Profile() {
  const navigate = useNavigate();
  const { userProfile, setUserProfile, profilePic, setProfilePic, clearUserData } = useContext(UserContext);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppingSrc, setCroppingSrc] = useState(null);
  const [croppingOpen, setCroppingOpen] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [form, setForm] = useState({
    name: userProfile?.name || "",
    surname: userProfile?.surname || "",
    dob: userProfile?.date_of_birth || "",
    email: userProfile?.email || "",
    address: userProfile?.home_address || "",
    phone: userProfile?.phone_number || "",
    invitedBy: userProfile?.invited_by || "",
    gender: userProfile?.gender || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [carouselIndex, setCarouselIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselTexts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Update form when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || "",
        surname: userProfile.surname || "",
        dob: userProfile.date_of_birth || "",
        email: userProfile.email || "",
        address: userProfile.home_address || "",
        phone: userProfile.phone_number || "",
        invitedBy: userProfile.invited_by || "",
        gender: userProfile.gender || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [userProfile]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.surname.trim()) newErrors.surname = "Surname is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Email is invalid";
    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCroppingSrc(reader.result);
        setCroppingOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(croppingSrc, croppedAreaPixels);
      setProfilePic(croppedImage);
      setCroppingOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Update user profile in context
      const updatedProfile = {
        name: form.name,
        surname: form.surname,
        date_of_birth: form.dob,
        email: form.email,
        home_address: form.address,
        phone_number: form.phone,
        invited_by: form.invitedBy,
        gender: form.gender,
      };
      setUserProfile(updatedProfile);
      
      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
      // API call here if needed
    } else {
      setSnackbar({
        open: true,
        message: "Please fix errors",
        severity: "error",
      });
    }
  };

  return (
    <>
      {/* Carousel with bigger text */}
      <Box
        sx={{
          bgcolor: "#e8a6a4",
          py: 4,
          textAlign: "center",
          color: "black",
          fontWeight: "bold",
          fontSize: { xs: 20, sm: 28, md: 32 },
          letterSpacing: 1,
          minHeight: 150,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          position: "relative",
        }}
      >
        {carouselTexts[carouselIndex].split(" ").map((word, i) => {
          const boldWords = [
            "THE",
            "ACTIVE",
            "CHURCH",
            "NEW",
            "GENERATION",
            "CHANGE",
            "THIS",
            "NATION",
            "GLORY",
          ];
          if (boldWords.includes(word.toUpperCase())) {
            return (
              <Typography
                key={i}
                component="span"
                sx={{ fontWeight: 700, mr: 0.75 }}
              >
                {word}{" "}
              </Typography>
            );
          }
          return (
            <Typography key={i} component="span" sx={{ mr: 0.5 }}>
              {word}{" "}
            </Typography>
          );
        })}

        {/* Profile pic overlapping top half - only show when user has profile */}
        {userProfile && (
          <>
            <Box
              sx={{
                position: "absolute",
                bottom: -60, // half of avatar height (~120/2)
                left: "20%",
                transform: "translateX(-50%)",
                width: 120,
                height: 120,
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "0 0 12px rgba(0,0,0,0.3)",
                border: "4px solid white",
                bgcolor: "#e8a6a4",
                zIndex: 10,
                cursor: "pointer", // Make it clickable to trigger file input
              }}
              onClick={() =>
                document.getElementById("profile-image-upload").click()
              } // Triggers file input on click
            >
              <Avatar
                src={profilePic}
                alt="Profile Picture"
                sx={{
                  width: "100%",
                  height: "200%",
                  position: "relative",
                  top: "-50%",
                }}
              >
                {!profilePic && userProfile && `${userProfile.name?.charAt(0)}${userProfile.surname?.charAt(0)}`}
              </Avatar>
            </Box>

            {/* Hidden file input to update the profile picture */}
            <input
              id="profile-image-upload"
              hidden
              accept="image/*"
              type="file"
              onChange={onFileChange}
            />
          </>
        )}
      </Box>

      {/* Form Section */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 900,
          mx: "auto",
          px: 3,
          pt: 12,
          bgcolor: "background.paper",
          color: "text.primary",
          minHeight: "calc(100vh - 100px)",
        }}
        noValidate
        autoComplete="off"
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
          {userProfile ? `${userProfile.name} ${userProfile.surname}` : "Profile"}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {userProfile ? "Welcome! You can edit your profile right here." : "Please sign up to view your profile."}
        </Typography>

        {!userProfile ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              No profile data available
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/signup")}
              sx={{ bgcolor: "black", color: "white" }}
            >
              Sign Up
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={4}>
              {[
                { label: "Name", field: "name" },
                { label: "Surname", field: "surname" },
                { label: "Date Of Birth", field: "dob", type: "date" },
                { label: "Email Address", field: "email" },
                {
                  label: "Home Address",
                  field: "address",
                  multiline: true,
                  rows: 2,
                },
                { label: "Phone Number", field: "phone" },
                { label: "Invited By", field: "invitedBy" },
                { label: "Gender", field: "gender" },
              ].map(({ label, field, type, multiline, rows }) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    label={label}
                    value={form[field]}
                    onChange={handleChange(field)}
                    fullWidth
                    size="small"
                    variant="outlined"
                    type={type || "text"}
                    multiline={multiline || false}
                    rows={rows || 1}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "background.paper",
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                    InputLabelProps={type === "date" ? { shrink: true } : undefined}
                  />
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 5 }}>
              <Typography sx={{ mb: 1 }}>
                Please enter your current password to change your password
              </Typography>

              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Current Password"
                    value={form.currentPassword}
                    onChange={handleChange("currentPassword")}
                    type="password"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="New Password"
                    value={form.newPassword}
                    onChange={handleChange("newPassword")}
                    type="password"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    type="password"
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mt: 5, display: "flex", gap: 2, maxWidth: 500 }}>
              <Button
                variant="outlined"
                disabled
                sx={{
                  flex: 1,
                  color: "text.disabled",
                  borderColor: "text.disabled",
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ flex: 1, bgcolor: "black", color: "white",px: 2,
                  py: 0.5, }}
                type="submit"
              >
                Update Profile
              </Button>
              <Button
                variant="contained"
                sx={{ flex: 1, bgcolor: "black", color: "white",px: 2,
                  py: 0.5, }}
                onClick={() => {
                  // Clear all user data
                  clearUserData();

                  // Show snackbar
                  setSnackbar({
                    open: true,
                    message: "Logged out successfully!",
                    severity: "info",
                  });

                  // Redirect to login
                  navigate("/login");
                }}
              >
                <LogoutIcon fontSize="small" />
                Logout
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Cropper Modal - only show when user has profile */}
      {croppingOpen && userProfile && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            p: 2,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "90vw",
              maxWidth: 400,
              height: 400,
              bgcolor: "background.paper",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Cropper
              image={croppingSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom color="text.primary">
                Zoom
              </Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="zoom-slider"
                onChange={(e, zoom) => setZoom(zoom)}
              />
            </Box>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button variant="outlined" onClick={() => setCroppingOpen(false)}>
                Cancel
              </Button>
              <Button variant="contained" onClick={onCropSave}>
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
