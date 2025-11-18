import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Trading state
  tradingActive: false,
  positions: [],
  trades: [],
  metrics: null,
  
  // Settings
  settings: null,
  
  // Backtest
  backtestRunning: false,
  backtestResults: null,
  
  // Data
  datasets: [],
  dataDownloadProgress: null,
  
  // UI state
  theme: 'dark',
  sidebarOpen: true,
  
  // Actions
  setTradingActive: (active) => set({ tradingActive: active }),
  setPositions: (positions) => set({ positions }),
  setTrades: (trades) => set({ trades }),
  setMetrics: (metrics) => set({ metrics }),
  setSettings: (settings) => set({ settings }),
  setBacktestRunning: (running) => set({ backtestRunning: running }),
  setBacktestResults: (results) => set({ backtestResults: results }),
  setDatasets: (datasets) => set({ datasets }),
  setDataDownloadProgress: (progress) => set({ dataDownloadProgress: progress }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));


