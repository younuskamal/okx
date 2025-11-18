import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSettings = () => api.get('/settings');
export const getCategorySettings = (category) => api.get(`/settings/${category}`);
export const updateCategorySettings = (category, settings) => 
  api.post('/settings/category', { category, settings });
export const updateSingleSetting = (category, key, value) =>
  api.post('/settings/single', { category, key, value });
export const resetSettings = () => api.post('/settings/reset');
export const getDefaultSettings = () => api.get('/settings/defaults');
export const getTrades = (limit = 100, offset = 0) => 
  api.get(`/trades?limit=${limit}&offset=${offset}`);
export const getPositions = () => api.get('/positions');
export const startTrading = () => api.post('/trading/start');
export const stopTrading = () => api.post('/trading/stop');
export const getTradingStatus = () => api.get('/trading/status');
export const runBacktest = (params) => api.post('/backtest/run', params);
export const getBacktestStatus = () => api.get('/backtest/status');
export const getBacktestResults = () => api.get('/backtest/results');
export const getMetrics = () => api.get('/metrics');
export const getDatasets = () => api.get('/data/datasets');
export const downloadData = (symbol, timeframe, days) => 
  api.post('/data/download', null, { params: { symbol, timeframe, days } });
export const getOhlcvData = (symbol, timeframe, startDate, endDate) =>
  api.get('/data/ohlcv', { params: { symbol, timeframe, start_date: startDate, end_date: endDate } });

export default api;

