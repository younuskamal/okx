"""Parameter optimization utilities."""
from itertools import product
from typing import Dict, List, Tuple

from backend.backtest_engine import BacktestEngine


class ParameterOptimizer:
    """Simple exhaustive grid-search optimizer."""

    def __init__(self):
        self.results: List[Dict] = []

    def _expand_range(self, config: Dict) -> List[float]:
        if 'values' in config:
            return config['values']
        start = config.get('start', 0)
        end = config.get('end', start)
        step = config.get('step', 1)
        values = []
        val = start
        while val <= end + 1e-9:
            values.append(round(val, 6))
            val += step
        return values

    def _build_combinations(self, ranges: Dict[str, Dict]) -> Tuple[List[str], List[List[float]]]:
        keys = list(ranges.keys())
        values = [self._expand_range(ranges[key]) for key in keys]
        return keys, values

    async def optimize(self, candles: List[List[float]], base_settings: Dict,
                       strategy_ranges: Dict[str, Dict], risk_ranges: Dict[str, Dict],
                       top_n: int = 5, sort_key: str = 'roi') -> Dict:
        self.results = []
        strategy_keys, strategy_values = self._build_combinations(strategy_ranges)
        risk_keys, risk_values = self._build_combinations(risk_ranges)

        trading_config = base_settings.get('trading', {})
        position_size_percent = trading_config.get('position_size_percent', 10.0)

        for strat_values in product(*strategy_values):
            strategy_params = dict(zip(strategy_keys, strat_values))
            for risk_values_combo in product(*risk_values):
                risk_params = dict(zip(risk_keys, risk_values_combo))
                engine = BacktestEngine(
                    initial_balance=base_settings.get('backtest', {}).get('default_initial_balance', 10000.0),
                    strategy_params={**base_settings.get('strategy', {}), **strategy_params},
                    risk_params={**base_settings.get('risk', {}), **risk_params},
                    ws_manager=None,
                    notification_manager=None,
                    monte_carlo_iterations=50
                )
                report = await engine.run_on_candles(candles, trading_config, position_size_percent)
                self.results.append({
                    'strategy_params': strategy_params,
                    'risk_params': risk_params,
                    'metrics': report
                })

        sorted_results = sorted(
            self.results,
            key=lambda item: item['metrics'].get(sort_key, 0),
            reverse=True
        )

        return {
            'best': sorted_results[:top_n],
            'worst': sorted_results[-top_n:] if len(sorted_results) > top_n else sorted_results,
            'total_runs': len(self.results),
            'sort_key': sort_key
        }
