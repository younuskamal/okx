import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save,
  ExpandMore,
  Settings as SettingsIcon,
  Security,
  TrendingUp,
  Schedule,
  Api
} from '@mui/icons-material';
import { getSettings, updateCategorySettings, updateSingleSetting } from '../api';

function AdvancedSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveCategory = async (category) => {
    setLoading(true);
    setSaved(false);
    try {
      await updateCategorySettings(category, settings[category]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error.response?.data?.detail) {
        setErrors({ [category]: error.response.data.detail });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    setSaved(false);
    try {
      // Save each category
      for (const category of Object.keys(settings)) {
        await updateCategorySettings(category, settings[category]);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    // Clear error for this field
    if (errors[category]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[category];
        return newErrors;
      });
    }
  };

  const updateSingle = async (category, key, value) => {
    try {
      await updateSingleSetting(category, key, value);
      updateSetting(category, key, value);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  if (!settings) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          System Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveAll}
          disabled={loading}
          size="large"
        >
          Save All Settings
        </Button>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {Object.values(errors)[0]}
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<TrendingUp />} label="Strategy" />
        <Tab icon={<Schedule />} label="Trading" />
        <Tab icon={<Security />} label="Risk Management" />
        <Tab icon={<Api />} label="API Keys" />
        <Tab icon={<SettingsIcon />} label="Advanced" />
      </Tabs>

      {/* Strategy Settings */}
      {tab === 0 && (
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Strategy Parameters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engulf Strength"
                type="number"
                value={settings.strategy?.engulf_strength || 1.3}
                onChange={(e) => updateSetting('strategy', 'engulf_strength', parseFloat(e.target.value))}
                helperText="Multiplier for engulfing range (1.0-5.0)"
                inputProps={{ min: 1.0, max: 5.0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Close Near Percent"
                type="number"
                value={settings.strategy?.close_near_percent || 0.1}
                onChange={(e) => updateSetting('strategy', 'close_near_percent', parseFloat(e.target.value))}
                helperText="Close proximity to high/low (0.0-1.0)"
                inputProps={{ min: 0, max: 1, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Range Pips (Current Candle)"
                type="number"
                value={settings.strategy?.min_range_pips_current || 15}
                onChange={(e) => updateSetting('strategy', 'min_range_pips_current', parseInt(e.target.value))}
                helperText="Minimum range for current candle in pips"
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Range Pips (Previous Candle)"
                type="number"
                value={settings.strategy?.min_range_pips_previous || 10}
                onChange={(e) => updateSetting('strategy', 'min_range_pips_previous', parseInt(e.target.value))}
                helperText="Minimum range for previous candle in pips"
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={settings.strategy?.timeframe || '2m'}
                  onChange={(e) => updateSetting('strategy', 'timeframe', e.target.value)}
                  label="Timeframe"
                >
                  <MenuItem value="1m">1 Minute</MenuItem>
                  <MenuItem value="2m">2 Minutes</MenuItem>
                  <MenuItem value="3m">3 Minutes</MenuItem>
                  <MenuItem value="5m">5 Minutes</MenuItem>
                  <MenuItem value="15m">15 Minutes</MenuItem>
                  <MenuItem value="30m">30 Minutes</MenuItem>
                  <MenuItem value="1h">1 Hour</MenuItem>
                  <MenuItem value="2h">2 Hours</MenuItem>
                  <MenuItem value="4h">4 Hours</MenuItem>
                  <MenuItem value="1d">1 Day</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trading Symbol"
                value={settings.strategy?.symbol || 'ETH/USDT'}
                onChange={(e) => updateSetting('strategy', 'symbol', e.target.value)}
                helperText="Trading pair (e.g., ETH/USDT, BTC/USDT)"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleSaveCategory('strategy')}
              disabled={loading}
            >
              Save Strategy Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Trading Settings */}
      {tab === 1 && (
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Trading Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trading Window Start (Hour)"
                type="number"
                value={settings.trading?.trading_window_start || 15}
                onChange={(e) => updateSetting('trading', 'trading_window_start', parseInt(e.target.value))}
                helperText="Local time hour (0-23)"
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trading Window End (Hour)"
                type="number"
                value={settings.trading?.trading_window_end || 19}
                onChange={(e) => updateSetting('trading', 'trading_window_end', parseInt(e.target.value))}
                helperText="Local time hour (0-23)"
                inputProps={{ min: 0, max: 23 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timezone"
                value={settings.trading?.timezone || 'Europe/Moscow'}
                onChange={(e) => updateSetting('trading', 'timezone', e.target.value)}
                helperText="Timezone (e.g., Europe/Moscow for UTC+3)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Concurrent Positions"
                type="number"
                value={settings.trading?.max_positions || 1}
                onChange={(e) => updateSetting('trading', 'max_positions', parseInt(e.target.value))}
                helperText="Maximum number of simultaneous positions"
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position Size (%)"
                type="number"
                value={settings.trading?.position_size_percent || 10}
                onChange={(e) => updateSetting('trading', 'position_size_percent', parseFloat(e.target.value))}
                helperText="Percentage of balance per trade (0.1-100)"
                inputProps={{ min: 0.1, max: 100, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trading Mode</InputLabel>
                <Select
                  value={settings.trading?.mode || 'paper'}
                  onChange={(e) => updateSetting('trading', 'mode', e.target.value)}
                  label="Trading Mode"
                >
                  <MenuItem value="paper">Paper Trading (Simulation)</MenuItem>
                  <MenuItem value="live">Live Trading</MenuItem>
                  <MenuItem value="backtest">Backtest Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleSaveCategory('trading')}
              disabled={loading}
            >
              Save Trading Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Risk Management */}
      {tab === 2 && (
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Risk Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Structural SL Buffer (Pips)"
                type="number"
                value={settings.risk?.structural_sl_buffer_pips || 5}
                onChange={(e) => updateSetting('risk', 'structural_sl_buffer_pips', parseInt(e.target.value))}
                helperText="Stop loss buffer in pips (0-100)"
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Profit (Pips)"
                type="number"
                value={settings.risk?.min_profit_pips || 0}
                onChange={(e) => updateSetting('risk', 'min_profit_pips', parseInt(e.target.value))}
                helperText="Minimum profit in pips to exit (0 = disabled)"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Profit (USD)"
                type="number"
                value={settings.risk?.min_profit_money || 0}
                onChange={(e) => updateSetting('risk', 'min_profit_money', parseFloat(e.target.value))}
                helperText="Minimum profit in USD to exit (0 = disabled)"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.risk?.close_at_first_profit !== false}
                    onChange={(e) => updateSetting('risk', 'close_at_first_profit', e.target.checked)}
                  />
                }
                label="Close at First Profit (Exit immediately when trade becomes profitable)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.risk?.stop_loss_enabled !== false}
                    onChange={(e) => updateSetting('risk', 'stop_loss_enabled', e.target.checked)}
                  />
                }
                label="Stop Loss Enabled"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.risk?.take_profit_enabled !== false}
                    onChange={(e) => updateSetting('risk', 'take_profit_enabled', e.target.checked)}
                  />
                }
                label="Take Profit Enabled"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleSaveCategory('risk')}
              disabled={loading}
            >
              Save Risk Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* API Keys */}
      {tab === 3 && (
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            API Configuration
          </Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            API keys are stored securely. Never share your API keys with anyone.
          </Alert>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OKX API Key"
                type="password"
                value={settings.api_keys?.okx_api_key || ''}
                onChange={(e) => updateSetting('api_keys', 'okx_api_key', e.target.value)}
                helperText="Your OKX API key"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OKX Secret Key"
                type="password"
                value={settings.api_keys?.okx_secret_key || ''}
                onChange={(e) => updateSetting('api_keys', 'okx_secret_key', e.target.value)}
                helperText="Your OKX secret key"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OKX Passphrase"
                type="password"
                value={settings.api_keys?.okx_passphrase || ''}
                onChange={(e) => updateSetting('api_keys', 'okx_passphrase', e.target.value)}
                helperText="Your OKX API passphrase"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.api_keys?.okx_sandbox !== false}
                    onChange={(e) => updateSetting('api_keys', 'okx_sandbox', e.target.checked)}
                  />
                }
                label="Sandbox Mode (Testing - Recommended for development)"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleSaveCategory('api_keys')}
              disabled={loading}
            >
              Save API Settings
            </Button>
          </Box>
        </Paper>
      )}

      {/* Advanced Settings */}
      {tab === 4 && (
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Advanced Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Candle Refresh Interval (seconds)"
                type="number"
                value={settings.advanced?.candle_refresh_interval || 120}
                onChange={(e) => updateSetting('advanced', 'candle_refresh_interval', parseInt(e.target.value))}
                helperText="How often to fetch new candles (seconds)"
                inputProps={{ min: 10, max: 600 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Max Retry Attempts"
                type="number"
                value={settings.advanced?.max_retry_attempts || 3}
                onChange={(e) => updateSetting('advanced', 'max_retry_attempts', parseInt(e.target.value))}
                helperText="Maximum retry attempts for failed API calls"
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.advanced?.auto_restart || false}
                    onChange={(e) => updateSetting('advanced', 'auto_restart', e.target.checked)}
                  />
                }
                label="Auto Restart on Error"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.advanced?.enable_logging !== false}
                    onChange={(e) => updateSetting('advanced', 'enable_logging', e.target.checked)}
                  />
                }
                label="Enable Detailed Logging"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleSaveCategory('advanced')}
              disabled={loading}
            >
              Save Advanced Settings
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default AdvancedSettings;


