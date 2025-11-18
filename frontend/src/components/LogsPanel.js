import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';

function LogsPanel({ logs }) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {logs && logs.length > 0 ? (
        logs.map((log, index) => (
          <Box
            key={index}
            sx={{
              mb: 1,
              p: 1,
              bgcolor: 'background.default',
              borderRadius: 1,
              fontSize: '0.875rem'
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              <Chip
                label={log.level || 'info'}
                size="small"
                color={getLogColor(log.level)}
              />
              <Typography variant="caption" color="textSecondary">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
              </Typography>
            </Box>
            <Typography variant="body2">{log.message}</Typography>
          </Box>
        ))
      ) : (
        <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
          No logs yet
        </Typography>
      )}
      <div ref={logsEndRef} />
    </Box>
  );
}

export default LogsPanel;


