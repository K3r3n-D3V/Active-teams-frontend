import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  useTheme,
} from "@mui/material";
import emailjs from "@emailjs/browser";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      // 👇 Optionally, call your backend to generate a secure token
      const response = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Failed to request reset");

      // 👇 Use the reset link returned by backend
      const resetLink = data.reset_link;

      // Send via EmailJS
      await emailjs.send(
        "service_pog1o0m",
        "template_n3blz6h",
        {
          email: email,
          reset_link: resetLink,
        },
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
        background: theme.palette.background.default,
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 4,
          maxWidth: 400,
          width: "100%",
          borderRadius: 4,
          boxShadow: 3,
          background: theme.palette.background.paper,
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Forgot Password
        </Typography>
        <TextField
          label="Enter your email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        {message && (
          <Typography color="success.main" mb={2}>
            {message}
          </Typography>
        )}
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ borderRadius: 3 }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
