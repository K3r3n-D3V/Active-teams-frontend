import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Button,
  Avatar,
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
} from "@mui/material";
import Cropper from "react-easy-crop";
import getCroppedImg from "../components/cropImageHelper";
import { UserContext } from "../contexts/UserContext.jsx";
import {
  Logout,
  PhotoCamera,
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
} from "@mui/icons-material";

/** Texts */
const carouselTexts = [
  "We are THE ACTIVE CHURCH",
  "A church raising a NEW GENERATION.",
  "A generation that will CHANGE THIS NATION.",
  "To God be the GLORY",
  "Amen.",
];

/** API helpers */
const API_BASE = import.meta.env.VITE_BACKEND_URL;

async function fetchUserProfile() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function updateUserProfile(userId, data) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/profile/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

async function uploadAvatarFromDataUrl(dataUrl) {
  const token = localStorage.getItem("token");
  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("avatar", blob, "avatar.png");

  const res = await fetch(`${API_BASE}/users/me/avatar`, {
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
  const navigate = useNavigate();
  const { userProfile, setUserProfile, profilePic, setProfilePic } =
    useContext(UserContext);

  const fileInputRef = useRef(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppingSrc, setCroppingSrc] = useState(null);
  const [croppingOpen, setCroppingOpen] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

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

  useEffect(() => {
    const t = setInterval(
      () => setCarouselIndex((p) => (p + 1) % carouselTexts.length),
      4000
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUserProfile();
        setUserProfile(data);
        const pic =
          data?.profile_picture ||
          data?.avatarUrl ||
          data?.profilePicUrl ||
          null;
        if (pic) setProfilePic(pic);

        const synced = {
          name: data?.name || "",
          surname: data?.surname || "",
          dob: data?.date_of_birth || "",
          email: data?.email || "",
          address: data?.home_address || "",
          phone: data?.phone_number || "",
          invitedBy: data?.invited_by || "",
          gender: data?.gender || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        };
        setForm(synced);
        setOriginalForm(synced);
      } catch (e) {
        console.warn("Profile fetch failed:", e);
      }
    })();
  }, [setUserProfile, setProfilePic]);

  useEffect(() => {
    if (userProfile) {
      const n = {
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
      };
      setForm(n);
      setOriginalForm(n);
    }
  }, [userProfile]);

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
        const url =
          res?.avatarUrl || res?.profile_picture || res?.profilePicUrl;
        if (url) setProfilePic(url);
      } catch (e) {
        setProfilePic(croppedImage), e;
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
      console.log("Submitting form data:", form);
    if (!validate()) return;

    try {
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

      const updated = await updateUserProfile(userProfile?._id, payload);

      setSnackbar({
        open: true,
        message: updated.message || "Profile updated successfully",
        severity: "success",
      });
      setEditMode(false);
      setOriginalForm(form);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to update profile: ${err.message}`,
        severity: "error",
      });
    }
  };

  /** Styles */
  const sx = {
    root: {
      minHeight: "90vh",
      bgcolor: isDark ? "#000" : "#fff",
      color: isDark ? "#fff" : "#000",
    },
    heroSection: {
      position: "relative",
      height: "30vh",
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
      p: 4,
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
    topRightLogout: {
      position: "fixed",
      top: 12,
      right: 16,
      zIndex: 1000,
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setSnackbar({ open: true, message: "Logged out", severity: "info" });
    navigate("/login");
  };

  return (
    <Box sx={sx.root}>
      {/* Logout button */}
      <Tooltip title="Logout">
        <IconButton
          onClick={handleLogout}
          sx={sx.topRightLogout}
          aria-label="logout"
          size="large"
        >
          <Logout />
        </IconButton>
      </Tooltip>

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
                src={profilePic || undefined}
                sx={sx.profileAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                {!profilePic &&
                  (form?.name?.charAt(0) || "") +
                    (form?.surname?.charAt(0) || "")}
              </Avatar>
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
                            value={form[field]}
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
                          value={form[field]}
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
