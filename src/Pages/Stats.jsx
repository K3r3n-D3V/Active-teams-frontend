import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  useTheme,
  CssBaseline,
  useMediaQuery
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Scheduler } from '@aldabil/react-scheduler';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StatsDashboard = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const schedulerView = isMobile ? "day" : isTablet ? "week" : "month";

  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      { label: 'Calls', data: [50, 100, 75, 120, 160], borderColor: '#42a5f5', tension: 0.4 },
      { label: 'Cells', data: [80, 60, 130, 140, 110], borderColor: '#66bb6a', tension: 0.4 }
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => ({
        ...prev,
        datasets: prev.datasets.map(ds => ({
          ...ds,
          data: ds.data.map(n => Math.max(0, n + Math.round((Math.random() - 0.5) * 20)))
        }))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Use these arrays instead of static inline arrays
  const tasks = [
    { type: "Call", name: "John Doe" },
    { type: "Cell", name: "Cell Group 12" },
    { type: "Person", name: "Mary Smith" },
  ];

  const cells = [
    { cell: "Cell Group 7", leader: "Alice" },
    { cell: "Cell Group 3", leader: "Michael" },
    { cell: "Cell Group 5", leader: "Sarah" },
  ];

  const [events, setEvents] = useState([
    { event_id: 1, title: 'Youth Service', start: new Date(), end: new Date(Date.now() + 3600000) }
  ]);

  const backgroundColor = mode === 'dark' ? '#1e1e1e' : '#f5f5f5';
  const cardColor = mode === 'dark' ? '#2b2b2b' : '#ffffff';

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        bgcolor: backgroundColor,
        minHeight: '100vh',
        width: '100%',
      }}
    >
      <CssBaseline />
      <Grid container spacing={3}>

        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: cardColor, height: 545 }}>
            <Typography variant="subtitle2">August</Typography>
            <Typography variant="h4" fontWeight="bold" mt={2}>87.5%</Typography>
            <Typography>Service Growth</Typography>
            <Pie
              data={{
                labels: ["August", "July"],
                datasets: [{ data: [87.5, 12.5], backgroundColor: ["#3f51b5", "#e0e0e0"], hoverOffset: 4 }]
              }}
            />
          </Paper>
        </Grid>

        {/* Weekend Services & Calls/Captured */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor, height: '100%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Weekend Services</Typography>
                  <EditIcon fontSize="small" />
                </Box>
                <Typography variant="caption">August</Typography>
                <Bar
                  data={{
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{ label: 'Attendance', data: [120, 150, 100, 180], backgroundColor: theme.palette.primary.main, borderRadius: 6 }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 50, color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } },
                      x: { ticks: { color: theme.palette.text.secondary }, grid: { display: false } }
                    }
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor, height: '100%' }}>
                <Typography>Amount of Calls <br /> And Cells Captured</Typography>
                <Typography variant="caption">August</Typography>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2,
                    plugins: { legend: { labels: { usePointStyle: true, pointStyle: 'rectRounded', color: theme.palette.text.primary } } },
                    scales: {
                      y: { beginAtZero: true, ticks: { stepSize: 50, color: theme.palette.text.secondary }, grid: { color: theme.palette.divider } },
                      x: { ticks: { color: theme.palette.text.secondary }, grid: { display: false } }
                    }
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Outstanding Tasks + Captured Cells */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={3} direction="column">
            {/* Outstanding Tasks */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor, height: "100%", display: "flex", flexDirection: "column" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Outstanding Tasks</Typography>
                  <EditIcon fontSize="small" />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 1 }}>
                  {tasks.map((task, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                      {task.type}: {task.name}
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
            {/* Captured Cells */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor, height: "100%", display: "flex", flexDirection: "column" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Captured Cells</Typography>
                  <EditIcon fontSize="small" />
                </Box>
                <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 1 }}>
                  {cells.map((c, i) => (
                    <Typography key={i} variant="body2" sx={{ mb: 1 }}>
                      {c.cell} (Leader: {c.leader})
                    </Typography>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Scheduler */}
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, bgcolor: cardColor, height: 600 }}>
            <Typography variant="h5" gutterBottom>Church Scheduler</Typography>
            <Box sx={{ width: '100%', height: '100%' }}>
              <Scheduler
                view={schedulerView}
                events={events}
                onEventsChange={setEvents}
                config={{
                  defaultTheme: mode,
                  adaptive: true,
                  cellHeight: isMobile ? 30 : 50,
                  headerHeight: isMobile ? 30 : 50,
                  fontSize: isMobile ? 10 : 13
                }}
              />
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
};

export default StatsDashboard;
