import { describe, expect, it } from 'vitest'

import {
  buildCorridorStressInsights,
  buildDataQualityInsights,
  buildIncidentTimeline,
  buildSelfHealingInsights,
  getDataQualityModuleStatus,
  summarizeIncidentTimeline,
} from '../../../utils/adminInsights'
import type { AgentActionEntry, FailureBundleSummary } from '../../../types/agents'
import type { MttdMttrEntry, TotalCollectionErrorRow } from '../../../types/data-quality'
import type { CorridorStressEntry, StressSummary } from '../../../types/stress'

describe('adminInsights data quality helpers', () => {
  it('classifies module pressure and telemetry state', () => {
    const rows: TotalCollectionErrorRow[] = [
      {
        module_id: 'wise:http',
        display_name: 'wise:http',
        total_observations: 120,
        failure_count: 2,
        corridor_count: 16,
        last_observed_at: '2026-03-07T01:00:00.000Z',
        parse_error_rate: 2 / 120,
        consecutive_failures: 0,
      },
      {
        module_id: 'ria:http',
        display_name: 'ria:http',
        total_observations: 24,
        failure_count: 4,
        corridor_count: 8,
        last_observed_at: '2026-03-07T01:05:00.000Z',
        parse_error_rate: 4 / 24,
        consecutive_failures: 4,
      },
      {
        module_id: 'xe:http',
        display_name: 'xe:http',
        total_observations: 0,
        failure_count: 0,
        corridor_count: 0,
        last_observed_at: null,
        parse_error_rate: 0,
        consecutive_failures: 0,
      },
    ]
    const mttdRows: MttdMttrEntry[] = [
      {
        module_id: 'ria:http',
        display_name: 'ria:http',
        mttd_minutes: 35,
        mttr_minutes: 95,
        period: '7d',
      },
    ]

    expect(getDataQualityModuleStatus(rows[0]!)).toBe('healthy')
    expect(getDataQualityModuleStatus(rows[1]!)).toBe('critical')
    expect(getDataQualityModuleStatus(rows[2]!)).toBe('warming')

    const insights = buildDataQualityInsights(rows, mttdRows)
    expect(insights.telemetryState).toBe('partial')
    expect(insights.totalModules).toBe(3)
    expect(insights.activeModules).toBe(2)
    expect(insights.totalObservations).toBe(144)
    expect(insights.totalFailures).toBe(6)
    expect(insights.criticalModules).toBe(1)
    expect(insights.actionRequired.map(row => row.module_id)).toEqual(['ria:http'])
    expect(insights.slowestCycleModule?.module_id).toBe('ria:http')
  })
})

describe('adminInsights incident helpers', () => {
  it('keeps actions scoped to the correct bundle window for a module', () => {
    const bundles: FailureBundleSummary[] = [
      {
        bundle_id: 'bundle-1',
        module_id: 'wise:http',
        provider_id: 'wise',
        category: 'parser',
        error_message: 'timeout',
        severity: 'high',
        consecutive_failures: 3,
        affected_corridors: ['US-MX-USD-MXN'],
        created_at: '2026-03-07T10:00:00.000Z',
        repair_outcome: 'applied',
        repair_pr_url: null,
      },
      {
        bundle_id: 'bundle-2',
        module_id: 'wise:http',
        provider_id: 'wise',
        category: 'parser',
        error_message: 'schema drift',
        severity: 'critical',
        consecutive_failures: 5,
        affected_corridors: ['US-IN-USD-INR', 'US-PH-USD-PHP'],
        created_at: '2026-03-07T12:00:00.000Z',
        repair_outcome: null,
        repair_pr_url: null,
      },
    ]
    const actions: AgentActionEntry[] = [
      {
        action_id: 'action-1',
        action_type: 'triage',
        agent_id: 'agent-a',
        module_id: 'wise:http',
        description: 'triage',
        status: 'approved',
        created_at: '2026-03-07T10:05:00.000Z',
        completed_at: null,
      },
      {
        action_id: 'action-2',
        action_type: 'repair',
        agent_id: 'agent-a',
        module_id: 'wise:http',
        description: 'repair',
        status: 'completed',
        created_at: '2026-03-07T10:10:00.000Z',
        completed_at: '2026-03-07T10:20:00.000Z',
      },
      {
        action_id: 'action-3',
        action_type: 'triage',
        agent_id: 'agent-a',
        module_id: 'wise:http',
        description: 'triage second',
        status: 'approved',
        created_at: '2026-03-07T12:10:00.000Z',
        completed_at: null,
      },
    ]

    const incidents = buildIncidentTimeline(
      bundles,
      actions,
      new Date('2026-03-07T13:00:00.000Z').getTime(),
    )

    expect(incidents).toHaveLength(2)
    const firstBundle = incidents.find(incident => incident.bundle_id === 'bundle-1')
    const secondBundle = incidents.find(incident => incident.bundle_id === 'bundle-2')

    expect(firstBundle?.action_count).toBe(2)
    expect(firstBundle?.resolution_at).toBe('2026-03-07T10:20:00.000Z')
    expect(firstBundle?.resolution_seconds).toBe(20 * 60)
    expect(secondBundle?.action_count).toBe(1)
    expect(secondBundle?.triage_at).toBe('2026-03-07T12:10:00.000Z')
    expect(secondBundle?.resolution_at).toBeNull()

    const summary = summarizeIncidentTimeline(incidents)
    expect(summary.openCount).toBe(1)
    expect(summary.resolvedCount).toBe(1)
    expect(summary.appliedCount).toBe(1)
    expect(summary.criticalOpenCount).toBe(1)
    expect(summary.watchlist[0]?.bundle_id).toBe('bundle-2')
  })
})

