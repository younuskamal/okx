import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import { PlayArrow, Stop, TrendingUp, TrendingDown } from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';
import { getTradingStatus, startTrading, stopTrading, getMetrics } from '../api';
import PriceChart from './PriceChart';
import LogsPanel from './LogsPanel';

function Dashboard() {
  const { connected, metrics, positions, logs } = useWebSocket();
  const [tradingStatus, setTradingStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await getTradingStatus();
      setTradingStatus(response.data);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await startTrading();
      await loadStatus();
    } catch (error) {
      console.error('Error starting trading:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopTrading();
      await loadStatus();
    } catch (error) {
      console.error('Error stopping trading:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRunning = tradingStatus?.running || false;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Control Panel */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2">
                Trading Control
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={handleStart}
                  disabled={isRunning || loading || !connected}
                >
                  Start Trading
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={handleStop}
                  disabled={!isRunning || loading || !connected}
                >
                  Stop Trading
                </Button>
              </Box>
            </Box>
            {isRunning && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Trading is active...
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Metrics Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Trades
              </Typography>
              <Typography variant="h4">
                {metrics?.total_trades || tradingStatus?.metrics?.total_trades || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Win Rate
              </Typography>
              <Typography variant="h4">
                {metrics?.win_rate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total P&L
              </Typography>
              <Typography 
                variant="h4" 
                color={metrics?.total_pnl >= 0 ? 'success.main' : 'error.main'}
              >
                ${(metrics?.total_pnl || tradingStatus?.metrics?.total_pnl || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Positions
              </Typography>
              <Typography variant="h4">
                {positions?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Positions */}
        {positions && positions.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Active Positions
              </Typography>
              <Grid container spacing={2}>
                {positions.map((position) => (
                  <Grid item xs={12} md={6} key={position.position_id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6">
                            {position.symbol} {position.side.toUpperCase()}
                          </Typography>
                          <Chip
                            label={position.side}
                            color={position.side === 'buy' ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Entry: ${position.entry_price?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Current: ${position.current_price?.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Quantity: {position.quantity?.toFixed(4)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Stop Loss: ${position.stop_loss?.toFixed(2)}
                        </Typography>
                        {position.unrealized_pnl !== undefined && (
                          <Typography
                            variant="h6"
                            color={position.unrealized_pnl >= 0 ? 'success.main' : 'error.main'}
                            sx={{ mt: 1 }}
                          >
                            Unrealized P&L: ${position.unrealized_pnl.toFixed(2)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Price Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper', height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Price Chart
            </Typography>
            <PriceChart />
          </Paper>
        </Grid>

        {/* Logs */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper', height: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Live Logs
            </Typography>
            <LogsPanel logs={logs} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;


