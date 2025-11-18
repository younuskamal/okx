# OKX Trading System - Complete Production Platform

A full-featured, production-grade trading system for OKX exchange with engulfing candlestick strategy, comprehensive backtesting, and a modern web dashboard.

## 🚀 Quick Start

### Option 1: Using Startup Scripts (Easiest)

**Windows:**
```bash
# Launch everything with browser auto-open
start.bat

# Start backend only
scripts\start_backend.bat

# Start frontend only (requires Node.js)
scripts\start_frontend.bat

# Start both (opens separate windows)
scripts\start_all.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/*.sh

# Start backend
./scripts/start_backend.sh

# Start frontend
./scripts/start_frontend.sh
```

### Option 2: Manual Start

**1. Start Backend:**
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**2. Start Frontend (in new terminal):**
```bash
cd frontend
npm install
npm start
```

### Option 3: Docker (Recommended for Production)

```bash
# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your API keys

# Start everything
docker-compose up -d

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## 📋 Requirements

- **Python 3.8+** (for backend)
- **Node.js 18+** (for frontend)
- **Docker & Docker Compose** (optional, for containerized deployment)

## 🏗️ Project Structure

```
okx/
├── backend/                 # FastAPI Backend
│   ├── main.py             # Application entry point
│   ├── api.py              # REST API routes
│   ├── trading_engine.py   # Live trading logic
│   ├── backtest_engine.py  # Backtesting engine
│   ├── websocket_manager.py # WebSocket handling
│   ├── database.py         # SQLite database
│   ├── config_manager.py   # Configuration management
│   └── requirements.txt    # Python dependencies
│
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── Settings.js
│   │   │   ├── Backtest.js
│   │   │   └── ...
│   │   ├── hooks/          # Custom React hooks
│   │   ├── api.js          # API client
│   │   └── App.js          # Main app
│   └── package.json        # Node dependencies
│
├── shared/                  # Shared code
│   └── strategy.py        # Engulfing strategy logic
│
├── scripts/                 # Startup scripts
│   ├── start_backend.bat   # Windows backend script
│   ├── start_frontend.bat  # Windows frontend script
│   └── start_all.bat       # Start both
│
├── docker/                  # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
│
└── docker-compose.yml      # Docker Compose config
```

## ✨ Features

### Trading Engine
- ✅ Real-time OKX API integration
- ✅ Engulfing pattern detection (bullish & bearish)
- ✅ Position management (max 1 position)
- ✅ Structural stop loss
- ✅ Take profit logic (close at first profit)
- ✅ Trading window enforcement (15:00-19:00 UTC+3)
- ✅ Automatic reconnection and error handling
- ✅ Live account overview API (balance, wallets, mark price, funding, open orders)
- ✅ Live market data streamer pushing candles, order book, and trades to the dashboard

### Backtesting Engine
- ✅ Historical data fetching from OKX
- ✅ Full strategy simulation
- ✅ Comprehensive performance metrics:
  - Total trades, win rate, ROI
  - Max drawdown, profit factor
  - Equity curve visualization
- ✅ Forward validation split with comparison analytics
- ✅ Trade Explorer (best/worst days, long vs short, daily/weekly/monthly PnL)
- ✅ Built-in Monte Carlo simulator (VaR, drawdown distribution, risk of ruin)
- ✅ Parameter optimizer with grid-search ranges and sortable results
- ✅ Configurable parameters
- ✅ Real-time progress updates

### Web Dashboard
- ✅ Modern, responsive React UI with Material-UI
- ✅ Real-time WebSocket updates
- ✅ Trading control (start/stop)
- ✅ **ALL settings editable from UI:**
  - Strategy parameters
  - Trading settings
  - Risk management
  - API keys
  - Backtest parameters
- ✅ Backtest interface with results
- ✅ Trade history and analytics
- ✅ Live logs and metrics
- ✅ Charts and visualizations
- ✅ Notification center with browser alerts and channel health states
- ✅ Dynamic drag-and-resize dashboard grid with persistent layouts
- ✅ Dark/Light theme toggle
- ✅ TradingView-style chart with MA overlay and trade markers powered by live data
- ✅ Market Pulse widget (orderbook + tape)
- ✅ Backtest Pro console with tabs for Forward Test, Explorer, Monte Carlo, and Optimizer

### Notification System
- ✅ Multi-channel delivery: Desktop/browser, Telegram, Email, and custom webhooks (Discord/Slack)
- ✅ Granular event toggles (trade events, SL/TP, errors, margin issues, backtests, system events)
- ✅ Secure credential management with instant backend sync
- ✅ Built-in Notification Center card on the dashboard for quick insight
- ✅ Optimizer/backtest completion alerts with metadata payloads

## 📡 Live Market Data Controls

- The dashboard streams live candles, order book levels, and trades from OKX via the new `MarketDataService`.
- Use the **Symbol** and **Timeframe** selectors at the top of the dashboard to resubscribe instantly.
- REST endpoints:
  - `GET /api/data/market/snapshot` – latest cached snapshot for mobile or external tools.
  - `POST /api/data/market/subscribe?symbol=ETH/USDT&timeframe=5m` – change feed programmatically.

## 🧠 Backtest Pro & Optimizer

- **Forward Test Tab**: compare training vs validation ROI/win-rate deltas.
- **Trade Explorer Tab**: inspect best/worst days, long vs short stats, and Monte Carlo risk simulations.
- **Optimizer Tab**: define parameter grids for strategy + risk settings and run exhaustive evaluations directly from the UI.
- Backend endpoint: `POST /api/backtest/optimizer` returns the best/worst combinations along with Sharpe/ROI metrics.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
OKX_API_KEY=your_api_key
OKX_SECRET_KEY=your_secret_key
OKX_PASSPHRASE=your_passphrase
OKX_SANDBOX=true
```

