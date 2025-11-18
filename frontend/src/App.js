import React, { useState, useEffect } from 'react';
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
  createTheme
} from '@mui/material';
import Dashboard from './components/AdvancedDashboard';
import Settings from './components/AdvancedSettings';
import Backtest from './components/Backtest';
import Trades from './components/Trades';
import DataManager from './components/DataManager';
import { useWebSocket } from './hooks/useWebSocket';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
    },
    secondary: {
      main: '#ff6b6b',
    },
    background: {
      default: '#0a0e27',
      paper: '#1a1f3a',
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const { connected, logs } = useWebSocket();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Update tab based on route
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path === '/') setCurrentTab(0);
    else if (path === '/settings') setCurrentTab(1);
    else if (path === '/data') setCurrentTab(2);
    else if (path === '/backtest') setCurrentTab(3);
    else if (path === '/trades') setCurrentTab(4);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
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

export default App;

