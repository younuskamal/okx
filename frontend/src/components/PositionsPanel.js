import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

function PositionsPanel({ positions }) {
  if (!positions || positions.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Active Positions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography color="textSecondary">No active positions</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Active Positions ({positions.length})
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {positions.map((position) => (
          <Card key={position.position_id}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  {position.symbol} {position.side?.toUpperCase()}
                </Typography>
                <Chip
                  label={position.side}
                  color={position.side === 'buy' ? 'success' : 'error'}
                  size="small"
                  icon={position.side === 'buy' ? <TrendingUp /> : <TrendingDown />}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Entry:</Typography>
                  <Typography variant="body2">${position.entry_price?.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Current:</Typography>
                  <Typography variant="body2">${position.current_price?.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Quantity:</Typography>
                  <Typography variant="body2">{position.quantity?.toFixed(4)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="textSecondary">Stop Loss:</Typography>
                  <Typography variant="body2">${position.stop_loss?.toFixed(2)}</Typography>
                </Box>
                {position.unrealized_pnl !== undefined && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Unrealized P&L:</Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 'bold' }}
                      color={position.unrealized_pnl >= 0 ? 'success.main' : 'error.main'}
                    >
                      ${position.unrealized_pnl.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
}

export default PositionsPanel;


