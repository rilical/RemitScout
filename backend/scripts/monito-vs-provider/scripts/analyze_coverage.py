#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

CSVRow = Dict[str, str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Coverage report for Monito/provider captures')
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--monito', default='backend/scripts/monito-vs-provider/data/monito_snapshots.csv')
    parser.add_argument('--provider', default='backend/scripts/monito-vs-provider/data/provider_snapshots.csv')
    parser.add_argument('--manifest', default=None, help='Run manifest path to enrich API/scrape method evidence')
    parser.add_argument('--top', type=int, default=25, help='Top providers with largest gaps to print')
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


def load_rows(path: Path, run_id: str) -> List[CSVRow]:
    with path.open('r', encoding='utf-8') as fh:
        return [row for row in csv.DictReader(fh) if row.get('run_id') == run_id]


def bucket(amount: float) -> float:
    """Normalize amount key to avoid tiny float drift."""
    return round(amount, 6)


def method_from_manifest(path: Path, run_id: str) -> Dict[str, str]:
    if not path.exists():
        return {}

    try:
        payload = json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return {}

    if payload.get('runId') != run_id and payload.get('run_id') != run_id:
        return {}

    out: Dict[str, str] = {}
    for row in payload.get('providerMethodReport', []) or []:
        slug = row.get('slug') if isinstance(row, dict) else None
        method = row.get('methodAssigned') if isinstance(row, dict) else None
        if slug:
            out[str(slug)] = str(method) if method else 'unknown'
    return out


def main() -> None:
    args = parse_args()
    monito_rows = load_rows(Path(args.monito), args.run_id)
    provider_rows = load_rows(Path(args.provider), args.run_id)

    monito_counts: Dict[tuple[str, float], int] = defaultdict(int)
    provider_ok: Dict[tuple[str, float], int] = defaultdict(int)
    provider_error: Dict[tuple[str, float], int] = defaultdict(int)
    provider_seen: Dict[tuple[str, float], List[str]] = defaultdict(list)

    for row in monito_rows:
        slug = (row.get('provider_slug') or '').strip().lower()
        if not slug or slug == 'none':
            continue

        amount = to_float(row.get('amount', ''))
        if amount is None:
            continue
        amount = bucket(amount)
        key = (slug, amount)
        monito_counts[key] += 1
        ts = row.get('timestamp')
        if ts:
            provider_seen[key].append(ts)

    for row in provider_rows:
        slug = (row.get('provider_slug') or '').strip().lower()
        if not slug:
            continue
        amount = to_float(row.get('amount', ''))
        if amount is None:
            continue
        amount = bucket(amount)
        key = (slug, amount)

        status = (row.get('status') or '').strip().lower()

        if status == 'ok':
            provider_ok[key] += 1
        else:
            provider_error[key] += 1

        if not provider_seen.get(key):
            provider_seen[key].append(row.get('timestamp') or '')

    all_keys = set(monito_counts.keys()) | set(provider_ok.keys()) | set(provider_error.keys())

    if not all_keys:
        print('No overlap data for requested run_id.')
        return

    manifest_path = Path(args.manifest) if args.manifest else Path(f'backend/scripts/monito-vs-provider/data/{args.run_id}-manifest.json')
    method_report = method_from_manifest(manifest_path, args.run_id)

    coverage_rows: List[tuple[str, float, str, int, int, int, str, str]] = []
    counts_by_status: Dict[str, int] = defaultdict(int)

    for key in sorted(all_keys, key=lambda item: (item[0], item[1])):
        slug, amount = key
        m_count = monito_counts.get(key, 0)
        p_ok = provider_ok.get(key, 0)
        p_err = provider_error.get(key, 0)

        if m_count > 0 and p_ok > 0:
            status = 'both'
        elif m_count > 0:
            status = 'monitoOnly'
        elif p_ok > 0:
            status = 'providerOnly'
        elif p_err > 0:
            status = 'providerOnly'
        else:
            status = 'none'

        counts_by_status[status] += 1

        method = method_report.get(slug, 'unknown')
        last_ts: str = ''
        for ts in provider_seen.get(key, []):
            if not ts:
                continue
            try:
                parsed = parse_timestamp(ts)
            except Exception:
                continue
            if not last_ts:
                last_ts = ts
                continue
            if parse_timestamp(last_ts) < parsed:
                last_ts = ts

        coverage_rows.append((slug, amount, status, m_count, p_ok, p_err, method, last_ts))

    by_provider: Dict[str, Dict[str, int]] = defaultdict(lambda: {'both': 0, 'monitoOnly': 0, 'providerOnly': 0, 'none': 0, 'errors': 0})
    for slug, amount, status, m_count, p_ok, p_err, method, _ in coverage_rows:
        by_provider[slug][status] = by_provider[slug].get(status, 0) + 1
        by_provider[slug]['errors'] += p_err

    print('Coverage run summary')
    print(f'run_id={args.run_id}')
    print('Total pair-cases: ', len(all_keys))
    for label in ('both', 'monitoOnly', 'providerOnly', 'none'):
        print(f'{label}: {counts_by_status.get(label, 0)}')

    print(f'\nProvider-level coverage (monito amount-pairs):')
    for slug in sorted(by_provider.keys()):
        agg = by_provider[slug]
        both = agg['both']
        mono = agg['monitoOnly']
        provider_only = agg['providerOnly']
        none = agg['none']
        errors = agg['errors']
        print(f'- {slug}: both={both} monitoOnly={mono} providerOnly={provider_only} none={none} provider_errors={errors}')

    print('\nLargest mismatches by provider+amount:')
    missing = [item for item in coverage_rows if item[2] != 'both']
    if not missing:
        print('No coverage gaps detected.')
        return

    missing_sorted = sorted(
        missing,
        key=lambda item: (
            0 if item[2] == 'monitoOnly' else 1 if item[2] == 'providerOnly' else 2,
            -item[4],
            item[0],
            item[1],
        ),
    )

    for slug, amount, status, m_count, p_ok, p_err, method, last_ts in missing_sorted[: args.top]:
        note = 'ok'
        if status == 'monitoOnly' and p_err > 0:
            note = f'provider_errors={p_err}'
        if status == 'providerOnly':
            if p_err > 0:
                note = f'provider_errors={p_err}'
            elif m_count == 0:
                note = 'monito had no quote'
        print(
            f'- {slug} {amount:.6g}: {status} (monito={m_count}, provider_ok={p_ok}, provider_errors={p_err}, '
            f'method={method}, last_ts={last_ts or "n/a"}, note={note})',
        )


if __name__ == '__main__':
    main()