describe('adminInsights self-healing helpers', () => {
  it('summarizes queue pressure, repair hit rate, and blast radius', () => {
    const metrics = {
      mttd_minutes: 14,
      mttr_minutes: 42,
      auto_heal_success_rate: 0.75,
      pending_bundles: 2,
      active_repairs: 1,
      total_bundles_24h: 4,
      successful_repairs_24h: 3,
      period: '7d',
    }
    const actions: AgentActionEntry[] = [
      {
        action_id: 'action-1',
        action_type: 'triage',
        agent_id: 'agent-a',
        module_id: 'wise:http',
        description: 'triage',
        status: 'approved',
        created_at: '2026-03-07T10:05:00.000Z',
        completed_at: null,
      },
      {
        action_id: 'action-2',
        action_type: 'repair',
        agent_id: 'agent-a',
        module_id: 'wise:http',
        description: 'repair',
        status: 'completed',
        created_at: '2026-03-07T10:10:00.000Z',
        completed_at: '2026-03-07T10:20:00.000Z',
      },
      {
        action_id: 'action-3',
        action_type: 'repair',
        agent_id: 'agent-b',
        module_id: 'ria:http',
        description: 'repair',
        status: 'failed',
        created_at: '2026-03-07T11:00:00.000Z',
        completed_at: '2026-03-07T11:05:00.000Z',
      },
    ]
    const bundles: FailureBundleSummary[] = [
      {
        bundle_id: 'bundle-1',
        module_id: 'wise:http',
        provider_id: 'wise',
        category: 'parser',
        error_message: 'timeout',
        severity: 'high',
        consecutive_failures: 3,
        affected_corridors: ['US-MX-USD-MXN'],
        created_at: '2026-03-07T10:00:00.000Z',
        repair_outcome: 'applied',
        repair_pr_url: null,
      },
      {
        bundle_id: 'bundle-2',
        module_id: 'ria:http',
        provider_id: 'ria',
        category: 'coverage',
        error_message: 'gap',
        severity: 'critical',
        consecutive_failures: 5,
        affected_corridors: ['US-IN-USD-INR', 'US-PH-USD-PHP'],
        created_at: '2026-03-07T12:00:00.000Z',
        repair_outcome: null,
        repair_pr_url: null,
      },
    ]
    const trends = [
      { date: '2026-03-01', total_bundles: 1, applied: 1, failed: 0, pending: 0 },
      { date: '2026-03-02', total_bundles: 2, applied: 1, failed: 1, pending: 0 },
    ]

    const insights = buildSelfHealingInsights(
      metrics,
      actions,
      bundles,
      trends,
      new Date('2026-03-07T13:00:00.000Z').getTime(),
    )

    expect(insights.telemetryState).toBe('live')
    expect(insights.summary.openCount).toBe(1)
    expect(insights.impactedModules).toBe(2)
    expect(insights.impactedCorridors).toBe(3)
    expect(insights.completedActions).toBe(1)
    expect(insights.failedActions).toBe(1)
    expect(insights.repairHitRate).toBeCloseTo(2 / 3, 5)
    expect(insights.hottestModuleId).toBe('ria:http')
  })
})

describe('adminInsights corridor stress helpers', () => {
  it('computes freshness, watchlist ordering, and confidence mix', () => {
    const summary: StressSummary = {
      total_corridors: 3,
      normal: 1,
      elevated: 1,
      high: 0,
      critical: 1,
    }
    const corridors: CorridorStressEntry[] = [
      {
        corridor_id: 'US-MX-USD-MXN',
        stress_score: 0.92,
        stress_level: 'critical',
        date: '2026-03-07',
        computed_at: '2026-03-07T12:45:00.000Z',
        confidence: 'high',
      },
      {
        corridor_id: 'US-IN-USD-INR',
        stress_score: 0.47,
        stress_level: 'elevated',
        date: '2026-03-07',
        computed_at: '2026-03-07T12:40:00.000Z',
        confidence: 'manual_override',
      },
      {
        corridor_id: 'US-PH-USD-PHP',
        stress_score: 0.12,
        stress_level: 'normal',
        date: '2026-03-07',
        computed_at: '2026-03-07T12:35:00.000Z',
        confidence: 'low',
      },
    ]

    const insights = buildCorridorStressInsights(
      corridors,
      summary,
      '2026-03-07T12:45:00.000Z',
      new Date('2026-03-07T13:00:00.000Z').getTime(),
    )

    expect(insights.telemetryState).toBe('live')
    expect(insights.freshnessState).toBe('fresh')
    expect(insights.elevatedCount).toBe(2)
    expect(insights.criticalCount).toBe(1)
    expect(insights.highestRisk?.corridor_id).toBe('US-MX-USD-MXN')
    expect(insights.topWatchlist.map(corridor => corridor.corridor_id)).toEqual([
      'US-MX-USD-MXN',
      'US-IN-USD-INR',
    ])
    expect(insights.confidenceCounts.high).toBe(1)
    expect(insights.confidenceCounts.manual).toBe(1)
  })
})
