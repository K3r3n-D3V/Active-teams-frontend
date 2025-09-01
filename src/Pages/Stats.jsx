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

  // Decide view based on screen size
  // const schedulerView = isMobile || isTablet ? "week" : "month";
  const schedulerView = isMobile ? "day" : isTablet ? "week" : "month";

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
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, bgcolor: cardColor, height: 545 }}>
              <Typography variant="subtitle2">August</Typography>
              <Typography variant="h4" fontWeight="bold" mt={2}>
                87.5%
              </Typography>
              <Typography>Service Growth</Typography>
              {/* <Typography variant="caption" color="text.secondary">
      Compare To Last Month
    </Typography>
    <Typography mt={1} mb={2}>August</Typography> */}

              <Pie
                data={{
                  labels: ["August", "July"],
                  datasets: [
                    {
                      data: [87.5, 12.5],
                      backgroundColor: ["#3f51b5", "#e0e0e0"],
                      hoverOffset: 4,
                    },
                  ],
                }}
              />
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>Weekend Services</Typography>
                  <EditIcon fontSize="small" />
                </Box>
                <Typography variant="caption">August</Typography>
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
                    aspectRatio: 2,
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

            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2, bgcolor: cardColor }}>
                <Typography>
                  Amount of Calls
                  <br />
                  And Cells Captured
                </Typography>
                <Typography variant="caption">August</Typography>
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


          {/* Outstanding Cells & Tasks */}
{/* Outstanding Cells & Tasks aligned under Service Growth and Charts */}
<Grid item xs={12}>
  <Grid container spacing={3}>
    {/* Outstanding Cells */}
    <Grid item xs={12} md={6}>
      <Paper
        sx={{
          p: 5,
          borderRadius: 2,
          bgcolor: cardColor,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 500,
          overflowY: 'auto',
          boxShadow: 6
        }}
      >
        <Typography variant="h5" gutterBottom>
          Outstanding Cells
        </Typography>
        <Box sx={{ flexGrow: 1 }}>
          {cells.map((item, i) => (
            <Box key={i} display="flex" alignItems="center" mb={2}>
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
          p: 5,
          borderRadius: 2,
          bgcolor: cardColor,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 500,
          overflowY: 'auto',
          boxShadow: 6
        }}
      >
        <Typography variant="h5" gutterBottom>
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
          <Grid item xs={12} md={2}>
            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                bgcolor: cardColor,
                display: "flex",
                flexDirection: "column",
                boxShadow: 6,
                width: "100%",
                height: "100%",
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                fontSize={{ xs: "1rem", sm: "1.25rem" }}
              >
                Church Scheduler
              </Typography>

              <Box
                sx={{
                  flexGrow: 1,
                  width: "100%",
                  height: "100%",
                  "& .rs__root": {
                    width: "100% !important",
                    height: "100% !important",
                  },
                }}
              >
                <Scheduler
                  view={schedulerView}
                  events={events}
                  onEventsChange={setEvents}
                  config={{
                    defaultTheme: mode,
                    adaptive: true,
                    cellHeight: isMobile ? 30 : 50,
                    headerHeight: isMobile ? 30 : 50,
                    fontSize: isMobile ? 10 : 13,
                    //  weekDays: isMobile ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 0], 
                  }}
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
