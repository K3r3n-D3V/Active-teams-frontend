import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
// import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  useTheme,
  Snackbar,
  Alert,
  Slider,
  IconButton,
  InputAdornment,
  CardContent,
  Container,
  Fade,
  Zoom,
  Paper,
  Chip,
  Tooltip,
  Avatar,
  CircularProgress,
} from "@mui/material";
import Cropper from "react-easy-crop";
import getCroppedImg from "../components/cropImageHelper";
import { UserContext } from "../contexts/UserContext.jsx";
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  Home,
  Cake,
  Group,
  Visibility,
  VisibilityOff,
  Star,
  Church,
  CameraAlt,
} from "@mui/icons-material";
import axios from "axios";

/** Texts */
const carouselTexts = [
  "We are THE ACTIVE CHURCH",
  "A church raising a NEW GENERATION.",
  "A generation that will CHANGE THIS NATION.",
  "To God be the GLORY",
  "Amen.",
];

/** API helpers */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

async function updateUserProfile(data) {
  const userId = localStorage.getItem("userId");
  if (!userId) throw new Error("User ID not found");

  try {
    const res = await axios.put(`${BACKEND_URL}/profile/${userId}`, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Unknown error";
    throw new Error(errorMessage);
  }
}

async function uploadAvatarFromDataUrl(dataUrl) {
  const token = localStorage.getItem("token");
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("avatar", blob, "avatar.png");

  const res = await fetch(`${BACKEND_URL}/users/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("Failed to upload avatar");
  return res.json();
}

export default function Profile() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { userProfile, setUserProfile, setProfilePic, profilePic } =
    useContext(UserContext);

  const fileInputRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppingSrc, setCroppingSrc] = useState(null);
  const [croppingOpen, setCroppingOpen] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
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

  const [originalForm, setOriginalForm] = useState({ ...form });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Carousel effect
  useEffect(() => {
    const t = setInterval(
      () => setCarouselIndex((p) => (p + 1) % carouselTexts.length),
      4000
    );
    return () => clearInterval(t);
  }, []);

  // Load profile data from localStorage (set during login)
  useEffect(() => {
    const loadProfile = () => {
      console.log("=== PROFILE LOAD STARTED ===");
      
      try {
        setLoadingProfile(true);
        
        // Get profile data from localStorage (set during login)
        const storedProfile = localStorage.getItem("userProfile");
        const storedUserId = localStorage.getItem("userId");
        
        console.log("Stored profile exists:", !!storedProfile);
        console.log("Stored user ID:", storedUserId);
        
        if (storedProfile && storedUserId) {
          // Use the data from login - no API call needed!
          const parsedProfile = JSON.parse(storedProfile);
          console.log("Using stored profile from login:", parsedProfile);
          
          setUserProfile(parsedProfile);
          updateFormWithProfile(parsedProfile);
          
          // Set profile picture if available
          const pic = parsedProfile?.profile_picture || parsedProfile?.avatarUrl || parsedProfile?.profilePicUrl || null;
          if (pic && setProfilePic) {
            setProfilePic(pic);
          }
          
          setSnackbar({
            open: true,
            message: "Profile loaded successfully",
            severity: "success",
          });
        } else {
          console.warn("No stored profile data found - user needs to log in");
          setSnackbar({
            open: true,
            message: "Please log in to view your profile",
            severity: "warning",
          });
        }
        
      } catch (error) {
        console.error("Profile load error:", error);
        setSnackbar({
          open: true,
          message: `Failed to load profile: ${error.message}`,
          severity: "error",
        });
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [setUserProfile, setProfilePic]);

  // Helper function to update form with profile data
  const updateFormWithProfile = (profile) => {
    const formData = {
      name: profile?.name || "",
      surname: profile?.surname || "",
      dob: profile?.date_of_birth || "",
      email: profile?.email || "",
      address: profile?.home_address || "",
      phone: profile?.phone_number || "",
      invitedBy: profile?.invited_by || "",
      gender: profile?.gender || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    
    console.log("Updating form with:", formData);
    setForm(formData);
    setOriginalForm(formData);
  };

  // Track changes
  useEffect(() => {
    const changed = Object.keys(form).some((k) => {
      if (["currentPassword", "newPassword", "confirmPassword"].includes(k)) {
        return form.newPassword !== "" || form.confirmPassword !== "";
      }
      return form[k] !== originalForm[k];
    });
    setHasChanges(changed);
  }, [form, originalForm]);

  const togglePasswordVisibility = (field) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    const n = {};
    if (!form.name.trim()) n.name = "Name is required";
    if (!form.surname.trim()) n.surname = "Surname is required";
    if (!form.email.trim()) n.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) n.email = "Email is invalid";

    if (form.newPassword || form.confirmPassword) {
      if (!form.currentPassword.trim())
        n.currentPassword = "Current password is required";
      if (form.newPassword !== form.confirmPassword)
        n.confirmPassword = "Passwords do not match";
    }
    setErrors(n);
    return Object.keys(n).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCancel = () => {
    setForm({ ...originalForm });
    setEditMode(false);
    setErrors({});
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

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const onCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(croppingSrc, croppedAreaPixels);
      try {
        const res = await uploadAvatarFromDataUrl(croppedImage);
        const url = res?.avatarUrl || res?.profile_picture || res?.profilePicUrl;
        if (url && setProfilePic) setProfilePic(url);
      } catch (e) {
        if (setProfilePic) setProfilePic(croppedImage);
        console.error("Avatar upload failed:", e);
      }
      setCroppingOpen(false);
      setSnackbar({
        open: true,
        message: "Profile picture updated",
        severity: "success",
      });
    } catch (e) {
      console.error(e);
      setSnackbar({
        open: true,
        message: "Could not crop image",
        severity: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      name: form.name,
      surname: form.surname,
      date_of_birth: form.dob,
      email: form.email,
      home_address: form.address,
      phone_number: form.phone,
      invited_by: form.invitedBy,
      gender: form.gender,
    };

    try {
      console.log("Updating profile with payload:", payload);

      const updated = await updateUserProfile(payload);
      console.log("Update response:", updated);

      const updatedUserProfile = {
        ...updated,
        _id: updated.id || updated._id,
      };

      setUserProfile(updatedUserProfile);
      // Update localStorage with new data
      localStorage.setItem("userProfile", JSON.stringify(updatedUserProfile));

      setEditMode(false);
      updateFormWithProfile(updatedUserProfile);

      setSnackbar({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
    } catch (err) {
      console.error("Update failed:", err);
      setSnackbar({
        open: true,
        message: `Failed to update profile: ${err.message}`,
        severity: "error",
      });
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    const name = form.name || userProfile?.name || "";
    const surname = form.surname || userProfile?.surname || "";
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  /** Styles */
  const sx = {
    root: {
      minHeight: "70vh",
      bgcolor: isDark ? "#000" : "#fff",
      color: isDark ? "#fff" : "#000",
    },
    heroSection: {
      position: "relative",
      height: "25vh",
      bgcolor: isDark ? "#f2f2f2ff" : "#0c377bff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    carouselText: {
      textAlign: "center",
      color: isDark ? "#fff" : "#000",
      fontWeight: 700,
      fontSize: { xs: "1.5rem", md: "3rem" },
    },
    profileAvatarContainer: {
      position: "absolute",
      bottom: -75,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10,
    },
    profileAvatar: {
      width: 150,
      height: 150,
      border: "6px solid",
      borderColor: isDark ? "#000" : "#fff",
      bgcolor: isDark ? "#1a1a1a" : "#fff",
      color: isDark ? "#fff" : "#000",
      fontSize: "3rem",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: isDark
        ? "0 20px 40px rgba(255,255,255,0.05)"
        : "0 20px 40px rgba(0,0,0,0.2)",
    },
    profileCard: {
      borderRadius: 6,
      overflow: "hidden",
      bgcolor: isDark ? "#111" : "#fafafa",
      color: isDark ? "#fff" : "#000",
    },
    cardHeader: {
      bgcolor: "#000",
      color: "#fff",
      p: 2,
      textAlign: "center",
    },
    sectionHeader: {
      display: "flex",
      alignItems: "center",
      mb: 3,
      gap: 2,
    },
    textField: {
      "& .MuiOutlinedInput-root": {
        borderRadius: 3,
      },
    },
    passwordField: {
      "& .MuiOutlinedInput-root": { borderRadius: 3 },
    },
    cropperModal: {
      position: "fixed",
      inset: 0,
      bgcolor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1300,
      p: 2,
    },
    cropperContainer: {
      position: "relative",
      width: "90vw",
      maxWidth: 520,
      height: 520,
      bgcolor: isDark ? "#111" : "#fff",
      color: isDark ? "#fff" : "#000",
      borderRadius: 3,
      p: 3,
    },
  };

  // Show loading state
  if (loadingProfile) {
    return (
      <Box sx={sx.root}>
        <Container maxWidth="lg" sx={{ pt: 12, pb: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={sx.root}>
      {/* Hero Section */}
      <Box sx={sx.heroSection}>
        <Fade in key={carouselIndex} timeout={800}>
          <Typography variant="h3" sx={sx.carouselText}>
            {carouselTexts[carouselIndex]}
          </Typography>
        </Fade>

        {/* Avatar */}
        <Zoom in timeout={500}>
          <Box sx={sx.profileAvatarContainer}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                sx={sx.profileAvatar}
                src={profilePic}
                onClick={() => fileInputRef.current?.click()}
              >
                {!profilePic && getInitials()}
              </Avatar>
              
              {/* Camera overlay */}
              <IconButton
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  "&:hover": {
                    bgcolor: theme.palette.primary.dark,
                  },
                }}
                size="small"
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraAlt />
              </IconButton>

              <input
                ref={fileInputRef}
                hidden
                accept="image/*"
                type="file"
                onChange={onFileChange}
              />
            </Box>
          </Box>
        </Zoom>
      </Box>

      {/* Profile Card */}
      <Container maxWidth="lg" sx={{ pt: 12, pb: 6 }}>
        <Fade in timeout={600}>
          <Paper elevation={isDark ? 0 : 8} sx={sx.profileCard}>
            <Box sx={sx.cardHeader}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {form.name} {form.surname}
              </Typography>
              <Chip icon={<Church />} label="Active Member" />
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                Welcome! You can edit your profile information below.
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleSubmit}>
                {/* Personal Information */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={sx.sectionHeader}>
                    <Person />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, flexGrow: 1 }}
                    >
                      Personal Information
                    </Typography>
                    <Button
                      startIcon={editMode ? <Save /> : <Edit />}
                      variant={editMode ? "contained" : "outlined"}
                      onClick={() => {
                        if (editMode && hasChanges) {
                          handleSubmit({ preventDefault: () => {} });
                        } else {
                          setEditMode((e) => !e);
                        }
                      }}
                      disabled={editMode && !hasChanges}
                    >
                      {editMode ? "Save Changes" : "Edit Profile"}
                    </Button>
                  </Box>

                  <Grid container spacing={3}>
                    {[
                      { label: "First Name", field: "name", icon: <Person /> },
                      { label: "Last Name", field: "surname", icon: <Person /> },
                      { label: "Email Address", field: "email", icon: <Email /> },
                      { label: "Phone Number", field: "phone", icon: <Phone /> },
                      {
                        label: "Home Address",
                        field: "address",
                        icon: <Home />,
                        multiline: true,
                      },
                      { label: "Invited By", field: "invitedBy", icon: <Group /> },
                      {
                        label: "Date of Birth",
                        field: "dob",
                        type: "date",
                        icon: <Cake />,
                        disabled: true,
                      },
                      {
                        label: "Gender",
                        field: "gender",
                        icon: <Star />,
                        disabled: true,
                      },
                    ].map(
                      ({ label, field, type, icon, multiline, disabled }) => (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            label={label}
                            value={form[field] || ""}
                            onChange={handleChange(field)}
                            fullWidth
                            type={type || "text"}
                            multiline={!!multiline}
                            rows={multiline ? 3 : 1}
                            disabled={disabled || !editMode}
                            error={!!errors[field]}
                            helperText={errors[field]}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  {icon}
                                </InputAdornment>
                              ),
                            }}
                            InputLabelProps={
                              type === "date" ? { shrink: true } : undefined
                            }
                            sx={sx.textField}
                          />
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>

                {/* Security Settings */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={sx.sectionHeader}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Security Settings
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    {[
                      {
                        label: "Current Password",
                        field: "currentPassword",
                        showKey: "current",
                      },
                      {
                        label: "New Password",
                        field: "newPassword",
                        showKey: "new",
                      },
                      {
                        label: "Confirm New Password",
                        field: "confirmPassword",
                        showKey: "confirm",
                      },
                    ].map(({ label, field, showKey }) => (
                      <Grid item xs={12} md={4} key={field}>
                        <TextField
                          label={label}
                          value={form[field] || ""}
                          onChange={handleChange(field)}
                          type={showPassword[showKey] ? "text" : "password"}
                          fullWidth
                          error={!!errors[field]}
                          helperText={errors[field]}
                          autoComplete="new-password"
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() =>
                                    togglePasswordVisibility(showKey)
                                  }
                                  edge="end"
                                >
                                  {showPassword[showKey] ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={sx.passwordField}
                          disabled={!editMode}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "center",
                    pt: 3,
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={!editMode}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={!hasChanges}
                  >
                    Update Profile
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Paper>
        </Fade>
      </Container>

      {/* Cropper Modal */}
      {croppingOpen && (
        <Box
          sx={sx.cropperModal}
          onClick={() => setCroppingOpen(false)}
        >
          <Box
            sx={sx.cropperContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
              Crop Your Profile Picture
            </Typography>
            <Box sx={{ position: "relative", width: "100%", height: 360 }}>
              <Cropper
                image={croppingSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Zoom</Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(_, v) => setZoom(v)}
              />
            </Box>
            <Box
              sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}
            >
              <Button
                variant="outlined"
                onClick={() => setCroppingOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="contained" onClick={onCropSave}>
                Save Picture
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
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ borderRadius: 3, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}