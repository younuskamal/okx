import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  CssBaseline,
  ThemeProvider,
  createTheme,
  IconButton
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import Dashboard from './components/AdvancedDashboard';
import Settings from './components/AdvancedSettings';
import Backtest from './components/Backtest';
import Trades from './components/Trades';
import DataManager from './components/DataManager';
import { WebSocketProvider, useWebSocket } from './hooks/useWebSocket';

function AppShell() {
  const [currentTab, setCurrentTab] = useState(0);
  const [mode, setMode] = useState('dark');
  const { connected } = useWebSocket();
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#00d4ff' },
      secondary: { main: '#ff6b6b' },
      background: {
        default: mode === 'dark' ? '#0a0e27' : '#f5f6fa',
        paper: mode === 'dark' ? '#1a1f3a' : '#ffffff',
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, sans-serif'
    }
  }), [mode]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Update tab based on route
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === '/') setCurrentTab(0);
    else if (path === '/settings') setCurrentTab(1);
    else if (path === '/data') setCurrentTab(2);
    else if (path === '/backtest') setCurrentTab(3);
    else if (path === '/trades') setCurrentTab(4);
  }, []);

  const toggleMode = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" sx={{ bgcolor: '#1a1f3a' }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                OKX Trading System
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mr: 2
              }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: connected ? 'success.main' : 'error.main',
                    animation: connected ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
                <Typography variant="body2">
                  {connected ? 'Connected' : 'Disconnected'}
                </Typography>
                <IconButton color="inherit" onClick={toggleMode}>
                  {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Box>
            </Toolbar>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Dashboard" component={Link} to="/" />
              <Tab label="Settings" component={Link} to="/settings" />
              <Tab label="Data" component={Link} to="/data" />
              <Tab label="Backtest" component={Link} to="/backtest" />
              <Tab label="Trades" component={Link} to="/trades" />
            </Tabs>
          </AppBar>

          <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/data" element={<DataManager />} />
              <Route path="/backtest" element={<Backtest />} />
              <Route path="/trades" element={<Trades />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <WebSocketProvider>
      <AppShell />
    </WebSocketProvider>
  );
}

export default App;

