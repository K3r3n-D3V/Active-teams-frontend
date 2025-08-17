import { AppBar, Toolbar, Typography, Avatar, IconButton, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Topbar() {
  const theme = useTheme();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="default"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.default,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Welcome to The Active Church
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton sx={{ p: 0 }}>
            <Avatar
              alt="User"
              src="/profile.jpg" // <-- Optional: place an image in public folder
              sx={{
                width: 40,
                height: 40,
              }}
            />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
