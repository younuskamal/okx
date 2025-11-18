import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

function TradingChart({ candles = [], trades = [], darkMode = true }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const maSeriesRef = useRef();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: darkMode ? '#0f172a' : '#ffffff' },
        textColor: darkMode ? '#d1d5db' : '#1e293b',
      },
      grid: {
        vertLines: { color: darkMode ? '#1f2937' : '#e2e8f0' },
        horzLines: { color: darkMode ? '#1f2937' : '#e2e8f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    });

    const maSeries = chart.addLineSeries({
      color: '#38bdf8',
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    maSeriesRef.current = maSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [darkMode]);

  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    const formatted = candles.map(candle => ({
      time: candle[0] / 1000,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
    }));
    seriesRef.current.setData(formatted);

    const maValues = formatted.map((point, index, arr) => {
      const window = arr.slice(Math.max(0, index - 19), index + 1);
      const avg = window.reduce((acc, item) => acc + item.close, 0) / window.length;
      return { time: point.time, value: avg };
    });
    maSeriesRef.current.setData(maValues);
  }, [candles]);

  useEffect(() => {
    if (!chartRef.current || !trades.length) return;
    const markers = trades.slice(0, 100).map(trade => ({
      time: trade.entry_time / 1000,
      position: trade.side === 'buy' ? 'belowBar' : 'aboveBar',
      color: trade.side === 'buy' ? '#16a34a' : '#dc2626',
      shape: trade.side === 'buy' ? 'arrowUp' : 'arrowDown',
      text: `${trade.side.toUpperCase()} ${trade.pnl?.toFixed(2) || ''}`,
    }));
    seriesRef.current.setMarkers(markers);
  }, [trades]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default TradingChart;


