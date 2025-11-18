# System Architecture

## Overview

The OKX Trading System is built with a modern microservices architecture:

```
┌─────────────┐
│   React     │  Frontend (Port 3000)
│  Frontend   │
└──────┬──────┘
       │ HTTP/WebSocket
       │
┌──────▼──────┐
│   FastAPI   │  Backend (Port 8000)
│   Backend   │
└──────┬──────┘
       │
       ├─── Trading Engine
       ├─── Backtest Engine
       ├─── WebSocket Manager
       └─── Database (SQLite)
```

## Components

### Backend (FastAPI)
- **main.py**: Application entry point
- **api.py**: REST API endpoints
- **trading_engine.py**: Live trading logic
- **backtest_engine.py**: Historical simulation
- **websocket_manager.py**: Real-time updates
- **database.py**: Data persistence
- **config_manager.py**: Configuration management

### Frontend (React)
- **App.js**: Main application
- **Dashboard**: Trading control and metrics
- **Settings**: Configuration editor
- **Backtest**: Backtesting interface
- **Trades**: Trade history
- **WebSocket Hook**: Real-time data

### Shared
- **strategy.py**: Engulfing pattern detection

## Data Flow

1. **Settings Update**: UI → API → Database → Trading Engine
2. **Trading Signal**: OKX API → Trading Engine → Position → Database → WebSocket → UI
3. **Backtest**: UI → API → Backtest Engine → Results → UI
4. **Real-time Updates**: Trading Engine → WebSocket → UI

## Database Schema

- **settings**: System configuration
- **trades**: Completed trades
- **positions**: Active positions
- **backtest_results**: Backtest results

## Security

- API keys encrypted in database
- Environment variables for secrets
- Input validation on all endpoints
- CORS configuration
- Rate limiting (via ccxt)


