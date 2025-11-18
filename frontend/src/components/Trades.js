import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination
} from '@mui/material';
import { getTrades } from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

function Trades() {
  const { trades: wsTrades } = useWebSocket();
  const [trades, setTrades] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    loadTrades();
  }, [page]);

  useEffect(() => {
    if (wsTrades && wsTrades.length > 0) {
      setTrades(prev => [wsTrades[0], ...prev]);
    }
  }, [wsTrades]);

  const loadTrades = async () => {
    try {
      const response = await getTrades(pageSize, (page - 1) * pageSize);
      setTrades(response.data.trades || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h5" gutterBottom>
        Trade History
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Exit Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>P&L</TableCell>
              <TableCell>P&L %</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell>{formatDate(trade.entry_time)}</TableCell>
                <TableCell>{trade.symbol}</TableCell>
                <TableCell>
                  <Chip
                    label={trade.side?.toUpperCase()}
                    color={trade.side === 'buy' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>${trade.entry_price?.toFixed(2)}</TableCell>
                <TableCell>${trade.exit_price?.toFixed(2)}</TableCell>
                <TableCell>{trade.quantity?.toFixed(4)}</TableCell>
                <TableCell
                  sx={{
                    color: trade.pnl >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}
                >
                  ${trade.pnl?.toFixed(2)}
                </TableCell>
                <TableCell
                  sx={{
                    color: trade.pnl_percent >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {trade.pnl_percent?.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Chip
                    label={trade.reason || 'exit'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {total > pageSize && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(total / pageSize)}
            page={page}
            onChange={(e, v) => setPage(v)}
            color="primary"
          />
        </Box>
      )}

      {trades.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">
            No trades found
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default Trades;


