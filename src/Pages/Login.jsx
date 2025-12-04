import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Link,
  CircularProgress,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import darkLogo from "../assets/active-teams.png";
import { AuthContext } from "../contexts/AuthContext";

const initialForm = {
  email: "",
  password: "",
};

const Login = ({ mode, setMode }) => {
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState({});
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { login, loading, isAuthenticated } = useContext(AuthContext);
  const isDark = mode === "dark";

  // Early redirect if already auth'd (no splash)
  useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('🔄 [Login] Already auth\'d—redirecting to home');
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (localErrors[name]) setLocalErrors({ ...localErrors, [name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.password) errors.password = 'Password is required';
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await login(form.email, form.password);
      setForm(initialForm);
    } catch (err) {
      console.error('Login error in component:', err);
    }
  };

  // Show loading spinner if initializing (brief splash prevent)
  if (loading && !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const inputFieldSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: isDark ? "#1a1a1a" : "#f8f9fa",
      borderRadius: 3,
      "& fieldset": {
        borderColor: isDark ? "#333333" : "#e0e0e0",
      },
      "&:hover fieldset": {
        borderColor: isDark ? "#555555" : "#b0b0b0",
      },
      "&.Mui-focused": {
        bgcolor: isDark ? "#1a1a1a" : "#f8f9fa",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#42a5f5",
      },
    },
    "& .MuiInputBase-input": {
      color: isDark ? "#ffffff" : "#000000",
      bgcolor: "transparent !important",
      "&:-webkit-autofill": {
        WebkitBoxShadow: isDark ? "0 0 0 100px #1a1a1a inset !important" : "0 0 0 100px #f8f9fa inset !important",
        WebkitTextFillColor: isDark ? "#ffffff !important" : "#000000 !important",
        transition: "background-color 5000s ease-in-out 0s",
      },
      "&:focus": {
        bgcolor: "transparent !important",
      },
    },
    "& .MuiInputLabel-root": {
      color: isDark ? "#999999" : "#666666",
      "&.Mui-focused": {
        color: "#42a5f5",
      },
    },
    "& .MuiInputBase-root": {
      bgcolor: isDark ? "#1a1a1a" : "#f8f9fa",
      "&.Mui-focused": {
        bgcolor: isDark ? "#1a1a1a" : "#f8f9fa",
      },
    },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        position: "relative",
      }}
    >
      {/* Dark/Light Toggle */}
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <IconButton
          onClick={() => {
            const nextMode = mode === "light" ? "dark" : "light";
            localStorage.setItem("themeMode", nextMode);
            setMode(nextMode);
          }}
          sx={{
            color: mode === "dark" ? "#fff" : "#000",
            backgroundColor: mode === "dark" ? "#1f1f1f" : "#e0e0e0",
            "&:hover": {
              backgroundColor: mode === "dark" ? "#2c2c2c" : "#c0c0c0",
            },
          }}
        >
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>
      <Box
        sx={{
          maxWidth: 450,
          width: "100%",
          p: 4,
          borderRadius: 4,
          boxShadow: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* Logo */}
        <Box display="flex" justifyContent="center" mb={2}>
          <img
            src={darkLogo}
            alt="Active Teams Logo"
            style={{
              maxHeight: isSmallScreen ? 60 : 80,
              maxWidth: "100%",
              objectFit: "contain",
              filter: mode === "dark" ? "invert(1)" : "none",
            }}
          />
        </Box>
        <Typography variant="h5" fontWeight="bold" mb={3} textAlign="center">
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            error={!!localErrors.email}
            helperText={localErrors.email}
            disabled={loading}
            sx={inputFieldSx}
          />
          <TextField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            fullWidth
            error={!!localErrors.password}
            helperText={localErrors.password}
            disabled={loading}
            sx={inputFieldSx}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                  sx={{ color: isDark ? "#cccccc" : "#666666" }}
                  disabled={loading}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              ),
            }}
          />
          {loading && (
            <Box display="flex" justifyContent="center" mt={1}>
              <CircularProgress size={24} />
              <Typography ml={1} variant="body2">Logging in...</Typography>
            </Box>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || Object.keys(localErrors).length > 0}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: 3,
              fontWeight: "bold",
              py: 1.5,
              mt: 1,
              "&:hover": { backgroundColor: "#222" },
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
            {loading ? "Logging In..." : "Login"}
          </Button>
        </Box>
        <Box textAlign="center" mt={3}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/forgot-password")}
            sx={{ textDecoration: "underline", color: "#42a5f5", mb: 1 }}
            disabled={loading}
          >
            Forgot Password?
          </Link>
          <Typography variant="body2" mt={1}>
            Don't have an account?{" "}
            <Link
              component="button"
              onClick={() => navigate("/signup")}
              sx={{ textDecoration: "underline", color: "#42a5f5" }}
              disabled={loading}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;