import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const GiveToday = () => {
  const [paymentType, setPaymentType] = useState('Donation');
  const [receiptOption, setReceiptOption] = useState('auto');

  return (
    <Box sx={{ p: 4, maxWidth: 960, mx: 'auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Top grid: Personal Info & Payment Summary */}
        <Typography fontWeight={700} fontSize={30} mb={3} sx={{marginTop:5, textAlign: "center"}}>
              Give Today
            </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 3,
            }}
          >
            <Typography fontWeight={700} fontSize={18} mb={1}>
              Personal Information
            </Typography>
            <Typography fontSize={13} color="text.secondary" mb={2}>
              Please provide your contact details
            </Typography>

            <Typography fontWeight={600} fontSize={13} mb={0.5}>
              Full Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="John Doe"
              defaultValue="John Doe"
              sx={{ mb: 2 }}
            />

            <Typography fontWeight={600} fontSize={13} mb={0.5}>
              Email Address
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="john@example.com"
              defaultValue="john@example.com"
              sx={{ mb: 2 }}
            />

            <Typography fontWeight={600} fontSize={13} mb={0.5}>
              Home Address
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="123 Main St, City, Country"
              defaultValue="123 Main St, City, Country"
              size="small"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2,
              p: 3,
            }}
          >
            <Typography fontWeight={700} fontSize={16} mb={2}>
              Payment Summary
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14,
                mb: 1,
              }}
            >
              <Typography>Payment Type:</Typography>
              <Typography fontWeight={600}>Donation</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14,
                mb: 1,
              }}
            >
              <Typography>Amount:</Typography>
              <Typography>R0.00</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 14,
                mb: 2,
              }}
            >
              <Typography>Processing Fee (2.5%):</Typography>
              <Typography>R0.00</Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 16,
                mb: 2,
              }}
            >
              <Typography>Total:</Typography>
              <Typography>R0.00</Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                fontSize: 12,
                mb: 1,
              }}
            >
              <LockIcon fontSize="small" sx={{ mr: 0.5 }} />
              Secure payment via Yoco
            </Box>

            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: '#000',
                '&:hover': { backgroundColor: '#222' },
                fontWeight: 600,
                fontSize: 14,
                mb: 1,
              }}
            >
              Complete Payment
            </Button>

            <Typography fontSize={11} color="text.secondary" sx={{ lineHeight: 1.3 }}>
              By completing this payment, you agree to our terms and conditions.<br />
              Your information is encrypted and secure.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Details */}
      <Box sx={{ mt: 4 }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography fontWeight={700} fontSize={16} mb={1}>
            Payment Details
          </Typography>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            Select payment type and enter amount
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Payment Type</InputLabel>
            <Select
              label="Payment Type"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <MenuItem value="Donation">Donation</MenuItem>
              <MenuItem value="Subscription">Subscription</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            placeholder="R 0.00"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>R</Typography>,
            }}
          />

          <TextField
            fullWidth
            size="small"
            placeholder="1234 5678 9012 3456"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" placeholder="MM/YYYY" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" placeholder="123" />
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Receipt Options */}
      <Box sx={{ mt: 4 }}>
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            p: 3,
          }}
        >
          <Typography fontWeight={700} fontSize={16} mb={1}>
            Receipt Options
          </Typography>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            Choose how you'd like to receive your receipt
          </Typography>

          <FormControl component="fieldset">
            <RadioGroup
              value={receiptOption}
              onChange={(e) => setReceiptOption(e.target.value)}
            >
              <FormControlLabel
                value="auto"
                control={<Radio />}
                label="Auto-generate receipt (sent to email)"
              />
              <FormControlLabel
                value="custom"
                control={<Radio />}
                label="Upload custom receipt"
              />
            </RadioGroup>
          </FormControl>
        </Paper>
      </Box>
    </Box>
  );
};

export default GiveToday;