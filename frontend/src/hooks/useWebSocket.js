import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const WebSocketContext = createContext(null);

const defaultMarketState = {
  candles: [],
  orderbook: null,
  trades: [],
};

function useProvideWebSocket() {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [backtestUpdate, setBacktestUpdate] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [marketData, setMarketData] = useState(defaultMarketState);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const isDevelopment =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = isDevelopment ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'log':
            setLogs((prev) => [...prev.slice(-99), message.data]);
            break;
          case 'metrics_update':
            setMetrics(message.data);
            break;
          case 'position_update':
            setPositions((prev) => {
              const existing = prev.find((p) => p.position_id === message.data.position_id);
              if (existing) {
                return prev.map((p) => (p.position_id === message.data.position_id ? message.data : p));
              }
              return [...prev, message.data];
            });
            break;
          case 'trade_update':
            setTrades((prev) => [message.data, ...prev]);
            break;
          case 'backtest_update':
            setBacktestUpdate(message.data);
            break;
          case 'notification':
            setNotifications((prev) => [message.data, ...prev].slice(0, 50));
            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              try {
                new Notification(message.data.title || 'System notification', {
                  body: message.data.message,
                  tag: message.data.timestamp,
                  data: message.data,
                });
              } catch (err) {
                console.warn('Browser notification failed', err);
              }
            }
            break;
          case 'market_candles':
            setMarketData((prev) => ({ ...prev, candles: message.data.candles || [] }));
            break;
          case 'market_orderbook':
            setMarketData((prev) => ({ ...prev, orderbook: message.data }));
            break;
          case 'market_trades':
            setMarketData((prev) => ({ ...prev, trades: message.data.trades || [] }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connected,
    logs,
    metrics,
    positions,
    trades,
    backtestUpdate,
    notifications,
    marketData,
  };
}

export function WebSocketProvider({ children }) {
  const value = useProvideWebSocket();
  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
