import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        m: 2, 
        maxWidth: '600px', 
        mx: 'auto', 
        mt: 4, 
        borderLeft: '5px solid #f44336'
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom color="error">
        Something went wrong
      </Typography>
      
      <Box sx={{ my: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto' }}>
        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
          {error.message}
        </Typography>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={resetErrorBoundary}
        >
          Try again
        </Button>
      </Box>
    </Paper>
  );
};

export default ErrorFallback; 