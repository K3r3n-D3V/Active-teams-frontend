import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { AuthContext } from "../contexts/AuthContext";

ChartJS.register(CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);

const CELLS_GROWTH_ENDPOINT =
  import.meta.env.VITE_CELLS_GRAPH_API_URL || "http://127.0.0.1:8000/stats/cells-growth";
const ENTITY_TYPES = ["leader1", "leader12", "leader144"];
const PERIOD_TYPES = ["monthly", "yearly"];

const getUserId = (user) => user?.user_id || user?.id || user?.sub || "";

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export default function CellsGraphDebug() {
  const { user, authFetch } = useContext(AuthContext);
  const [entityType, setEntityType] = useState("leader1");
  const [periodType, setPeriodType] = useState("monthly");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState(null);

  const userId = getUserId(user);

  const fetchCellsGrowth = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasFetched(true);

    if (!userId) {
      setRows([]);
      setError({ status: "Unavailable", body: "No logged-in user ID is available." });
      setLoading(false);
      return;
    }

    const query = new URLSearchParams({
      user_id: String(userId),
      entity_type: entityType,
      period_type: periodType,
    });

    try {
      const response = await authFetch(`${CELLS_GROWTH_ENDPOINT}?${query.toString()}`);
      const responseText = await response.text();
      let payload;

      try {
        payload = responseText ? JSON.parse(responseText) : null;
      } catch {
        payload = responseText;
      }

      if (!response.ok) {
        setRows([]);
        setError({
          status: response.status,
          body: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
        });
        return;
      }

      console.log("Cells Graph API response:", payload);
      setRows(getRows(payload));
    } catch (requestError) {
      setRows([]);
      setError({ status: "Request failed", body: requestError.message });
    } finally {
      setLoading(false);
    }
  }, [authFetch, entityType, periodType, userId]);

  useEffect(() => {
    if (userId) fetchCellsGrowth();
  }, [fetchCellsGrowth, userId]);

  const chartData = {
    labels: rows.map((row) => row.period),
    datasets: [
      {
        label: "Total cells",
        data: rows.map((row) => row.total_cells),
        borderColor: "#00796b",
        backgroundColor: "rgba(0, 121, 107, 0.18)",
        tension: 0.3,
        yAxisID: "cells",
      },
      {
        label: "Growth rate",
        data: rows.map((row) => row.growth_rate),
        borderColor: "#ed6c02",
        backgroundColor: "rgba(237, 108, 2, 0.18)",
        tension: 0.3,
        yAxisID: "growth",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      cells: { beginAtZero: true, position: "left", title: { display: true, text: "Total cells" } },
      growth: { beginAtZero: true, position: "right", title: { display: true, text: "Growth rate" }, grid: { drawOnChartArea: false } },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 }, background: "linear-gradient(135deg, #e0f2f1 0%, #fff8e1 100%)" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Typography variant="overline" sx={{ color: "#00796b", fontWeight: 700, letterSpacing: 2 }}>
          Temporary developer view
        </Typography>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, color: "#263238" }}>
          Cells Graph Debug
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Inspect cell growth data for the current account.
        </Typography>

        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderTop: "4px solid #00796b" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <TextField label="User ID" value={userId} fullWidth InputProps={{ readOnly: true }} helperText="Taken from the logged-in session" />
            <FormControl fullWidth>
              <InputLabel id="entity-type-label">Entity type</InputLabel>
              <Select labelId="entity-type-label" value={entityType} label="Entity type" onChange={(event) => setEntityType(event.target.value)}>
                {ENTITY_TYPES.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="period-type-label">Period type</InputLabel>
              <Select labelId="period-type-label" value={periodType} label="Period type" onChange={(event) => setPeriodType(event.target.value)}>
                {PERIOD_TYPES.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={fetchCellsGrowth} disabled={loading || !userId} sx={{ minWidth: 130, height: 56, bgcolor: "#00796b", "&:hover": { bgcolor: "#004d40" } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Fetch / Reload"}
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography fontWeight={700}>Request failed: HTTP {error.status}</Typography>
            <Box component="pre" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", mb: 0 }}>{error.body}</Box>
          </Alert>
        )}

        {loading && !rows.length && <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}><CircularProgress /></Box>}

        {!loading && !error && hasFetched && rows.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>The API returned no cell growth records.</Alert>
        )}

        {rows.length > 0 && (
          <>
            <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Growth over time</Typography>
              <Box sx={{ height: { xs: 300, md: 420 } }}><Line data={chartData} options={chartOptions} /></Box>
            </Paper>
            <Paper sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead><TableRow>{["period", "total_cells", "total_attendance", "growth_rate"].map((field) => <TableCell key={field} sx={{ fontWeight: 700 }}>{field}</TableCell>)}</TableRow></TableHead>
                <TableBody>{rows.map((row, index) => <TableRow key={`${row.period}-${index}`}><TableCell>{row.period}</TableCell><TableCell>{row.total_cells}</TableCell><TableCell>{row.total_attendance}</TableCell><TableCell>{row.growth_rate}</TableCell></TableRow>)}</TableBody>
              </Table>
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
