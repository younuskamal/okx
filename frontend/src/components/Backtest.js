import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { runBacktest, getBacktestStatus, getBacktestResults } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import BacktestChart from './BacktestChart';

function Backtest() {
  const { backtestUpdate } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [params, setParams] = useState({
    start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    timeframe: '2m',
    symbol: 'ETH/USDT',
    initial_balance: 10000,
    strategy_params: {
      engulf_strength: 1.3,
      close_near_percent: 0.1,
      min_range_pips_current: 15,
      min_range_pips_previous: 10
    },
    risk_params: {
      structural_sl_buffer_pips: 5,
      min_profit_pips: 0,
      min_profit_money: 0,
      close_at_first_profit: true
    }
  });

  useEffect(() => {
    if (backtestUpdate?.status === 'completed' && backtestUpdate?.results) {
      setResults(backtestUpdate.results);
      setLoading(false);
    }
  }, [backtestUpdate]);

  const handleRun = async () => {
    setLoading(true);
    setResults(null);
    try {
      await runBacktest({
        start_date: `${params.start_date}T00:00:00Z`,
        end_date: `${params.end_date}T23:59:59Z`,
        timeframe: params.timeframe,
        symbol: params.symbol,
        initial_balance: params.initial_balance,
        strategy_params: params.strategy_params,
        risk_params: params.risk_params
      });
    } catch (error) {
      console.error('Error running backtest:', error);
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const updateStrategyParam = (key, value) => {
    setParams(prev => ({
      ...prev,
      strategy_params: { ...prev.strategy_params, [key]: value }
    }));
  };

  const updateRiskParam = (key, value) => {
    setParams(prev => ({
      ...prev,
      risk_params: { ...prev.risk_params, [key]: value }
    }));
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Backtest Parameters */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Backtest Parameters
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={params.start_date}
                  onChange={(e) => updateParam('start_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={params.end_date}
                  onChange={(e) => updateParam('end_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Timeframe"
                  value={params.timeframe}
                  onChange={(e) => updateParam('timeframe', e.target.value)}
                  helperText="e.g., 2m, 5m, 15m, 1h"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Symbol"
                  value={params.symbol}
                  onChange={(e) => updateParam('symbol', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Initial Balance"
                  type="number"
                  value={params.initial_balance}
                  onChange={(e) => updateParam('initial_balance', parseFloat(e.target.value))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Strategy Parameters
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Engulf Strength"
                  type="number"
                  value={params.strategy_params.engulf_strength}
                  onChange={(e) => updateStrategyParam('engulf_strength', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Close Near %"
                  type="number"
                  value={params.strategy_params.close_near_percent}
                  onChange={(e) => updateStrategyParam('close_near_percent', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Range Current (Pips)"
                  type="number"
                  value={params.strategy_params.min_range_pips_current}
                  onChange={(e) => updateStrategyParam('min_range_pips_current', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Range Previous (Pips)"
                  type="number"
                  value={params.strategy_params.min_range_pips_previous}
                  onChange={(e) => updateStrategyParam('min_range_pips_previous', parseInt(e.target.value))}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Risk Parameters
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="SL Buffer (Pips)"
                  type="number"
                  value={params.risk_params.structural_sl_buffer_pips}
                  onChange={(e) => updateRiskParam('structural_sl_buffer_pips', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Profit (Pips)"
                  type="number"
                  value={params.risk_params.min_profit_pips}
                  onChange={(e) => updateRiskParam('min_profit_pips', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Profit (USD)"
                  type="number"
                  value={params.risk_params.min_profit_money}
                  onChange={(e) => updateRiskParam('min_profit_money', parseFloat(e.target.value))}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleRun}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Running...' : 'Run Backtest'}
                </Button>
              </Grid>

              {backtestUpdate && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    {backtestUpdate.message || backtestUpdate.status}
                    {backtestUpdate.progress && ` - ${backtestUpdate.progress.toFixed(1)}%`}
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Results */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6" gutterBottom>
              Backtest Results
            </Typography>

            {loading && !results && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {results && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Total Trades</Typography>
                        <Typography variant="h5">{results.total_trades}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Win Rate</Typography>
                        <Typography variant="h5">{results.win_rate?.toFixed(2)}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Total Profit</Typography>
                        <Typography 
                          variant="h5" 
                          color={results.total_profit >= 0 ? 'success.main' : 'error.main'}
                        >
                          ${results.total_profit?.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">ROI</Typography>
                        <Typography 
                          variant="h5"
                          color={results.roi >= 0 ? 'success.main' : 'error.main'}
                        >
                          {results.roi?.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Max Drawdown</Typography>
                        <Typography variant="h5" color="error.main">
                          {results.max_drawdown?.toFixed(2)}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Card>
                      <CardContent>
                        <Typography color="textSecondary">Profit Factor</Typography>
                        <Typography variant="h5">
                          {results.profit_factor?.toFixed(2)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <BacktestChart results={results} />
              </Box>
            )}

            {!loading && !results && (
              <Alert severity="info">
                Configure parameters and run a backtest to see results.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Backtest;


