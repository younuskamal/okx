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
  Tab
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { getSettings, updateSettings } from '../api';

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState(0);

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

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await updateSettings(settings);
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
  };

  if (!settings) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Box>
      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Settings</Typography>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={loading}
          >
            Save All Settings
          </Button>
        </Box>

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Settings saved successfully!
          </Alert>
        )}

        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Strategy" />
          <Tab label="Trading" />
          <Tab label="Risk Management" />
          <Tab label="API Keys" />
        </Tabs>

        {/* Strategy Settings */}
        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Engulf Strength"
                type="number"
                value={settings.strategy?.engulf_strength || 1.3}
                onChange={(e) => updateSetting('strategy', 'engulf_strength', parseFloat(e.target.value))}
                helperText="Multiplier for engulfing range (default: 1.3)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Close Near Percent"
                type="number"
                value={settings.strategy?.close_near_percent || 0.1}
                onChange={(e) => updateSetting('strategy', 'close_near_percent', parseFloat(e.target.value))}
                helperText="Close proximity to high/low (default: 0.1 = 10%)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Range Pips (Current)"
                type="number"
                value={settings.strategy?.min_range_pips_current || 15}
                onChange={(e) => updateSetting('strategy', 'min_range_pips_current', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Range Pips (Previous)"
                type="number"
                value={settings.strategy?.min_range_pips_previous || 10}
                onChange={(e) => updateSetting('strategy', 'min_range_pips_previous', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timeframe"
                value={settings.strategy?.timeframe || '2m'}
                onChange={(e) => updateSetting('strategy', 'timeframe', e.target.value)}
                helperText="e.g., 2m, 5m, 15m, 1h"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Symbol"
                value={settings.strategy?.symbol || 'ETH/USDT'}
                onChange={(e) => updateSetting('strategy', 'symbol', e.target.value)}
              />
            </Grid>
          </Grid>
        )}

        {/* Trading Settings */}
        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Trading Window Start (Hour)"
                type="number"
                value={settings.trading?.trading_window_start || 15}
                onChange={(e) => updateSetting('trading', 'trading_window_start', parseInt(e.target.value))}
                helperText="Local time hour (0-23)"
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timezone"
                value={settings.trading?.timezone || 'Europe/Moscow'}
                onChange={(e) => updateSetting('trading', 'timezone', e.target.value)}
                helperText="e.g., Europe/Moscow (UTC+3)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Positions"
                type="number"
                value={settings.trading?.max_positions || 1}
                onChange={(e) => updateSetting('trading', 'max_positions', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position Size (%)"
                type="number"
                value={settings.trading?.position_size_percent || 10}
                onChange={(e) => updateSetting('trading', 'position_size_percent', parseFloat(e.target.value))}
                helperText="Percentage of balance per trade"
              />
            </Grid>
          </Grid>
        )}

        {/* Risk Management */}
        {tab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Structural SL Buffer (Pips)"
                type="number"
                value={settings.risk?.structural_sl_buffer_pips || 5}
                onChange={(e) => updateSetting('risk', 'structural_sl_buffer_pips', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Profit (Pips)"
                type="number"
                value={settings.risk?.min_profit_pips || 0}
                onChange={(e) => updateSetting('risk', 'min_profit_pips', parseInt(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Profit (USD)"
                type="number"
                value={settings.risk?.min_profit_money || 0}
                onChange={(e) => updateSetting('risk', 'min_profit_money', parseFloat(e.target.value))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.risk?.close_at_first_profit || true}
                    onChange={(e) => updateSetting('risk', 'close_at_first_profit', e.target.checked)}
                  />
                }
                label="Close at First Profit"
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
        )}

        {/* API Keys */}
        {tab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="warning">
                API keys are stored securely. Never share your API keys.
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OKX API Key"
                type="password"
                value={settings.api_keys?.okx_api_key || ''}
                onChange={(e) => updateSetting('api_keys', 'okx_api_key', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OKX Secret Key"
                type="password"
                value={settings.api_keys?.okx_secret_key || ''}
                onChange={(e) => updateSetting('api_keys', 'okx_secret_key', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="OKX Passphrase"
                type="password"
                value={settings.api_keys?.okx_passphrase || ''}
                onChange={(e) => updateSetting('api_keys', 'okx_passphrase', e.target.value)}
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
                label="Sandbox Mode (Testing)"
              />
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );
}

export default Settings;


