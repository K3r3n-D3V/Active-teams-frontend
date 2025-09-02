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
    { event_id: 1, title: 'Youth Service', start: new Date(), end: new Date(Date.now() + 3600000) }
  ]);

  const backgroundColor = mode === 'dark' ? '#1e1e1e' : '#ffffffff';
  const cardColor = mode === 'dark' ? '#2b2b2b' : '#ffffff';

  // Enhanced shadow styles for different elements
  const cardShadow = mode === 'dark' 
    ? '0 8px 32px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)'
    : '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)';
  
  const itemShadow = mode === 'dark'
    ? '0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06)';

  const avatarShadow = mode === 'dark'
    ? '0 4px 12px rgba(0, 0, 0, 0.5)'
    : '0 4px 12px rgba(0, 0, 0, 0.15)';

  const countBoxShadow = mode === 'dark'
    ? '0 3px 8px rgba(0, 0, 0, 0.4)'
    : '0 3px 8px rgba(0, 0, 0, 0.12)';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        py: { xs: 2, md: 4 }
      }}
    >
      <CssBaseline />
      <Box sx={{ width: '100%', maxWidth: 1200, px: { xs: 1, sm: 2 }, mt: "50px" }}>
        <Grid container spacing={3} justifyContent="center">

          {/* Service Growth */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              bgcolor: cardColor, 
              height: 545,
              boxShadow: cardShadow,
              transition: 'box-shadow 0.3s ease-in-out',
              '&:hover': {
                boxShadow: mode === 'dark' 
                  ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                  : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
              }
            }}>
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

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3} direction="column">
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: cardColor,
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography>Weekend Services</Typography>
                    <Box sx={{
                      p: 1,
                      borderRadius: 1,
                      boxShadow: itemShadow,
                      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: mode === 'dark'
                          ? '0 6px 20px rgba(0, 0, 0, 0.5)'
                          : '0 6px 20px rgba(0, 0, 0, 0.1)'
                      }
                    }}>
                      <EditIcon fontSize="small" />
                    </Box>
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
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: cardColor,
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography>Amount of Calls<br />And Cells Captured</Typography>
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

          {/* Outstanding Cells & Tasks */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  borderRadius: 2, 
                  bgcolor: cardColor, 
                  height: 500, 
                  overflowY: 'auto',
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Outstanding Cells
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {cells.map((item, i) => (
                      <Box 
                        key={i} 
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          p: { xs: 1, sm: 2 },
                          borderRadius: 1,
                          boxShadow: itemShadow,
                          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            transform: 'translateY(-2px)',
                            boxShadow: mode === 'dark'
                              ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)'
                              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          mr: { xs: 2, sm: 3 }, 
                          width: { xs: 40, sm: 48 }, 
                          height: { xs: 40, sm: 48 }, 
                          fontSize: { xs: 18, sm: 24 },
                          boxShadow: avatarShadow,
                          transition: 'box-shadow 0.2s ease-in-out'
                        }}>
                          {item.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500 
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            {item.location}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  borderRadius: 2, 
                  bgcolor: cardColor, 
                  height: 500, 
                  overflowY: 'auto',
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    Outstanding Tasks
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {tasks.map((item, i) => (
                      <Box 
                        key={i} 
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 3,
                          p: { xs: 1, sm: 2 },
                          borderRadius: 1,
                          boxShadow: itemShadow,
                          bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            transform: 'translateY(-2px)',
                            boxShadow: mode === 'dark'
                              ? '0 8px 24px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)'
                              : '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          mr: { xs: 2, sm: 3 }, 
                          width: { xs: 40, sm: 48 }, 
                          height: { xs: 40, sm: 48 }, 
                          fontSize: { xs: 18, sm: 24 },
                          boxShadow: avatarShadow,
                          transition: 'box-shadow 0.2s ease-in-out'
                        }}>
                          {item.name[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500 
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: theme.palette.text.secondary,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            {item.email}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          minWidth: { xs: 40, sm: 50 },
                          height: { xs: 40, sm: 50 },
                          bgcolor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          borderRadius: 1,
                          ml: 2,
                          boxShadow: countBoxShadow,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: mode === 'dark'
                              ? '0 6px 16px rgba(0, 0, 0, 0.5)'
                              : '0 6px 16px rgba(0, 0, 0, 0.15)'
                          }
                        }}>
                          <Typography sx={{ 
                            fontWeight: 'bold', 
                            fontSize: { xs: 16, sm: 18 } 
                          }}>
                            {item.count.toString().padStart(2, '0')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Scheduler */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  borderRadius: 2, 
                  bgcolor: cardColor,
                  boxShadow: cardShadow,
                  transition: 'box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: mode === 'dark' 
                      ? '0 12px 48px rgba(0, 0, 0, 0.7), 0 6px 24px rgba(0, 0, 0, 0.5)'
                      : '0 12px 48px rgba(0, 0, 0, 0.16), 0 6px 24px rgba(0, 0, 0, 0.12)'
                  }
                }}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
                    Church Scheduler
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: { xs: 400, sm: 500, md: 600 },
                    overflow: 'hidden',
                    borderRadius: 1,
                    boxShadow: itemShadow,
                    "& .rs__root": { 
                      width: '100% !important', 
                      height: '100% !important' 
                    },
                    "& .rs__header": {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    },
                    "& .rs__cell": {
                      fontSize: { xs: '0.7rem', sm: '0.8rem' }
                    },
                    "& .rs__event": {
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    },
                    "& .rs__table": {
                      minWidth: { xs: '100%', sm: 'auto' }
                    }
                  }}>
                    <Scheduler
                      view={schedulerView}
                      events={events}
                      onEventsChange={setEvents}
                      config={{
                        defaultTheme: mode,
                        adaptive: true,
                        cellHeight: isMobile ? 35 : isTablet ? 45 : 55,
                        headerHeight: isMobile ? 35 : isTablet ? 45 : 55,
                        fontSize: isMobile ? 11 : isTablet ? 12 : 14,
                        hourFormat: isMobile ? 12 : 24,
                        weekStartsOn: 0, // Sunday
                        eventItemHeight: isMobile ? 25 : 30,
                        multiDayItemHeight: isMobile ? 25 : 30,
                      }}
                      style={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        width: '100%'
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
};

export default StatsDashboard;