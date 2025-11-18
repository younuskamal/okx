import React from 'react';
import { Box, Typography } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function BacktestChart({ results }) {
  if (!results || !results.equity_curve) {
    return <div>No chart data available</div>;
  }

  // Convert equity curve to chart format
  const chartData = results.equity_curve
    .filter((_, i) => i % 100 === 0) // Sample every 100th point for performance
    .map(point => ({
      time: new Date(point.timestamp).toLocaleDateString(),
      equity: point.equity,
      price: point.price
    }));

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Equity Curve
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="equity"
            stroke="#00d4ff"
            strokeWidth={2}
            name="Equity"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="price"
            stroke="#ff6b6b"
            strokeWidth={1}
            name="Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default BacktestChart;