### Settings (Editable from Web UI)

All settings can be configured from the **Settings** tab in the dashboard:

**Strategy Parameters:**
- `engulf_strength`: Range multiplier (default: 1.3)
- `close_near_percent`: Close proximity (default: 0.1)
- `min_range_pips_current`: Min range for current candle (default: 15)
- `min_range_pips_previous`: Min range for previous candle (default: 10)
- `timeframe`: Candle timeframe (default: "2m")
- `symbol`: Trading pair (default: "ETH/USDT")

**Trading Settings:**
- `trading_window_start`: Start hour (default: 15)
- `trading_window_end`: End hour (default: 19)
- `timezone`: Timezone (default: "Europe/Moscow")
- `max_positions`: Max concurrent positions (default: 1)
- `position_size_percent`: Position size % (default: 10)

**Risk Management:**
- `structural_sl_buffer_pips`: SL buffer (default: 5)
- `min_profit_pips`: Min profit in pips (default: 0)
- `min_profit_money`: Min profit in USD (default: 0)
- `close_at_first_profit`: Close on first profit (default: true)

**Notifications:**
- `enabled`: Master switch for all outbound alerts
- `channels.desktop.enabled`: Toggle in-browser notifications
- `channels.telegram`: Bot token & chat ID for Telegram updates
- `channels.email`: SMTP configuration (host, port, credentials, from/to, TLS)
- `channels.webhook`: HTTPS endpoint for Discord/Slack/etc.
- `events.*`: Fine-grained controls for trade lifecycle, risk events, API disconnects, system events, and backtest completion

## 📊 API Endpoints

### Trading
- `GET /api/trading/status` - Get trading status
- `POST /api/trading/start` - Start trading
- `POST /api/trading/stop` - Stop trading

### Settings
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings

### Backtest
- `POST /api/backtest/run` - Run backtest
- `GET /api/backtest/status` - Get backtest status
- `GET /api/backtest/results` - Get backtest results

### Data
- `GET /api/trades` - Get trade history
- `GET /api/positions` - Get active positions
- `GET /api/metrics` - Get system metrics

### WebSocket
- `WS /ws` - Real-time updates

**Full API Documentation:** http://localhost:8000/docs

## 🎯 Usage Guide

### 1. Configure Settings

1. Open the dashboard: http://localhost:3000
2. Navigate to **Settings** tab
3. Configure all parameters:
   - **Strategy**: Engulf strength, range requirements, timeframe
   - **Trading**: Window hours, position size, timezone
   - **Risk**: Stop loss buffer, profit targets
   - **API Keys**: Your OKX credentials
4. Click **Save All Settings**

### 2. Run Backtest

1. Navigate to **Backtest** tab
2. Set date range (at least 1 year recommended)
3. Adjust strategy and risk parameters
4. Click **Run Backtest**
5. View results with charts and metrics

### 3. Start Live Trading

⚠️ **WARNING**: Only after thorough testing!

1. Ensure API keys are configured
2. Set `OKX_SANDBOX=true` for testing
3. Navigate to **Dashboard** tab
4. Click **Start Trading**
5. Monitor positions, logs, and metrics

### 4. Monitor Performance

- **Dashboard**: Real-time metrics, positions, logs
- **Trades**: Complete trade history
- **Settings**: Adjust parameters on the fly

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (needs 3.8+)
- Install dependencies: `pip install -r backend/requirements.txt`
- Check port 8000 is available
- Check logs for error messages

### Frontend won't connect
- Verify backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Check browser console for errors
- Verify WebSocket connection in browser DevTools

### No trades generated
- Verify trading window is active (15:00-19:00 UTC+3)
- Check engulfing pattern criteria (may be too strict)
- Review logs for pattern detection messages
- Adjust strategy parameters if needed

### Backtest fails
- Check date range is valid
- Verify OKX API access (no API keys needed for public data)
- Check internet connection
- Review backend logs for errors

### Dependencies won't install
- Update pip: `python -m pip install --upgrade pip`
- Use virtual environment: `python -m venv venv`
- Try installing packages individually

## 🔒 Security

- API keys stored securely in database
- Environment variables for sensitive data
- Sandbox mode for testing
- Input validation on all endpoints
- CORS configuration for frontend

## 📝 Development

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

## 🚀 Deployment

See `docs/DEPLOYMENT.md` for production deployment instructions.

## ⚠️ Disclaimer

**Trading cryptocurrencies involves substantial risk of loss.**
- Always test in sandbox mode first
- Start with small position sizes
- Monitor the system closely
- Never risk more than you can afford to lose
- This software is provided "as-is" without warranty

## 📚 Documentation

- **README.md** (this file) - Main documentation
- **QUICKSTART.md** - Quick setup guide
- **docs/ARCHITECTURE.md** - System architecture
- **docs/DEPLOYMENT.md** - Production deployment

## 🤝 Support

For issues or questions:
1. Check the logs in the dashboard
2. Review configuration settings
3. Test in sandbox mode
4. Review OKX API documentation

## 📄 License

This project is provided as-is for educational purposes.

---

**Built with ❤️ for professional trading**

**Version:** 1.0.0  
**Status:** Production Ready ✅
