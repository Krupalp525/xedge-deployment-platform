import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Alert,
  Card,
  CardContent,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import api from '../api';

interface RequestResult {
  endpoint: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
  timestamp: Date;
}

const DebugPanel: React.FC = () => {
  const [results, setResults] = useState<RequestResult[]>([]);
  const [customEndpoint, setCustomEndpoint] = useState('/api/health');
  const [isVisible, setIsVisible] = useState(false);

  // Toggle visibility of the debug panel
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Function to test API endpoints
  const testEndpoint = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);
      const data = await (response.headers.get('content-type')?.includes('application/json') 
        ? response.json() 
        : response.text());
      
      setResults(prev => [
        {
          endpoint,
          status: response.ok ? 'success' : 'error',
          data,
          timestamp: new Date()
        },
        ...prev.slice(0, 9) // Keep only the last 10 results
      ]);
    } catch (error: any) {
      setResults(prev => [
        {
          endpoint,
          status: 'error',
          error: error.message,
          timestamp: new Date()
        },
        ...prev.slice(0, 9)
      ]);
    }
  };

  // Test a custom endpoint
  const testCustomEndpoint = () => {
    testEndpoint(customEndpoint);
  };

  // Test standard endpoints
  const testHealthEndpoint = () => testEndpoint('/api/health');
  const testPluginsEndpoint = () => testEndpoint('/api/plugins');
  const testWorkflowsEndpoint = () => testEndpoint('/api/workflows');
  const testDeploymentsEndpoint = () => testEndpoint('/api/deployments');

  // Only visible in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <Button 
        variant="contained" 
        color="info" 
        size="small"
        startIcon={<BugReportIcon />}
        onClick={toggleVisibility}
        sx={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          zIndex: 1000,
          opacity: 0.8,
          '&:hover': {
            opacity: 1
          },
          backgroundColor: '#1976d2', 
          color: '#fff'
        }}
      >
        Debug
      </Button>
    );
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        width: '400px', 
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 1000,
        p: 2
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <BugReportIcon sx={{ mr: 1 }} /> API Debug Panel
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={toggleVisibility}
          sx={{ 
            borderColor: '#1976d2', 
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Close
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current API Mode: <strong>{api.getApiMode().toUpperCase()}</strong>
      </Typography>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Test Standard Endpoints:</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={testHealthEndpoint}
          sx={{ 
            borderColor: '#1976d2', 
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >Health</Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={testPluginsEndpoint}
          sx={{ 
            borderColor: '#1976d2', 
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >Plugins</Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={testWorkflowsEndpoint}
          sx={{ 
            borderColor: '#1976d2', 
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >Workflows</Button>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={testDeploymentsEndpoint}
          sx={{ 
            borderColor: '#1976d2', 
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >Deployments</Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Custom Endpoint"
          variant="outlined"
          size="small"
          fullWidth
          value={customEndpoint}
          onChange={(e) => setCustomEndpoint(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button 
          variant="contained" 
          size="small" 
          onClick={testCustomEndpoint}
          fullWidth
          sx={{ backgroundColor: '#1976d2', color: '#fff' }}
        >
          Test Custom Endpoint
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Results:</Typography>
      {results.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>No requests made yet</Alert>
      ) : (
        <List>
          {results.map((result, index) => (
            <Card key={index} sx={{ mb: 1 }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="subtitle2" color={result.status === 'success' ? 'success.main' : 'error.main'}>
                  {result.endpoint} - {result.status.toUpperCase()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {result.timestamp.toLocaleTimeString()}
                </Typography>
                
                <Accordion sx={{ mt: 1, boxShadow: 'none', '&:before': { display: 'none' } }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />} 
                    sx={{ minHeight: '36px', p: 0 }}
                  >
                    <Typography variant="caption">Response Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1, pt: 0 }}>
                    {result.status === 'success' ? (
                      <Box 
                        component="pre" 
                        sx={{ 
                          m: 0, 
                          p: 1, 
                          fontSize: '0.75rem', 
                          backgroundColor: '#f5f5f5', 
                          borderRadius: 1,
                          maxHeight: '200px',
                          overflow: 'auto'
                        }}
                      >
                        {JSON.stringify(result.data, null, 2)}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="error.main">
                        {result.error}
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default DebugPanel; 