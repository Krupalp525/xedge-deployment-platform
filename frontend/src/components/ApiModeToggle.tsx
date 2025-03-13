import React, { useState, useEffect } from 'react';
import { Switch, FormControlLabel, Typography, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import WarningIcon from '@mui/icons-material/Warning';
import api from '../api';

/**
 * ApiModeToggle Component
 * A UI component that allows users to toggle between mock and real API modes
 * with a confirmation dialog when switching to real mode
 */
const ApiModeToggle: React.FC = () => {
  const [isRealMode, setIsRealMode] = useState(api.getApiMode() === 'real');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Update state when API mode changes
  const handleToggle = () => {
    // If toggling from mock to real, show confirmation dialog
    if (!isRealMode) {
      setConfirmDialogOpen(true);
    } else {
      // If toggling from real to mock, just do it
      const newMode = api.toggleApiMode();
      setIsRealMode(newMode === 'real');
    }
  };

  // Handle confirmation dialog
  const handleConfirmRealMode = () => {
    const newMode = api.toggleApiMode();
    setIsRealMode(newMode === 'real');
    setConfirmDialogOpen(false);
  };

  const handleCancelRealMode = () => {
    setConfirmDialogOpen(false);
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: isRealMode ? '#e3f2fd' : '#fff8e1',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          transition: 'background-color 0.3s ease',
          margin: '8px 0'
        }}
      >
        {isRealMode ? <CloudIcon sx={{ marginRight: 1, color: '#1976d2' }} /> : <CloudOffIcon sx={{ marginRight: 1, color: '#ed6c02' }} />}
        <FormControlLabel
          control={
            <Switch
              checked={isRealMode}
              onChange={handleToggle}
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {isRealMode ? 'Using Real Backend' : 'Using Mock Data'}
            </Typography>
          }
        />
      </Box>

      {/* Confirmation Dialog when switching to real mode */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelRealMode}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon sx={{ marginRight: 1, color: '#ed6c02' }} />
          Switch to Real Backend Mode
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You are about to switch from mock data to the real backend API. 
            Make sure your backend server is running and accessible at <strong>{window.location.hostname}:5000</strong>.
            <br/><br/>
            If the backend is not available, you'll automatically be switched back to mock mode.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelRealMode} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmRealMode} color="warning" autoFocus>
            Switch to Real API
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApiModeToggle; 