import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

function SystemHealth({ connected, tradingActive }) {
  const healthItems = [
    {
      label: 'API Connection',
      status: connected ? 'healthy' : 'error',
      value: connected ? 'Connected' : 'Disconnected'
    },
    {
      label: 'Trading Engine',
      status: tradingActive ? 'active' : 'idle',
      value: tradingActive ? 'Running' : 'Stopped'
    },
    {
      label: 'WebSocket',
      status: connected ? 'healthy' : 'error',
      value: connected ? 'Active' : 'Inactive'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'success';
      case 'idle':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle fontSize="small" />;
      case 'idle':
        return <Warning fontSize="small" />;
      case 'error':
        return <Error fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        System Health
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {healthItems.map((item, index) => (
          <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              {item.label}
            </Typography>
            <Chip
              icon={getStatusIcon(item.status)}
              label={item.value}
              color={getStatusColor(item.status)}
              size="small"
              variant="outlined"
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default SystemHealth;


