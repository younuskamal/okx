import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Alert,
  Chip
} from '@mui/material';
import { Download, Refresh, CheckCircle } from '@mui/icons-material';
import { getDatasets, downloadData } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useStore } from '../store/useStore';

function DataManager() {
  const { backtestUpdate } = useWebSocket();
  const { datasets, setDatasets, dataDownloadProgress, setDataDownloadProgress } = useStore();
  const [loading, setLoading] = useState(false);
  const [downloadParams, setDownloadParams] = useState({
    symbol: 'ETH/USDT',
    timeframe: '2m',
    days: 365
  });

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (backtestUpdate?.type === 'data_download') {
      setDataDownloadProgress(backtestUpdate);
    }
  }, [backtestUpdate, setDataDownloadProgress]);

  const loadDatasets = async () => {
    try {
      const response = await getDatasets();
      setDatasets(response.data.datasets || []);
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      await downloadData(downloadParams.symbol, downloadParams.timeframe, downloadParams.days);
    } catch (error) {
      console.error('Error starting download:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h5" gutterBottom>
          Historical Data Manager
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Download and manage historical OHLCV data for backtesting
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Symbol"
              value={downloadParams.symbol}
              onChange={(e) => setDownloadParams({ ...downloadParams, symbol: e.target.value })}
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Timeframe"
              value={downloadParams.timeframe}
              onChange={(e) => setDownloadParams({ ...downloadParams, timeframe: e.target.value })}
              helperText="e.g., 2m, 5m, 15m, 1h"
              sx={{ mb: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Days"
              type="number"
              value={downloadParams.days}
              onChange={(e) => setDownloadParams({ ...downloadParams, days: parseInt(e.target.value) })}
              sx={{ mb: 2 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownload}
            disabled={loading || (dataDownloadProgress?.status === 'downloading')}
          >
            {dataDownloadProgress?.status === 'downloading' ? 'Downloading...' : 'Download Data'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDatasets}
          >
            Refresh List
          </Button>
        </Box>

        {dataDownloadProgress && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {dataDownloadProgress.message || dataDownloadProgress.status}
              {dataDownloadProgress.progress !== undefined && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={dataDownloadProgress.progress} 
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {dataDownloadProgress.progress.toFixed(1)}% - {dataDownloadProgress.candles_downloaded || 0} candles
                  </Typography>
                </Box>
              )}
            </Alert>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          Available Datasets
        </Typography>

        {datasets.length === 0 ? (
          <Alert severity="info">
            No datasets available. Download data to get started.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Timeframe</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Total Candles</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datasets.map((dataset, index) => (
                  <TableRow key={index}>
                    <TableCell>{dataset.symbol}</TableCell>
                    <TableCell>
                      <Chip label={dataset.timeframe} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(dataset.start_date)}</TableCell>
                    <TableCell>{formatDate(dataset.end_date)}</TableCell>
                    <TableCell>{dataset.total_candles?.toLocaleString()}</TableCell>
                    <TableCell>{formatDate(dataset.last_updated)}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={<CheckCircle />} 
                        label="Ready" 
                        color="success" 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default DataManager;


