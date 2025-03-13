import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { IconButton, Box, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Login from './components/Login';
import Register from './components/Register';
import Homepage from './components/Homepage';
import WorkflowCanvas from './components/WorkflowCanvas';
import ApiModeIndicator from './components/ApiModeIndicator';
import DebugPanel from './components/DebugPanel';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  // Create a theme based on the darkMode state
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const ThemeToggle = () => (
    <Box sx={{ position: 'fixed', bottom: 10, right: 30 , zIndex: 1000 }}>
      <Tooltip title={`Toggle ${darkMode ? 'Light' : 'Dark'} Mode`}>
        <IconButton
          onClick={() => setDarkMode(!darkMode)}
          color="inherit"
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.default' }
          }}
        >
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box>
          {/* API Mode Indicator (development only) */}
          <ApiModeIndicator />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/deployments" 
              element={
                <ProtectedRoute>
                  <>
                    <Homepage />
                    <ThemeToggle />
                  </>
                </ProtectedRoute>
              } 
            />
            {/* New route for the workflow canvas */}
            <Route 
              path="/deployments/:deploymentId/workflow" 
              element={
                <ProtectedRoute>
                  <>
                    <WorkflowCanvas />
                    <ThemeToggle />
                  </>
                </ProtectedRoute>
              } 
            />
            {/* Redirect /dashboard to /deployments for backward compatibility */}
            <Route 
              path="/dashboard" 
              element={<Navigate to="/deployments" replace />} 
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Box>
        <DebugPanel />
      </Router>
    </ThemeProvider>
  );
}

export default App;
