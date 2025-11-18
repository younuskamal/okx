import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function PriceChart() {
  // Placeholder data - in real implementation, fetch from API
  const data = [
    { time: '00:00', price: 2500 },
    { time: '04:00', price: 2520 },
    { time: '08:00', price: 2510 },
    { time: '12:00', price: 2530 },
    { time: '16:00', price: 2540 },
    { time: '20:00', price: 2535 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="price" stroke="#00d4ff" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default PriceChart;


