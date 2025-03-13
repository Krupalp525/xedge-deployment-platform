import React, { useState, useEffect } from 'react';
import { Chip, Tooltip, Badge } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../api';

type ConnectionStatus = 'unknown' | 'connected' | 'failed';

/**
 * ApiModeIndicator Component
 * A small floating indicator that shows the current API mode (mock or real)
 * and connection status
 */
const ApiModeIndicator: React.FC = () => {
  const [apiMode, setApiMode] = useState(api.getApiMode());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');

  // Update indicator when API mode changes
  useEffect(() => {
    const checkApiMode = () => {
      const currentMode = api.getApiMode();
      setApiMode(currentMode);

      // If we're in real mode, check if we can connect to the backend
      if (currentMode === 'real') {
        setConnectionStatus('unknown');
        // Make a lightweight request to check connection
        fetch('/api/health', { method: 'GET' })
          .then(response => {
            if (response.ok) {
              setConnectionStatus('connected');
            } else {
              setConnectionStatus('failed');
            }
          })
          .catch(error => {
            console.error('API connection test failed:', error);
            setConnectionStatus('failed');
          });
      } else {
        setConnectionStatus('unknown');
      }
    };

    // Check immediately
    checkApiMode();

    // Set up event listener for API mode changes
    window.addEventListener('apiModeChanged', checkApiMode);

    // Clean up
    return () => {
      window.removeEventListener('apiModeChanged', checkApiMode);
    };
  }, []);

  // Handle clicking on the indicator when connection fails
  const handleClick = () => {
    if (apiMode === 'real' && connectionStatus === 'failed') {
      // Switch back to mock mode
      api.forceMockMode();
      setApiMode('mock');
      setConnectionStatus('unknown');
    }
  };

  // Different styling based on mode and connection status
  const getChipProps = () => {
    if (apiMode === 'real') {
      if (connectionStatus === 'connected') {
        return {
          icon: <CloudIcon />,
          color: 'primary' as const,
          label: 'Real API',
          tooltip: 'Connected to real backend API'
        };
      } else if (connectionStatus === 'failed') {
        return {
          icon: <ErrorOutlineIcon />,
          color: 'error' as const,
          label: 'Connection Error',
          tooltip: 'Failed to connect to backend. Click to switch to mock mode.'
        };
      } else {
        return {
          icon: <CloudIcon />,
          color: 'info' as const,
          label: 'Connecting...',
          tooltip: 'Attempting to connect to real backend API'
        };
      }
    } else {
      return {
        icon: <CloudOffIcon />,
        color: 'warning' as const,
        label: 'Mock API',
        tooltip: 'Using mock data (not connected to backend)'
      };
    }
  };

  const chipProps = getChipProps();

  return (
    <Tooltip title={chipProps.tooltip}>
      <Chip
        icon={chipProps.icon}
        label={chipProps.label}
        color={chipProps.color}
        size="small"
        onClick={handleClick}
        sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          cursor: apiMode === 'real' && connectionStatus === 'failed' ? 'pointer' : 'default'
        }}
      />
    </Tooltip>
  );
};

export default ApiModeIndicator; 