import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance, ShowChart } from '@mui/icons-material';

function MetricsPanel({ metrics }) {
  if (!metrics) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="textSecondary">No metrics available</Typography>
      </Box>
    );
  }

  const metricCards = [
    {
      title: 'Total Trades',
      value: metrics.total_trades || 0,
      icon: <ShowChart />,
      color: 'primary'
    },
    {
      title: 'Win Rate',
      value: `${(metrics.win_rate || 0).toFixed(1)}%`,
      icon: <TrendingUp />,
      color: 'success'
    },
    {
      title: 'Total P&L',
      value: `$${(metrics.total_pnl || 0).toFixed(2)}`,
      icon: <AccountBalance />,
      color: metrics.total_pnl >= 0 ? 'success' : 'error'
    },
    {
      title: 'Active Positions',
      value: metrics.positions_count || 0,
      icon: <TrendingDown />,
      color: 'info'
    }
  ];

  return (
    <Grid container spacing={2}>
      {metricCards.map((card, index) => (
        <Grid item xs={6} md={3} key={index}>
          <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ color: `${card.color}.main`, mr: 1 }}>
                  {card.icon}
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {card.title}
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: `${card.color}.main` }}
              >
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default MetricsPanel;


