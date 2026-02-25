#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


CSVRow = Dict[str, str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Compare monito quotes to provider direct snapshots')
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--monito', default='backend/scripts/monito-vs-provider/data/monito_snapshots.csv')
    parser.add_argument('--provider', default='backend/scripts/monito-vs-provider/data/provider_snapshots.csv')
    parser.add_argument('--window-seconds', type=float, default=90.0)
    parser.add_argument('--threshold-bps', type=float, default=20.0, help='Alert threshold in basis points')
    parser.add_argument('--top', type=int, default=20, help='Max outlier rows to print')
    return parser.parse_args()


def to_float(value: str) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_timestamp(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return datetime.fromisoformat(value)


def load_csv_rows(path: Path, run_id: str) -> List[CSVRow]:
    with path.open('r', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        return [row for row in reader if row.get('run_id') == run_id]


def row_index(rows: List[CSVRow], key_fields: Iterable[str]) -> Dict[Tuple, List[CSVRow]]:
    index: Dict[Tuple, List[CSVRow]] = defaultdict(list)
    for row in rows:
        key = tuple(row.get(field) for field in key_fields)
        index[key].append(row)
    for values in index.values():
        values.sort(key=lambda row: parse_timestamp(row['timestamp']))
    return index


def nearest_within(provider_rows: List[CSVRow], target_ts: datetime, window_ms: float) -> Optional[CSVRow]:
    if not provider_rows:
        return None
    best = None
    best_delta = None
    for row in provider_rows:
        provider_ts = parse_timestamp(row['timestamp'])
        delta = abs((provider_ts - target_ts).total_seconds()) * 1000
        if delta > window_ms:
            continue
        if best is None or delta < best_delta:
            best_delta = delta
            best = row
    return best


def safe_pct(base: float, delta: float) -> float:
    if base == 0:
        return 0.0
    return (delta / base) * 10_000


def summarize(values: List[float]) -> Dict[str, float]:
    if not values:
        return {'count': 0, 'mean': 0.0, 'median': 0.0, 'max': 0.0, 'p95': 0.0}
    p95_index = max(0, int(len(values) * 0.95) - 1)
    return {
        'count': len(values),
        'mean': statistics.fmean(values),
        'median': statistics.median(values),
        'max': max(values),
        'p95': sorted(values)[min(p95_index, len(values) - 1)],
    }


def main() -> None:
    args = parse_args()
    monito_rows = load_csv_rows(Path(args.monito), args.run_id)
    provider_rows = load_csv_rows(Path(args.provider), args.run_id)

    monito_quote_rows = [row for row in monito_rows if row.get('provider_slug') and row['provider_slug'] != 'none']
    provider_ok = [row for row in provider_rows if row.get('provider_slug')]
    provider_index = row_index(provider_ok, ('provider_slug', 'amount'))

    diffs_by_key: Dict[Tuple[str, str], List[float]] = defaultdict(list)
    pair_samples: List[Tuple[str, str, float, float, float]] = []
    outliers: List[Tuple[str, str, str, float, float, float, float]] = []
    match_window_ms = args.window_seconds * 1000

    for row in monito_quote_rows:
        provider_slug = row.get('provider_slug', '')
        amount = row.get('amount')
        if not amount:
            continue
        key = (provider_slug, amount)
        candidate = nearest_within(provider_index.get(key, []), parse_timestamp(row['timestamp']), match_window_ms)
        if not candidate:
            continue
        monito_rate = to_float(row.get('monito_rate', ''))
        provider_rate = to_float(candidate.get('provider_effective_rate', ''))
        if monito_rate is None or provider_rate is None:
            continue
        rate_diff = provider_rate - monito_rate
        bps = safe_pct(monito_rate, rate_diff)
        diffs_by_key[key].append(bps)
        pair_samples.append((provider_slug, amount, monito_rate, provider_rate, bps))

        if abs(bps) > args.threshold_bps:
            outlier_ts = row.get('timestamp', '')
            outliers.append((provider_slug, amount, outlier_ts, monito_rate, provider_rate, rate_diff, bps))

    provider_to_diffs: Dict[str, List[float]] = defaultdict(list)
    for (provider, _amount), values in diffs_by_key.items():
        provider_to_diffs[provider].extend(values)

    print('Latency alignment run summary')
    print(f'run_id={args.run_id} window_seconds={args.window_seconds}')
    print(f'rows(monito={len(monito_quote_rows)}) rows(provider={len(provider_ok)}) matches={len(pair_samples)}\n')

    print('Provider summary (basis points provider - monito):')
    for provider, values in sorted(provider_to_diffs.items(), key=lambda item: item[0]):
        stats = summarize(values)
        print(
            f'- {provider}: n={int(stats["count"])} '
            f'mean={stats["mean"]:.4f} bps median={stats["median"]:.4f} bps '
            f'max={stats["max"]:.4f} bps p95={stats["p95"]:.4f} bps',
        )

    print(f'\nOutliers (>{args.threshold_bps} bps):')
    outliers.sort(key=lambda item: abs(item[6]), reverse=True)
    for provider, amount, ts, monito_rate, provider_rate, rate_diff, bps in outliers[: args.top]:
        print(
            f'- {provider} amount={amount} ts={ts} '
            f'monito={monito_rate:.6f} provider={provider_rate:.6f} '
            f'delta={rate_diff:.6f} ({bps:.2f} bps)',
        )

    if not outliers:
        print('No outliers above threshold.')


if __name__ == '__main__':
    main()

