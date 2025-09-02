import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  useTheme,
  Link,
  useMediaQuery,
} from "@mui/material";
import emailjs from "@emailjs/browser";
import darkLogo from "../assets/active-teams.png";

const ForgotPassword = ({ mode }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to request reset");

      const resetLink = data.reset_link;

      await emailjs.send(
        "service_pog1o0m",
        "template_n3blz6h",
        { email, reset_link: resetLink },
        "IfPXzIfJfUTXc0Faa"
      );

      setMessage("Check your email for the reset link.");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.palette.background.default,
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#fff", // Match login
          color: "#000",
          p: 4,
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          textAlign="center"
          mb={2}
        >
          <img
            src={darkLogo}
            alt="The Active Church"
            style={{
              maxHeight: isSmallScreen ? 60 : 80,
              maxWidth: "100%",
              objectFit: "contain",
              // No filter here
            }}
          />
        </Box>

        {/* Heading */}
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Forgot Password
        </Typography>

        <Typography variant="body2" mb={2} sx={{ textAlign: "left", display: "block" }}>
          Enter your email address to reset your password.
        </Typography>

        {/* Email Field */}
        <TextField
          label="Email Address"
          variant="outlined"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: "999px", // Rounded input
            },
          }}
        />

        {/* Message */}
        {message && (
          <Typography color="success.main" fontSize={14} mb={2}>
            {message}
          </Typography>
        )}
        {error && (
          <Typography color="error.main" fontSize={14} mb={2}>
            {error}
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
            fontWeight: "bold",
            borderRadius: "999px",
            py: 1.2,
            mb: 2,
            "&:hover": {
              backgroundColor: "#222",
            },
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>

        {/* Back to Login */}
        <Typography fontSize={14}>
          Remember your password?{" "}
          <Link href="/login" underline="hover" color="primary">
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
