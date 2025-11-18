import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

function MarketPulse({ data }) {
  if (!data) {
    return null;
  }

  const { orderbook, trades } = data;

  return (
    <Paper sx={{ p: 2, bgcolor: 'background.paper', height: 360, overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Market Pulse
        </Typography>
        <Chip label={data.symbol} size="small" color="primary" />
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Orderbook
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="success.main">Bids</Typography>
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {(orderbook?.bids || []).map((bid, index) => (
                  <ListItem key={`bid-${index}`} sx={{ py: 0 }}>
                    <ListItemText
                      primary={`${bid[0].toFixed(4)} USDT`}
                      secondary={`Size: ${bid[1].toFixed(4)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="error.main">Asks</Typography>
              <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                {(orderbook?.asks || []).map((ask, index) => (
                  <ListItem key={`ask-${index}`} sx={{ py: 0 }}>
                    <ListItemText
                      primary={`${ask[0].toFixed(4)} USDT`}
                      secondary={`Size: ${ask[1].toFixed(4)}`}
                      sx={{ textAlign: 'right' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Latest Trades
          </Typography>
          <List dense sx={{ maxHeight: 220, overflow: 'auto' }}>
            {(trades || []).slice(0, 25).map((trade, index) => (
              <ListItem key={`trade-${index}`} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={`${trade.side?.toUpperCase() || trade.info?.side || 'BUY'} @ ${trade.price}`}
                  secondary={new Date(trade.timestamp || trade.time).toLocaleTimeString()}
                />
                <Typography variant="body2" color={trade.side === 'sell' ? 'error.main' : 'success.main'}>
                  {trade.amount || trade.qty}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default MarketPulse;
