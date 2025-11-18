import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Stack
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useWebSocket } from '../hooks/useWebSocket';
import { getTradingStatus, startTrading, stopTrading, getAccountOverview, subscribeMarket } from '../api';
import { useStore } from '../store/useStore';
import TradingChart from './TradingChart';
import MetricsPanel from './MetricsPanel';
import PositionsPanel from './PositionsPanel';
import LogsPanel from './LogsPanel';
import SystemHealth from './SystemHealth';
import NotificationsPanel from './NotificationsPanel';
import MarketPulse from './MarketPulse';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
  lg: [
    { i: 'chart', x: 0, y: 0, w: 8, h: 15 },
    { i: 'pulse', x: 8, y: 0, w: 4, h: 11 },
    { i: 'metrics', x: 0, y: 15, w: 4, h: 11 },
    { i: 'positions', x: 4, y: 15, w: 4, h: 11 },
    { i: 'logs', x: 8, y: 11, w: 4, h: 9 },
    { i: 'notifications', x: 8, y: 20, w: 4, h: 8 },
    { i: 'system', x: 0, y: 26, w: 4, h: 8 },
    { i: 'account', x: 4, y: 26, w: 4, h: 8 }
  ],
};

function AdvancedDashboard() {
  const { connected, metrics, positions, logs, notifications, trades, marketData } = useWebSocket();
  const { tradingActive, setTradingActive } = useStore();
  const [tradingStatus, setTradingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [accountOverview, setAccountOverview] = useState(null);
  const [marketSelection, setMarketSelection] = useState({ symbol: 'ETH/USDT', timeframe: '2m' });
  const [layouts, setLayouts] = useState(() => {
    if (typeof window === 'undefined') return defaultLayouts;
    const saved = window.localStorage.getItem('dashboardLayouts');
    return saved ? JSON.parse(saved) : defaultLayouts;
  });

  const loadStatus = useCallback(async () => {
    try {
      const response = await getTradingStatus();
      setTradingStatus(response.data);
      setTradingActive(response.data?.running || false);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  }, [setTradingActive]);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => {
      loadStatus();
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [loadStatus]);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await getAccountOverview();
        setAccountOverview(response.data);
      } catch (error) {
        console.error('Error loading account overview:', error);
      }
    };
    loadAccount();
    const interval = setInterval(loadAccount, 15000);
    return () => clearInterval(interval);
  }, []);

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

  const handleMarketChange = async (field, value) => {
    const nextSelection = { ...marketSelection, [field]: value };
    setMarketSelection(nextSelection);
    try {
      await subscribeMarket(nextSelection.symbol, nextSelection.timeframe);
    } catch (error) {
      console.error('Error subscribing to market data:', error);
    }
  };

  const handleLayoutChange = (_, allLayouts) => {
    setLayouts(allLayouts);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts));
    }
  };

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

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          label="Symbol"
          value={marketSelection.symbol}
          onChange={(e) => handleMarketChange('symbol', e.target.value)}
          size="small"
          sx={{ width: 200 }}
        >
          {['ETH/USDT', 'BTC/USDT', 'SOL/USDT', 'XRP/USDT'].map(symbol => (
            <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Timeframe"
          value={marketSelection.timeframe}
          onChange={(e) => handleMarketChange('timeframe', e.target.value)}
          size="small"
          sx={{ width: 160 }}
        >
          {['1m', '2m', '5m', '15m', '1h', '4h'].map(tf => (
            <MenuItem key={tf} value={tf}>{tf}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        rowHeight={30}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
      >
        <div key="chart">
          <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="drag-handle">
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Price Chart
              </Typography>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={loadStatus}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
            <TradingChart candles={marketData.candles} trades={trades} darkMode />
          </Paper>
        </div>
        <div key="pulse">
          <MarketPulse data={{ ...marketData, symbol: marketSelection.symbol }} />
        </div>
        <div key="metrics">
          <MetricsPanel metrics={metrics || tradingStatus?.metrics} />
        </div>
        <div key="positions">
          <PositionsPanel positions={positions} />
        </div>
        <div key="logs">
          <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Live Logs
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <LogsPanel logs={logs} />
          </Paper>
        </div>
        <div key="notifications">
          <NotificationsPanel notifications={notifications} />
        </div>
        <div key="system">
          <SystemHealth connected={connected} tradingActive={isRunning} />
        </div>
        <div key="account">
          <Paper sx={{ p: 2, bgcolor: 'background.paper', height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Account Overview
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {accountOverview ? (
              <Stack spacing={1}>
                <Typography variant="body2">Portfolio Value: {accountOverview.portfolio_value || '—'}</Typography>
                <Typography variant="body2">Mark Price: {accountOverview.mark_price || '—'}</Typography>
                <Typography variant="body2">Funding Rate: {accountOverview.funding_rate || '—'}</Typography>
                <Typography variant="body2">Mode: {accountOverview.account_type}</Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="textSecondary">Loading balances…</Typography>
            )}
          </Paper>
        </div>
      </ResponsiveGridLayout>
    </Box>
  );
}

export default AdvancedDashboard;


