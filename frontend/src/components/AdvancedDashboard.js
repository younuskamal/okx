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
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';
import { getTradingStatus, startTrading, stopTrading, getMetrics } from '../api';
import { useStore } from '../store/useStore';
import TradingChart from './TradingChart';
import MetricsPanel from './MetricsPanel';
import PositionsPanel from './PositionsPanel';
import LogsPanel from './LogsPanel';
import SystemHealth from './SystemHealth';
import NotificationsPanel from './NotificationsPanel';

function AdvancedDashboard() {
  const { connected, metrics, positions, logs, notifications } = useWebSocket();
  const { tradingActive, setTradingActive } = useStore();
  const [tradingStatus, setTradingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => {
      loadStatus();
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await getTradingStatus();
      setTradingStatus(response.data);
      setTradingActive(response.data?.running || false);
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

  const isRunning = tradingStatus?.running || tradingActive;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Trading Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Real-time monitoring and control
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            icon={connected ? <CheckCircle /> : <Warning />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            variant="outlined"
          />
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
            onClick={handleStart}
            disabled={isRunning || loading || !connected}
            size="large"
          >
            Start Trading
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Stop />}
            onClick={handleStop}
            disabled={!isRunning || loading || !connected}
            size="large"
          >
            Stop Trading
          </Button>
        </Box>
      </Box>

      {/* Status Bar */}
      {isRunning && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.dark', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress sx={{ flexGrow: 1, height: 8, borderRadius: 1 }} />
            <Typography variant="body2">
              Trading Active • Last Update: {lastUpdate.toLocaleTimeString()}
            </Typography>
          </Box>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Charts and Main View */}
        <Grid item xs={12} lg={8}>
          {/* Trading Chart */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', height: 500 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Price Chart
              </Typography>
              <Box>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={loadStatus}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <TradingChart />
          </Paper>

          {/* Metrics Panel */}
          <MetricsPanel metrics={metrics || tradingStatus?.metrics} />
        </Grid>

        {/* Right Column - Info Panels */}
        <Grid item xs={12} lg={4}>
          {/* System Health */}
          <SystemHealth connected={connected} tradingActive={isRunning} />

          {/* Active Positions */}
          <PositionsPanel positions={positions} />

          {/* Live Logs */}
          <Paper sx={{ p: 2, bgcolor: 'background.paper', height: 300, overflow: 'auto', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Live Logs
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <LogsPanel logs={logs} />
          </Paper>

          <NotificationsPanel notifications={notifications} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdvancedDashboard;


