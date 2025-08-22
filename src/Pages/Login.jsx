import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  useTheme,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

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
      setError("Network error.");
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
        {/* Header */}
        <Typography variant="h4" align="center" fontWeight="bold" mb={2}>
          LOGIN
        </Typography>

        <Typography align="center" variant="h6" mb={3}>
          <span style={{ fontFamily: "cursive" }}>The Active</span>
          <br />
          <strong>CHURCH</strong>
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
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: 3,
              fontWeight: "bold",
              py: 1.5,
              "&:hover": {
                backgroundColor: "#222",
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
              style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </Typography>

          <Typography variant="body2" mt={1}>
            Don’t have an account?{" "}
            <span
              style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
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
