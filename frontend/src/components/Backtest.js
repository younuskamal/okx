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
  Divider,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Stack
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { runBacktest, runOptimizer } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import BacktestChart from './BacktestChart';

function Backtest() {
  const { backtestUpdate } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('standard');
  const [optimizerLoading, setOptimizerLoading] = useState(false);
  const [optimizerResults, setOptimizerResults] = useState(null);
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

  const [optimizerConfig, setOptimizerConfig] = useState({
    strategy_ranges: {
      engulf_strength: { start: 1.1, end: 1.6, step: 0.1 },
      close_near_percent: { start: 0.05, end: 0.2, step: 0.05 }
    },
    risk_ranges: {
      structural_sl_buffer_pips: { start: 3, end: 8, step: 1 },
      min_profit_pips: { start: 0, end: 10, step: 5 }
    }
  });

  const formatNumber = (value, digits = 2) =>
    value || value === 0 ? Number(value).toFixed(digits) : '0.00';
  const summary = results?.summary || results;
  const forwardResults = results?.forward;
  const comparison = results?.comparison;
  const explorer = summary?.trade_explorer || {};
  const monteCarlo = summary?.monte_carlo || {};
  const summaryMetrics = summary ? [
    { label: 'Total Trades', value: summary.total_trades },
    { label: 'Win Rate', value: `${formatNumber(summary.win_rate)}%` },
    { label: 'ROI', value: `${formatNumber(summary.roi)}%`, color: summary.roi >= 0 ? 'success.main' : 'error.main' },
    { label: 'Profit Factor', value: formatNumber(summary.profit_factor) },
    { label: 'Sharpe', value: formatNumber(summary.sharpe_ratio) },
    { label: 'Max Drawdown', value: `${formatNumber(summary.max_drawdown)}%`, color: 'error.main' },
  ] : [];

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

  const updateOptimizerRange = (section, key, field, value) => {
    setOptimizerConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: { ...prev[section][key], [field]: value }
      }
    }));
  };

  const handleTabChange = (_, newValue) => setActiveTab(newValue);

  const handleRunOptimizer = async () => {
    setOptimizerLoading(true);
    try {
      const payload = {
        symbol: params.symbol,
        timeframe: params.timeframe,
        start_date: `${params.start_date}T00:00:00Z`,
        end_date: `${params.end_date}T23:59:59Z`,
        strategy_ranges: optimizerConfig.strategy_ranges,
        risk_ranges: optimizerConfig.risk_ranges
      };
      const response = await runOptimizer(payload);
      setOptimizerResults(response.data);
    } catch (error) {
      console.error('Optimizer failed:', error);
    } finally {
      setOptimizerLoading(false);
    }
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
          <Paper sx={{ p: 3, bgcolor: 'background.paper', minHeight: 500 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Standard" value="standard" />
                <Tab label="Forward Test" value="forward" />
                <Tab label="Trade Explorer" value="explorer" />
                <Tab label="Optimizer" value="optimizer" />
              </Tabs>
            </Box>

            {loading && !summary && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {activeTab === 'standard' && (
              summary ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {summaryMetrics.map(metric => (
                      <Grid item xs={6} md={4} key={metric.label}>
                        <Card>
                          <CardContent>
                            <Typography color="textSecondary">{metric.label}</Typography>
                            <Typography variant="h5" color={metric.color || 'textPrimary'}>
                              {metric.value}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  <BacktestChart results={summary} />
                </Box>
              ) : (
                <Alert severity="info">Configure parameters and run a backtest to see results.</Alert>
              )
            )}

            {activeTab === 'forward' && (
              forwardResults ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2">Training Period</Typography>
                        <Typography variant="h4">{formatNumber(summary?.roi)}% ROI</Typography>
                        <Typography variant="body2">Win Rate: {formatNumber(summary?.win_rate)}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2">Forward Validation</Typography>
                        <Typography variant="h4">{formatNumber(forwardResults.roi)}% ROI</Typography>
                        <Typography variant="body2">Win Rate: {formatNumber(forwardResults.win_rate)}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  {comparison && (
                    <Grid item xs={12}>
                      <Alert severity={comparison.roi_delta >= 0 ? 'success' : 'warning'}>
                        ROI Delta: {formatNumber(comparison.roi_delta)}% • Win Rate Delta: {formatNumber(comparison.win_rate_delta)}%
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Alert severity="info">Enable forward split to view validation metrics.</Alert>
              )
            )}

            {activeTab === 'explorer' && (
              summary ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Best / Worst Days</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Chip label={`Best: ${explorer.best_day?.day || '—'} (${formatNumber(explorer.best_day?.pnl)})`} color="success" />
                      <Chip label={`Worst: ${explorer.worst_day?.day || '—'} (${formatNumber(explorer.worst_day?.pnl)})`} color="error" />
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Long vs Short</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Side</TableCell>
                          <TableCell>Trades</TableCell>
                          <TableCell>PnL</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(explorer.long_vs_short || []).map(row => (
                          <TableRow key={row.side}>
                            <TableCell>{row.side}</TableCell>
                            <TableCell>{row.trades}</TableCell>
                            <TableCell>{formatNumber(row.pnl)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>Monte Carlo</Typography>
                    {monteCarlo.final_balance_distribution ? (
                      <Stack spacing={1}>
                        <Typography variant="body2">Median Final Equity: {formatNumber(monteCarlo.final_balance_distribution.p50)}</Typography>
                        <Typography variant="body2">VaR (95%): {formatNumber(monteCarlo.value_at_risk)}</Typography>
                        <Typography variant="body2">Risk of Ruin: {formatNumber((monteCarlo.risk_of_ruin || 0) * 100)}%</Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2">Run a backtest to populate Monte Carlo stats.</Typography>
                    )}
                  </Box>
                </Stack>
              ) : (
                <Alert severity="info">Run a backtest to unlock explorer insights.</Alert>
              )
            )}

            {activeTab === 'optimizer' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Parameter Ranges</Typography>
                <Grid container spacing={2}>
                  {Object.entries(optimizerConfig.strategy_ranges).map(([key, range]) => (
                    <Grid item xs={12} md={6} key={key}>
                      <Typography variant="body2" sx={{ mb: 1 }}>{key}</Typography>
                      <Stack direction="row" spacing={1}>
                        {['start', 'end', 'step'].map(field => (
                          <TextField
                            key={field}
                            label={field}
                            type="number"
                            size="small"
                            value={range[field]}
                            onChange={(e) => updateOptimizerRange('strategy_ranges', key, field, parseFloat(e.target.value))}
                          />
                        ))}
                      </Stack>
                    </Grid>
                  ))}
                  {Object.entries(optimizerConfig.risk_ranges).map(([key, range]) => (
                    <Grid item xs={12} md={6} key={key}>
                      <Typography variant="body2" sx={{ mb: 1 }}>{key}</Typography>
                      <Stack direction="row" spacing={1}>
                        {['start', 'end', 'step'].map(field => (
                          <TextField
                            key={field}
                            label={field}
                            type="number"
                            size="small"
                            value={range[field]}
                            onChange={(e) => updateOptimizerRange('risk_ranges', key, field, parseFloat(e.target.value))}
                          />
                        ))}
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleRunOptimizer}
                  startIcon={optimizerLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                  disabled={optimizerLoading}
                >
                  {optimizerLoading ? 'Optimizing...' : 'Run Optimizer'}
                </Button>

                {optimizerResults && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Best Configurations (sorted by {optimizerResults.sort_key})
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Strategy</TableCell>
                          <TableCell>Risk</TableCell>
                          <TableCell>ROI</TableCell>
                          <TableCell>Win Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(optimizerResults.best || []).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {Object.entries(row.strategy_params).map(([k, v]) => (
                                <div key={k}>{k}: {v}</div>
                              ))}
                            </TableCell>
                            <TableCell>
                              {Object.entries(row.risk_params).map(([k, v]) => (
                                <div key={k}>{k}: {v}</div>
                              ))}
                            </TableCell>
                            <TableCell>{formatNumber(row.metrics.roi)}%</TableCell>
                            <TableCell>{formatNumber(row.metrics.win_rate)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Backtest;


