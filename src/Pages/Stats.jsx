import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Avatar,
  useTheme,
  CssBaseline
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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
  Legend
);

const StatsDashboard = () => {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    datasets: [
      {
        label: 'Calls',
        data: [50, 100, 75, 120, 160],
        borderColor: '#42a5f5',
        tension: 0.4
      },
      {
        label: 'Cells',
        data: [80, 60, 130, 140, 110],
        borderColor: '#66bb6a',
        tension: 0.4
      }
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => ({
        ...prev,
        datasets: prev.datasets.map(ds => ({
          ...ds,
          data: ds.data.map(n =>
            Math.max(0, n + Math.round((Math.random() - 0.5) * 20))
          )
        }))
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tasks = [
    { name: 'Tegra Mungudi', email: 'tegra@example.com', count: 64 },
    { name: 'Kevin Cyberg', email: 'kevin@example.com', count: 3 },
    { name: 'Timmy Ngezo', email: 'timmy@example.com', count: 10 },
    { name: 'Zen Diaz', email: 'zen@example.com', count: 29 },
    { name: 'Eliak James', email: 'eliak@example.com', count: 4 },
    { name: 'Thabo Tshims', email: 'thabo@example.com', count: 24 }
  ];

  const cells = [
    { name: 'Tegra Mungudi', location: 'Rosettenville School cell' },
    { name: 'Kevin Cyberg', location: '98 Albert Street (Home) Cell' },
    { name: 'Timmy Ngezo', location: 'Downtown Community Cell' },
    { name: 'Zen Diaz', location: 'Eastside Cell Group' }
  ];

  const [events, setEvents] = useState([
    {
      event_id: 1,
      title: 'Youth Service',
      start: new Date(),
      end: new Date(Date.now() + 3600000)
    }
  ]);

  const backgroundColor = mode === 'dark' ? '#1e1e1e' : '#f5f5f5';
  const cardColor = mode === 'dark' ? '#2b2b2b' : '#ffffff';

  return (
    <Box
      sx={{
        p: { xs: 3, md: 6 },
        display: 'flex',
        justifyContent: 'center',
        bgcolor: backgroundColor,
        minHeight: '100vh',
        pt: { xs: 8, md: 12 }
      }}
    >
      <CssBaseline />
      <Box sx={{ width: '100%', maxWidth: 1200 }}>
        <Grid container spacing={3}>
          {/* Service Growth */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: cardColor }}>
              <Typography variant="subtitle2">Current Month</Typography>
              <Typography variant="h4" fontWeight="bold" mt={2}>
                87.5%
              </Typography>
              <Typography>Service Growth</Typography>
              <Typography variant="caption" color="text.secondary">
                Compare To Last Month
              </Typography>
              <Typography mt={1}>March</Typography>
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>Weekend Services</Typography>
                    <EditIcon fontSize="small" />
                  </Box>
                  <Typography variant="caption">February</Typography>
                  <Bar
                    data={{
                      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                      datasets: [
                        {
                          label: 'Attendance',
                          data: [120, 150, 100, 180],
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: 6
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      aspectRatio: 2, // width/height ratio
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 50,
                            color: theme.palette.text.secondary
                          },
                          grid: { color: theme.palette.divider }
                        },
                        x: {
                          ticks: { color: theme.palette.text.secondary },
                          grid: { display: false }
                        }
                      }
                    }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor }}>
                  <Typography>
                    Amount of Calls
                    <br />
                    And Cells Captured
                  </Typography>
                  <Typography variant="caption">February</Typography>
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      aspectRatio: 2,
                      plugins: {
                        legend: {
                          labels: {
                            usePointStyle: true,
                            pointStyle: 'rectRounded',
                            color: theme.palette.text.primary
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 50,
                            color: theme.palette.text.secondary
                          },
                          grid: { color: theme.palette.divider }
                        },
                        x: {
                          ticks: { color: theme.palette.text.secondary },
                          grid: { display: false }
                        }
                      }
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Grid>

{/* Outstanding Cells & Tasks */}
<Grid item xs={12}>
  <Grid container spacing={5} sx={{ width: '100%' }}>
    {/* Outstanding Cells */}
    <Grid item xs={12} md={6}>
      <Paper
        sx={{
          p: 4,               // more padding
          borderRadius: 2,
          bgcolor: cardColor,
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          minHeight: 500,      // bigger height for more vertical space
          overflowY: 'auto',
          boxShadow: 6,        // subtle shadow for more depth
        }}
      >
        <Typography variant="h5" gutterBottom>  {/* bigger title */}
          Outstanding Cells
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          {cells.map((item, i) => (
            <Box key={i} display="flex" alignItems="center" mb={2}>  {/* more spacing */}
              <Avatar sx={{ mr: 3, width: 48, height: 48, fontSize: 24 }}>
                {item.name[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{item.name}</Typography>
                <Typography variant="caption">{item.location}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>
    </Grid>

    {/* Outstanding Tasks */}
    <Grid item xs={12} md={6}>
      <Paper
        sx={{
          p: 4,               // more padding
          borderRadius: 2,
          bgcolor: cardColor,
          display: 'flex',
          flexDirection: 'column',
          height: 'auto',
          minHeight: 500,      // bigger height for more vertical space
          overflowY: 'auto',
          boxShadow: 6,        // subtle shadow for more depth
        }}
      >
        <Typography variant="h5" gutterBottom>  {/* bigger title */}
          Outstanding Tasks
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          {tasks.map((item, i) => (
            <Box key={i} display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ mr: 3, width: 48, height: 48, fontSize: 24 }}>
                {item.name[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{item.name}</Typography>
                <Typography variant="caption">{item.email}</Typography>
              </Box>
              <Typography sx={{ ml: 'auto', fontWeight: 'bold', fontSize: 18 }}>
                {item.count.toString().padStart(2, '0')}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Grid>
  </Grid>
</Grid>

          {/* Scheduler */}
          <Grid item xs={12}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: cardColor,
                width: '100%',
                overflowX: 'auto',
                height: 'auto',
                minHeight: 400
              }}
            >
              <Typography mb={2}>Church Scheduler</Typography>
              <Box sx={{ width: '100%', minWidth: { xs: '100%', sm: 700, md: '100%' } }}>
                <Scheduler
                  view="month"
                  events={events}
                  onEventsChange={setEvents}
                  config={{ defaultTheme: mode }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StatsDashboard;
