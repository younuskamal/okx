import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [backtestUpdate, setBacktestUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      // Use localhost for development, or current host for production
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = isDevelopment ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
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
            setLogs(prev => [...prev.slice(-99), message.data]);
            break;
          case 'metrics_update':
            setMetrics(message.data);
            break;
          case 'position_update':
            setPositions(prev => {
              const existing = prev.find(p => p.position_id === message.data.position_id);
              if (existing) {
                return prev.map(p => 
                  p.position_id === message.data.position_id ? message.data : p
                );
              }
              return [...prev, message.data];
            });
            break;
          case 'trade_update':
            setTrades(prev => [message.data, ...prev]);
            break;
          case 'backtest_update':
            setBacktestUpdate(message.data);
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
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Reconnect after 3 seconds
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
    backtestUpdate
  };
}

