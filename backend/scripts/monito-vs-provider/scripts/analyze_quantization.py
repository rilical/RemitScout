#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Dict, List, Tuple


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Detect Monito quote quantization/plateaus')
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--monito', default='backend/scripts/monito-vs-provider/data/monito_snapshots.csv')
    parser.add_argument('--currency', default='CHF')
    parser.add_argument('--tolerance', type=float, default=1e-9)
    return parser.parse_args()


def to_float(value: str) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def load_rows(path: Path, run_id: str) -> List[dict]:
    with path.open('r', encoding='utf-8') as fh:
        return [row for row in csv.DictReader(fh) if row.get('run_id') == run_id]


def same_rate(a: float, b: float, tolerance: float) -> bool:
    return abs(a - b) <= tolerance


def detect_plateaus(points: List[Tuple[float, float]]) -> List[Tuple[float, float, float]]:
    # points are (amount, rate), sorted by amount
    if not points:
        return []

    plateaus: List[Tuple[float, float, float]] = []
    start_amount, current_rate = points[0]
    range_start = start_amount
    range_end = start_amount

    for amount, rate in points[1:]:
        if same_rate(rate, current_rate, 1e-12):
            range_end = amount
            continue
        plateaus.append((range_start, range_end, current_rate))
        range_start = amount
        range_end = amount
        current_rate = rate

    plateaus.append((range_start, range_end, current_rate))
    return plateaus


def main() -> None:
    args = parse_args()
    rows = load_rows(Path(args.monito), args.run_id)
    points_by_provider: Dict[str, List[Tuple[float, float]]] = {}

    for row in rows:
        if row.get('provider_slug', 'none') == 'none':
            continue
        amount_raw = row.get('amount')
        rate_raw = row.get('monito_rate')
        if not amount_raw or not rate_raw:
            continue
        amount = to_float(amount_raw)
        rate = to_float(rate_raw)
        if amount is None or rate is None:
            continue
        provider_slug = row['provider_slug']
        points_by_provider.setdefault(provider_slug, []).append((amount, rate))

    for provider, points in points_by_provider.items():
        points.sort(key=lambda item: item[0])
        plateaus = detect_plateaus(points)
        print(f'\n{provider}:')
        if not plateaus:
            print('  no numeric rates found')
            continue
        for start, end, value in plateaus:
            if start == end:
                print(f'  {start:g} -> {end:g}: {value:.8f}')
                continue
            print(f'  {start:g}..{end:g}: {value:.8f}')

        jump_points = [(
            plateaus[i][1],
            plateaus[i][2],
            plateaus[i + 1][0],
            plateaus[i + 1][2],
        ) for i in range(len(plateaus) - 1)]
        if not jump_points:
            continue

        print('  detected jumps:')
        for before_amount, before_rate, after_amount, after_rate in jump_points:
            print(
                f'    {before_amount:g} -> {after_amount:g}: '
                f'{before_rate:.8f} -> {after_rate:.8f}',
            )


if __name__ == '__main__':
    main()

