import React, { useState, useContext } from "react";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { login } = useContext(AuthContext);

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
      await login(form.email, form.password);
      setSuccess("Login successful!");
      setForm(initialForm);
      setTimeout(() => navigate("/"), 500);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
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

        <Box
          component="form"
          onSubmit={handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
        >
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
            //changing to normal textfield so default eye does not show
           
            type="text"
            value={form.password}
            onChange={handleChange}
            fullWidth
            error={!!error && !form.password}
            helperText={!form.password && error ? "Password is required" : ""}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3 } }}
            InputProps={{
              style: {
                fontFamily: "monospace", // optional
                WebkitTextSecurity:`${showPassword ? "" : "disc"}` // makes it dots forces dots
              },

              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword((prev) => !prev)}
                  edge="end"
                >
                  {!showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
            }}
          />

          {error && (
            <Typography color="error.main" textAlign="center">
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" textAlign="center">
              {success}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
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
            {loading ? "Logging In..." : "Login"}
          </Button>
        </Box>

        <Box textAlign="center" mt={3}>
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/forgot-password")}
            sx={{ textDecoration: "underline", color: "#42a5f5", mb: 1 }}
          >
            Forgot Password?
          </Link>
          <Typography variant="body2" mt={1}>
            Don’t have an account?{" "}
            <Link
              component="button"
              onClick={() => navigate("/signup")}
              sx={{ textDecoration: "underline", color: "#42a5f5" }}
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
