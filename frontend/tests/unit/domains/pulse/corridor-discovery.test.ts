import { describe, expect, it } from 'vitest';
import type { CorridorOption } from '~/types/pulse';
import {
  buildCorridorSearchText,
  computeCorridorDaysAvailable,
  matchesCorridorSearch,
  sortCorridorsByCoverage,
} from '~/domains/pulse/application';

const corridor = (overrides: Partial<CorridorOption> = {}): CorridorOption => ({
  value: 'usd-php',
  label: 'USD → PHP',
  fromFlag: '🇺🇸',
  toFlag: '🇵🇭',
  fromCode: 'USD',
  toCode: 'PHP',
  corridorId: 'US-PH-USD-PHP',
  slug: 'usd-php',
  sourceCountry: 'US',
  destCountry: 'PH',
  sourceCurrency: 'USD',
  destCurrency: 'PHP',
  dataPoints: 42,
  lastUpdated: '2026-03-07T10:00:00.000Z',
  minDate: '2026-02-01',
  maxDate: '2026-03-07',
  isUsdOrigin: true,
  ...overrides,
});

describe('corridor-discovery helpers', () => {
  it('computes days available from min and max date inclusively', () => {
    expect(
      computeCorridorDaysAvailable(
        corridor({
          minDate: '2026-03-01',
          maxDate: '2026-03-07',
          daysAvailable: undefined,
        })
      )
    ).toBe(7);
  });

  it('matches search by currency, country name, and corridor id', () => {
    const item = corridor();

    expect(matchesCorridorSearch(item, 'philippines php')).toBe(true);
    expect(matchesCorridorSearch(item, 'US-PH-USD-PHP')).toBe(true);
    expect(buildCorridorSearchText(item)).toContain('philippines');
  });

  it('sorts corridors by usd bias, coverage, and freshness', () => {
    const sorted = sortCorridorsByCoverage([
      corridor({
        corridorId: 'GB-NG-GBP-NGN',
        value: 'gbp-ngn',
        slug: 'gbp-ngn',
        label: 'GBP → NGN',
        fromFlag: '🇬🇧',
        toFlag: '🇳🇬',
        fromCode: 'GBP',
        toCode: 'NGN',
        sourceCountry: 'GB',
        destCountry: 'NG',
        sourceCurrency: 'GBP',
        destCurrency: 'NGN',
        dataPoints: 90,
        isUsdOrigin: false,
      }),
      corridor({
        corridorId: 'US-MX-USD-MXN',
        value: 'usd-mxn',
        slug: 'usd-mxn',
        label: 'USD → MXN',
        fromFlag: '🇺🇸',
        toFlag: '🇲🇽',
        fromCode: 'USD',
        toCode: 'MXN',
        sourceCountry: 'US',
        destCountry: 'MX',
        sourceCurrency: 'USD',
        destCurrency: 'MXN',
        dataPoints: 75,
        lastUpdated: '2026-03-07T12:00:00.000Z',
      }),
      corridor(),
    ]);

    expect(sorted.map(item => item.corridorId)).toEqual([
      'US-MX-USD-MXN',
      'US-PH-USD-PHP',
      'GB-NG-GBP-NGN',
    ]);
  });
});
