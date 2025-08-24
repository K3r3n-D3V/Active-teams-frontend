import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import darkLogo from "../assets/active-teams.png"; // PNG with transparency

const initialForm = {
  email: "",
  password: "",
};

const Login = ({ onLogin, mode, setMode }) => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed.");
      } else {
        setSuccess("Login successful!");
        if (onLogin) onLogin(data);
        setForm(initialForm);
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Network error.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.background.default,
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
            const next = mode === "light" ? "dark" : "light";
            localStorage.setItem("themeMode", next);
            setMode(next);
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
          maxWidth: 500,
          width: "100%",
          p: 4,
          borderRadius: 4,
          boxShadow: 3,
          background: theme.palette.background.paper,
        }}
      >
        {/* Logo */}
        <Box display="flex" justifyContent="center" alignItems="center" textAlign="center" mb={1}>
          <img
            src={darkLogo}
            alt="The Active Church Logo"
            style={{
              maxHeight: isSmallScreen ? 60 : 80,
              maxWidth: "100%",
              objectFit: "contain",
              filter: mode === "dark" ? "invert(1)" : "none",
              transition: "filter 0.3s ease-in-out",
            }}
          />
        </Box>

        {/* Header */}
        <Typography variant="h5" align="center" fontWeight="bold" mb={2} mt={4}>
          LOGIN
        </Typography>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={3}>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            error={!!error && !form.email}
            helperText={!form.email && error ? "Email is required" : ""}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            error={!!error && !form.password}
            helperText={!form.password && error ? "Password is required" : ""}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
          />

          {/* Error / Success messages */}
          {error && (
            <Typography color="error" textAlign="center">
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" textAlign="center">
              {success}
            </Typography>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: 8,
              fontWeight: "bold",
              py: 1.5,
              px: 4,
              width: "30%",
              justifyContent: "center",
              alignSelf: "center",
              "&:hover": {
                backgroundColor: "#a09c9cff",
              },
            }}
          >
            {loading ? "Logging In..." : "Login"}
          </Button>
        </Box>

        {/* Links */}
        <Box textAlign="center" mt={3}>
          <Typography variant="body2">
            <span
              style={{
                color: "#42a5f5",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </Typography>

          <Typography variant="body2" mt={1}>
            Don’t have an account?{" "}
            <span
              style={{
                color: "#42a5f5",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </span>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
