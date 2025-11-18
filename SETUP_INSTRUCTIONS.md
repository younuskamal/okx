# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   
   If that doesn't work, try:
   ```bash
   python -m pip install -r requirements.txt
   ```

2. **Verify Installation**
   ```bash
   python test_setup.py
   ```
   This should show all dependencies as installed (✓).

3. **Configure API Keys** (for live trading)
   - Create a `.env` file
   - Add your OKX API credentials
   - Set `OKX_SANDBOX=true` for testing

4. **Run Backtest**
   ```bash
   python backtest.py
   ```
   This will:
   - Fetch 1 year of historical ETH/USDT data
   - Run the engulfing strategy simulation
   - Generate performance metrics
   - Create charts and save results

5. **Run Live Bot** (optional)
   ```bash
   python trading_bot.py
   ```
   ⚠️ Only run this after thorough testing in sandbox mode!

## Troubleshooting Installation

If `pip install` doesn't work:

1. **Check Python version:**
   ```bash
   python --version
   ```
   Should be 3.8 or higher.

2. **Try using python -m pip:**
   ```bash
   python -m pip install ccxt pandas numpy matplotlib python-dotenv pytz
   ```

3. **Check if packages are in a virtual environment:**
   - If using venv, activate it first: `venv\Scripts\activate` (Windows)
   - Then install packages

4. **Install with user flag:**
   ```bash
   pip install --user -r requirements.txt
   ```

## Expected Backtest Output

When you run `python backtest.py`, you should see:

1. **Console output:**
   - Progress messages while fetching data
   - Backtest execution progress
   - Final performance report with metrics

2. **Generated files:**
   - `backtest_results.png` - Charts showing equity curve, price with entry/exit points, and drawdown
   - `backtest_trades.csv` - Detailed log of all trades

3. **Report includes:**
   - Total trades
   - Win rate
   - Total profit/loss
   - ROI
   - Max drawdown
   - Profit factor

## Notes

- The backtest fetches data from OKX public API (no API keys needed)
- Historical data fetching may take a few minutes
- The strategy only trades during 15:00-19:00 UTC+3 (configurable)
- All parameters can be adjusted in `config.py`


