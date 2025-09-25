import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useRef,
} from "react";
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
  Container,
  Fade,
  Paper,
  Avatar,
  Card,
  CardContent,
  Divider,
  Skeleton,
} from "@mui/material";
import Cropper from "react-easy-crop";
import getCroppedImg from "../components/cropImageHelper";
import { UserContext } from "../contexts/UserContext.jsx";
import {
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  CameraAlt,
} from "@mui/icons-material";
import axios from "axios";

/** Texts with colors */
const carouselTexts = [
  { text: "We are THE ACTIVE CHURCH", color: "#1976d2" },
  { text: "A church raising a NEW GENERATION", color: "#7b1fa2" },
  { text: "A generation that will CHANGE THIS NATION", color: "#d32f2f" },
  { text: "Amen.", color: "#2e7d32" },
];

/** API helpers */
const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

const createAuthenticatedRequest = () => {
  const token = localStorage.getItem("token");
  return axios.create({
    baseURL: BACKEND_URL,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : undefined,
    },
  });
};

async function updateUserProfile(data) {
  const userId = localStorage.getItem("userId");
  if (!userId) throw new Error("User ID not found");

  try {
    const api = createAuthenticatedRequest();
    const res = await api.put(`/profile/${userId}`, data);
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
  const userId = localStorage.getItem("userId");
  if (!token || !userId) throw new Error("Authentication required");

  const blob = await (await fetch(dataUrl)).blob();
  const form = new FormData();
  form.append("avatar", blob, "avatar.png");

  const res = await fetch(`${BACKEND_URL}/users/${userId}/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to upload avatar" }));
    throw new Error(error.message || "Failed to upload avatar");
  }
  
  return res.json();
}

async function updatePassword(currentPassword, newPassword) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) throw new Error("Authentication required");

  try {
    const res = await axios.put(`${BACKEND_URL}/users/${userId}/password`, {
      currentPassword,
      newPassword
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    return res.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update password";
    throw new Error(errorMessage);
  }
}

async function fetchUserProfile() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  
  if (!userId || !token) throw new Error("Authentication required");

  try {
    const api = createAuthenticatedRequest();
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch profile";
    throw new Error(errorMessage);
  }
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
  
  // NEW: Track if profile has been loaded at least once
  const [hasProfileLoaded, setHasProfileLoaded] = useState(false);
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

  // Carousel effect with smooth transitions
  useEffect(() => {
    const t = setInterval(
      () => setCarouselIndex((p) => (p + 1) % carouselTexts.length),
      4000
    );
    return () => clearInterval(t);
  }, []);

  // UPDATED: Load profile data only once
  useEffect(() => {
    // Check if we already have profile data loaded
    const storedProfile = localStorage.getItem("userProfile");
    const profileLoaded = localStorage.getItem("profileLoaded") === "true";
    
    if (profileLoaded && storedProfile) {
      // Profile already loaded, use cached data
      const parsedProfile = JSON.parse(storedProfile);
      setUserProfile(parsedProfile);
      updateFormWithProfile(parsedProfile);
      
      const pic = parsedProfile?.profile_picture ||
                 parsedProfile?.avatarUrl ||
                 parsedProfile?.profilePicUrl ||
                 null;
      if (pic && setProfilePic) {
        setProfilePic(pic);
      }
      
      setHasProfileLoaded(true);
      setLoadingProfile(false);
      return;
    }

    // Otherwise, load profile from backend
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);

        // Try to fetch from backend first
        try {
          const serverProfile = await fetchUserProfile();
          
          if (serverProfile) {
            setUserProfile(serverProfile);
            updateFormWithProfile(serverProfile);
            
            // Set profile picture from server response
            const pic = serverProfile?.profile_picture || 
                       serverProfile?.avatarUrl || 
                       serverProfile?.profilePicUrl ||
                       null;
            
            if (pic && setProfilePic) {
              setProfilePic(pic);
            }
            
            // Mark as loaded and cache data
            localStorage.setItem("userProfile", JSON.stringify(serverProfile));
            localStorage.setItem("profileLoaded", "true");
            setHasProfileLoaded(true);
            
            setSnackbar({
              open: true,
              message: "Profile loaded successfully",
              severity: "success",
            });
          }
        } catch (fetchError) {
          console.warn("Failed to fetch from backend, using cached data:", fetchError);
          
          // Fallback to localStorage if available
          if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setUserProfile(parsedProfile);
            updateFormWithProfile(parsedProfile);
            
            const pic = parsedProfile?.profile_picture ||
                       parsedProfile?.avatarUrl ||
                       parsedProfile?.profilePicUrl ||
                       null;
            if (pic && setProfilePic) {
              setProfilePic(pic);
            }
            
            localStorage.setItem("profileLoaded", "true");
            setHasProfileLoaded(true);
            
            setSnackbar({
              open: true,
              message: "Profile loaded from cache",
              severity: "warning",
            });
          } else {
            setSnackbar({
              open: true,
              message: "Please log in to view your profile",
              severity: "error",
            });
          }
        }
      } catch (error) {
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

    if (form.newPassword || form.confirmPassword || form.currentPassword) {
      if (!form.currentPassword.trim()) {
        n.currentPassword = "Current password is required to change password";
      }
      if (form.newPassword && form.newPassword.length < 8) {
        n.newPassword = "New password must be at least 8 characters long";
      }
      if (form.newPassword !== form.confirmPassword) {
        n.confirmPassword = "Passwords do not match";
      }
      if (form.newPassword && !form.confirmPassword) {
        n.confirmPassword = "Please confirm your new password";
      }
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
        
        if (url) {
          if (setProfilePic) setProfilePic(url);
          
          const updatedProfile = { 
            ...userProfile, 
            profile_picture: url,
            avatarUrl: url,
            profilePicUrl: url
          };
          setUserProfile(updatedProfile);
          localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
          
          setSnackbar({
            open: true,
            message: "Profile picture uploaded and saved successfully",
            severity: "success",
          });
        } else {
          throw new Error("Server did not return image URL");
        }
      } catch (uploadError) {
        console.error("Avatar upload failed, using local image:", uploadError);
        
        if (setProfilePic) setProfilePic(croppedImage);
        
        setSnackbar({
          open: true,
          message: "Profile picture updated locally. Please check your internet connection for server sync.",
          severity: "warning",
        });
      }
      
      setCroppingOpen(false);
    } catch (e) {
      console.error("Could not crop image:", e);
      setSnackbar({
        open: true,
        message: "Could not process image. Please try again.",
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
      const updated = await updateUserProfile(payload);

      const updatedUserProfile = {
        ...updated,
        _id: updated.id || updated._id,
      };

      const hasPasswordChange = form.newPassword && form.confirmPassword && form.currentPassword;
      
      if (hasPasswordChange) {
        try {
          await updatePassword(form.currentPassword, form.newPassword);
          setSnackbar({
            open: true,
            message: "Profile and password updated successfully! Please use your new password for future logins.",
            severity: "success",
          });
          
          setForm(prev => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          }));
          
          setOriginalForm(prev => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          }));
        } catch (passwordError) {
          setSnackbar({
            open: true,
            message: `Profile updated successfully, but password change failed: ${passwordError.message}`,
            severity: "warning",
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: "Profile updated successfully",
          severity: "success",
        });
      }

      setUserProfile(updatedUserProfile);
      localStorage.setItem("userProfile", JSON.stringify(updatedUserProfile));

      setEditMode(false);
      updateFormWithProfile(updatedUserProfile);

    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to update profile: ${err.message}`,
        severity: "error",
      });
    }
  };

  const getInitials = () => {
    const name = form.name || userProfile?.name || "";
    return name.charAt(0).toUpperCase();
  };

  const currentCarouselItem = carouselTexts[carouselIndex];

  const commonFieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: isDark ? "#1a1a1a" : "#f8f9fa",
      height: "56px",
      "& fieldset": {
        borderColor: isDark ? "#333333" : "#e0e0e0",
      },
      "&:hover fieldset": {
        borderColor: currentCarouselItem.color,
      },
      "&.Mui-focused fieldset": {
        borderColor: currentCarouselItem.color,
      },
    },
    "& .MuiInputBase-input": {
      color: isDark ? "#ffffff" : "#000000",
      padding: "16px 14px",
      height: "24px",
      fontSize: "0.875rem",
      lineHeight: "1.4375em",
    },
    "& .MuiInputBase-inputMultiline": {
      padding: "16px 14px",
      height: "24px !important",
      overflow: "hidden",
      resize: "none",
    },
    "& .MuiOutlinedInput-inputMultiline": {
      padding: "0",
    },
  };

  // NEW: Skeleton loading component
  const ProfileSkeleton = () => (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#0a0a0a" : "#f8f9fa",
        pb: 4,
      }}
    >
      {/* Hero Section Skeleton */}
      <Box
        sx={{
          position: "relative",
          minHeight: "30vh",
          background: isDark
            ? `linear-gradient(135deg, ${currentCarouselItem.color}15 0%, ${currentCarouselItem.color}25 100%)`
            : `linear-gradient(135deg, ${currentCarouselItem.color}10 0%, ${currentCarouselItem.color}20 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pt: 6,
          pb: 12,
        }}
      >
        <Skeleton
          variant="text"
          width="60%"
          height={60}
          sx={{ 
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: 2
          }}
        />
      </Box>

      {/* Avatar Skeleton */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          mt: -10,
          mb: 5,
        }}
      >
        <Box sx={{ position: "relative", textAlign: "center" }}>
          <Skeleton
            variant="circular"
            width={150}
            height={150}
            sx={{ 
              bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              border: `6px solid ${isDark ? "#0a0a0a" : "#ffffff"}`,
            }}
          />
          <Skeleton
            variant="text"
            width={200}
            height={40}
            sx={{ 
              mt: 2,
              bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: 1
            }}
          />
        </Box>
      </Box>

      {/* Form Skeleton */}
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, position: "relative", zIndex: 2 }}>
        <Card
          sx={{
            bgcolor: isDark ? "#111111" : "#ffffff",
            borderRadius: 3,
            boxShadow: isDark
              ? "0 8px 32px rgba(255,255,255,0.02)"
              : "0 8px 32px rgba(0,0,0,0.08)",
            border: `1px solid ${isDark ? "#222222" : "#e0e0e0"}`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: 4 }}>
            <Grid container spacing={3}>
              {[...Array(8)].map((_, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={20}
                    sx={{ 
                      mb: 1,
                      bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderRadius: 1
                    }}
                  />
                  <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ 
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      borderRadius: 1
                    }}
                  />
                </Grid>
              ))}
            </Grid>
            
            {/* Action Button Skeleton */}
            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Skeleton
                variant="rectangular"
                width={150}
                height={48}
                sx={{ 
                  bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: 2
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );

  // Show skeleton only on initial load, not when returning from other pages
  if (loadingProfile && !hasProfileLoaded) {
    return <ProfileSkeleton />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#0a0a0a" : "#f8f9fa",
        pb: 4,
      }}
    >
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          minHeight: "30vh",
          background: isDark
            ? `linear-gradient(135deg, ${currentCarouselItem.color}15 0%, ${currentCarouselItem.color}25 100%)`
            : `linear-gradient(135deg, ${currentCarouselItem.color}10 0%, ${currentCarouselItem.color}20 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 1s ease-in-out",
          overflow: "hidden",
          pt: 6,
          pb: 12,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            "&::before": {
              content: '""',
              position: "absolute",
              width: "200%",
              height: "200%",
              background: `radial-gradient(circle at 50% 50%, ${currentCarouselItem.color}08 0%, transparent 70%)`,
              animation: "pulse 4s ease-in-out infinite alternate",
            },
          }}
        />

        {/* Carousel Text */}
        <Box sx={{ 
          position: "relative", 
          zIndex: 2, 
          textAlign: "center", 
          px: 2,
        }}>
          <Fade in key={carouselIndex} timeout={1000}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                color: currentCarouselItem.color,
                textShadow: isDark
                  ? "0 2px 20px rgba(255,255,255,0.1)"
                  : "0 2px 20px rgba(0,0,0,0.1)",
                transition: "color 1s ease-in-out",
                lineHeight: 1.2,
                maxWidth: "800px",
              }}
            >
              {currentCarouselItem.text}
            </Typography>
          </Fade>
        </Box>
      </Box>

      {/* Profile Avatar */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          mt: -10,
          mb: 5,
        }}
      >
        <Box sx={{ position: "relative", textAlign: "center" }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Avatar
              sx={{
                width: 150,
                height: 150,
                border: `6px solid ${isDark ? "#0a0a0a" : "#ffffff"}`,
                boxShadow: `0 12px 40px ${currentCarouselItem.color}60`,
                bgcolor: isDark ? "#1a1a1a" : "#ffffff",
                color: currentCarouselItem.color,
                fontSize: "2.5rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                  boxShadow: `0 16px 60px ${currentCarouselItem.color}80`,
                },
              }}
              src={profilePic}
              onClick={() => fileInputRef.current?.click()}
            >
              {!profilePic && getInitials()}
            </Avatar>

            {/* Camera Icon */}
            <IconButton
              sx={{
                position: "absolute",
                bottom: 4,
                right: 4,
                bgcolor: currentCarouselItem.color,
                color: "white",
                width: 36,
                height: 36,
                border: `2px solid ${isDark ? "#0a0a0a" : "#ffffff"}`,
                "&:hover": {
                  bgcolor: currentCarouselItem.color,
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              size="small"
              onClick={() => fileInputRef.current?.click()}
            >
              <CameraAlt sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <input
            ref={fileInputRef}
            hidden
            accept="image/*"
            type="file"
            onChange={onFileChange}
          />

          {/* User Name */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: isDark ? "#ffffff" : "#000000",
                mb: 1,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.25rem" },
              }}
            >
              {form.name} {form.surname}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, position: "relative", zIndex: 2 }}>
        <Card
          sx={{
            bgcolor: isDark ? "#111111" : "#ffffff",
            borderRadius: 3,
            boxShadow: isDark
              ? "0 8px 32px rgba(255,255,255,0.02)"
              : "0 8px 32px rgba(0,0,0,0.08)",
            border: `1px solid ${isDark ? "#222222" : "#e0e0e0"}`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 }, pt: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Personal Information Fields */}
              <Grid container spacing={3}>
                {/* Name */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Name
                  </Typography>
                  <TextField
                    value={form.name || ""}
                    onChange={handleChange("name")}
                    fullWidth
                    disabled={!editMode}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Surname */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Surname
                  </Typography>
                  <TextField
                    value={form.surname || ""}
                    onChange={handleChange("surname")}
                    fullWidth
                    disabled={!editMode}
                    error={!!errors.surname}
                    helperText={errors.surname}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Date of Birth */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Date Of Birth
                  </Typography>
                  <TextField
                    value={form.dob || ""}
                    onChange={handleChange("dob")}
                    fullWidth
                    type="date"
                    disabled
                    InputLabelProps={{ shrink: true }}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    value={form.email || ""}
                    onChange={handleChange("email")}
                    fullWidth
                    disabled={!editMode}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Home Address */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Home Address
                  </Typography>
                  <TextField
                    value={form.address || ""}
                    onChange={handleChange("address")}
                    fullWidth
                    disabled={!editMode}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Phone Number */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Phone Number
                  </Typography>
                  <TextField
                    value={form.phone || ""}
                    onChange={handleChange("phone")}
                    fullWidth
                    disabled={!editMode}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Invited By */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Invited By
                  </Typography>
                  <TextField
                    value={form.invitedBy || ""}
                    onChange={handleChange("invitedBy")}
                    fullWidth
                    disabled={!editMode}
                    sx={commonFieldSx}
                  />
                </Grid>

                {/* Gender */}
                <Grid item xs={12} sm={6}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      fontWeight: 600,
                      color: isDark ? "#cccccc" : "#666666",
                    }}
                  >
                    Gender
                  </Typography>
                  <TextField
                    value={form.gender || ""}
                    onChange={handleChange("gender")}
                    fullWidth
                    disabled
                    sx={commonFieldSx}
                  />
                </Grid>
              </Grid>

              {/* Password Section */}
              {editMode && (
                <>
                  <Divider sx={{ my: 4, borderColor: isDark ? "#222222" : "#e0e0e0" }} />
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 3,
                      fontWeight: 600,
                      color: isDark ? "#ffffff" : "#000000",
                    }}
                  >
                    Change Password (Optional)
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Current Password */}
                    <Grid item xs={12}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: isDark ? "#cccccc" : "#666666",
                        }}
                      >
                        Current Password
                      </Typography>
                      <TextField
                        value={form.currentPassword || ""}
                        onChange={handleChange("currentPassword")}
                        type={showPassword.current ? "text" : "password"}
                        fullWidth
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword}
                        autoComplete="current-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility("current")}
                                edge="end"
                                sx={{ color: isDark ? "#cccccc" : "#666666" }}
                              >
                                {showPassword.current ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={commonFieldSx}
                      />
                    </Grid>

                    {/* New Password */}
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: isDark ? "#cccccc" : "#666666",
                        }}
                      >
                        New Password
                      </Typography>
                      <TextField
                        value={form.newPassword || ""}
                        onChange={handleChange("newPassword")}
                        type={showPassword.new ? "text" : "password"}
                        fullWidth
                        error={!!errors.newPassword}
                        helperText={errors.newPassword}
                        autoComplete="new-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility("new")}
                                edge="end"
                                sx={{ color: isDark ? "#cccccc" : "#666666" }}
                              >
                                {showPassword.new ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={commonFieldSx}
                      />
                    </Grid>

                    {/* Confirm New Password */}
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: isDark ? "#cccccc" : "#666666",
                        }}
                      >
                        Confirm New Password
                      </Typography>
                      <TextField
                        value={form.confirmPassword || ""}
                        onChange={handleChange("confirmPassword")}
                        type={showPassword.confirm ? "text" : "password"}
                        fullWidth
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        autoComplete="new-password"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => togglePasswordVisibility("confirm")}
                                edge="end"
                                sx={{ color: isDark ? "#cccccc" : "#666666" }}
                              >
                                {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={commonFieldSx}
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {!editMode ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{
                      bgcolor: currentCarouselItem.color,
                      "&:hover": {
                        bgcolor: currentCarouselItem.color,
                        opacity: 0.9,
                      },
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "1rem",
                    }}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      sx={{
                        borderColor: isDark ? "#666666" : "#cccccc",
                        color: isDark ? "#cccccc" : "#666666",
                        "&:hover": {
                          borderColor: isDark ? "#888888" : "#999999",
                          bgcolor: isDark ? "#222222" : "#f5f5f5",
                        },
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "1rem",
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={!hasChanges}
                      sx={{
                        bgcolor: currentCarouselItem.color,
                        "&:hover": {
                          bgcolor: currentCarouselItem.color,
                          opacity: 0.9,
                        },
                        "&:disabled": {
                          bgcolor: isDark ? "#333333" : "#cccccc",
                          color: isDark ? "#666666" : "#999999",
                        },
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "1rem",
                      }}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Cropper Modal */}
      {croppingOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            p: 2,
          }}
          onClick={() => setCroppingOpen(false)}
        >
          <Paper
            sx={{
              position: "relative",
              width: "90vw",
              maxWidth: 500,
              bgcolor: isDark ? "#111111" : "#ffffff",
              borderRadius: 3,
              p: 3,
              border: `1px solid ${isDark ? "#333333" : "#e0e0e0"}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                textAlign: "center",
                color: isDark ? "#ffffff" : "#000000",
                fontWeight: 600,
              }}
            >
              Crop Your Profile Picture
            </Typography>
            <Box sx={{ position: "relative", width: "100%", height: 300 }}>
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
              <Typography
                gutterBottom
                sx={{
                  color: isDark ? "#cccccc" : "#666666",
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                Zoom
              </Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(_, v) => setZoom(v)}
                sx={{
                  color: currentCarouselItem.color,
                  "& .MuiSlider-thumb": {
                    bgcolor: currentCarouselItem.color,
                  },
                  "& .MuiSlider-track": {
                    bgcolor: currentCarouselItem.color,
                  },
                  "& .MuiSlider-rail": {
                    bgcolor: isDark ? "#333333" : "#cccccc",
                  },
                }}
              />
            </Box>
            <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
              <Button
                variant="outlined"
                onClick={() => setCroppingOpen(false)}
                sx={{
                  borderColor: isDark ? "#666666" : "#cccccc",
                  color: isDark ? "#cccccc" : "#666666",
                  "&:hover": {
                    borderColor: isDark ? "#888888" : "#999999",
                    bgcolor: isDark ? "#222222" : "#f5f5f5",
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={onCropSave}
                sx={{
                  bgcolor: currentCarouselItem.color,
                  "&:hover": {
                    bgcolor: currentCarouselItem.color,
                    opacity: 0.9,
                  },
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                }}
              >
                Save Picture
              </Button>
            </Box>
          </Paper>
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
          sx={{
            borderRadius: 2,
            fontWeight: 600,
            "& .MuiAlert-icon": {
              fontSize: "1.2rem",
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1) rotate(0deg);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.05) rotate(2deg);
            opacity: 0.1;
          }
        }
      `}</style>
    </Box>
  );
}