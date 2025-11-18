import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Box
} from '@mui/material';
import {
  NotificationsActive,
  ErrorOutline,
  CheckCircleOutline,
  WarningAmber
} from '@mui/icons-material';

const severityMap = {
  success: { icon: <CheckCircleOutline color="success" />, label: 'Success', color: 'success' },
  error: { icon: <ErrorOutline color="error" />, label: 'Error', color: 'error' },
  warning: { icon: <WarningAmber color="warning" />, label: 'Warning', color: 'warning' },
  info: { icon: <NotificationsActive color="primary" />, label: 'Info', color: 'primary' }
};

function NotificationsPanel({ notifications = [] }) {
  const items = notifications.slice(0, 6);

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper', height: 320, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Notifications
        </Typography>
        <Chip
          size="small"
          color="primary"
          label={`${items.length} new`}
          variant="outlined"
        />
      </Box>
      <Divider sx={{ mb: 2 }} />
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No alerts yet. Stay tuned!
        </Typography>
      ) : (
        <List dense sx={{ overflowY: 'auto', maxHeight: 250 }}>
          {items.map((notification, index) => {
            const severity = severityMap[notification.severity] || severityMap.info;
            return (
              <ListItem key={`${notification.timestamp}-${index}`} alignItems="flex-start">
                <ListItemIcon>
                  {severity.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {notification.message}
                    </Typography>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Paper>
  );
}

export default NotificationsPanel;
