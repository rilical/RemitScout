import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import dotenv from 'dotenv'
import { App } from '@slack/bolt'

type CaseEnv = 'dev' | 'staging' | 'prod'
type Severity = 'sev0' | 'sev1' | 'sev2' | 'sev3'
type Domain =
  | 'provider_health'
  | 'queue'
  | 'api_latency'
  | 'freshness'
  | 'indices'
  | 'pulse'
  | 'exports'
  | 'infra_drift'
  | 'security'
  | 'other'

type CaseAction = 'dispatch_evidence' | 'acknowledge' | 'suppress'

type CaseActionEvent = {
  kind: 'case_action'
  action_id: string
  requested_at: string
  case_id: string
  action: CaseAction
  params?: {
    evidence_only?: boolean
    suppress_minutes?: number
  }
  requested_by?: {
    source: 'slack'
    slack_user_id?: string
    slack_channel_id?: string
    slack_message_ts?: string
  }
}

type SignalEvent = {
  signal_id: string
  observed_at: string
  env: CaseEnv
  severity: Severity
  signal_sources: string[]
  domain: Domain
  symptoms: string
  provider_id?: string
  corridor_id?: string
  queue_kind?: string
  target_url?: string
  risk_tier?: number
}

const nowIso = () => new Date().toISOString()

const readUtf8 = (p: string) => fs.readFileSync(p, 'utf8')

const findRepoRoot = (): string => {
  const override = String(process.env.REMIT_SCOUT_REPO_ROOT || '').trim()
  if (override) return path.resolve(override)

  // Be robust to being launched from `backend/` via `pnpm -C backend ...`.
  let dir = process.cwd()
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, '.remit-scout'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(process.cwd(), '..')
}

const mustEnv = (name: string): string => {
  const value = String(process.env[name] || '').trim()
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const safeJson = (raw: string): any => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const normalizeEnv = (raw: string): CaseEnv => {
  const token = String(raw || '').trim().toLowerCase()
  if (token === 'prod' || token === 'production') return 'prod'
  if (token === 'staging' || token === 'stage') return 'staging'
  return 'dev'
}

const normalizeSeverity = (raw: string): Severity => {
  const token = String(raw || '').trim().toLowerCase()
  if (token === 'sev0') return 'sev0'
  if (token === 'sev1') return 'sev1'
  if (token === 'sev2') return 'sev2'
  return 'sev3'
}

const normalizeDomain = (raw: string): Domain => {
  const token = String(raw || '').trim().toLowerCase()
  if (
    token === 'provider_health'
    || token === 'queue'
    || token === 'api_latency'
    || token === 'freshness'
    || token === 'indices'
    || token === 'pulse'
    || token === 'exports'
    || token === 'infra_drift'
    || token === 'security'
  ) return token
  return 'other'
}

const writeInboxEvent = (repoRoot: string, prefix: string, payload: unknown): string => {
  const inboxDir = path.join(repoRoot, 'ops', 'brain', 'inbox')
  fs.mkdirSync(inboxDir, { recursive: true })
  const filename = `${prefix}-${Date.now()}-${randomUUID()}.json`
  const full = path.join(inboxDir, filename)
  fs.writeFileSync(full, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  return full
}

const main = async () => {
  const repoRoot = findRepoRoot()

  // Local env file is intentionally not committed.
  const envPath = path.join(repoRoot, '.env.frontdesk')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }

  const botToken = mustEnv('SLACK_BOT_TOKEN')
  const appToken = mustEnv('SLACK_APP_TOKEN')
  const signingSecret = mustEnv('SLACK_SIGNING_SECRET')

  const app = new App({
    token: botToken,
    appToken,
    signingSecret,
    socketMode: true,
  })

  const writeCaseAction = (args: {
    caseId: string
    action: CaseAction
    params?: CaseActionEvent['params']
    slack: { userId?: string; channelId?: string; messageTs?: string }
  }) => {
    const event: CaseActionEvent = {
      kind: 'case_action',
      action_id: randomUUID(),
      requested_at: nowIso(),
      case_id: args.caseId,
      action: args.action,
      params: args.params ?? {},
      requested_by: {
        source: 'slack',
        slack_user_id: args.slack.userId,
        slack_channel_id: args.slack.channelId,
        slack_message_ts: args.slack.messageTs,
      },
    }
    return writeInboxEvent(repoRoot, 'case-action', event)
  }

  const parseCaseButtonValue = (raw: string): { case_id: string; env?: string } | null => {
    const parsed = safeJson(raw)
    const caseId = String(parsed?.case_id || '').trim()
    if (!caseId) return null
    const env = parsed?.env ? String(parsed.env).trim() : undefined
    return { case_id: caseId, ...(env ? { env } : {}) }
  }

  // Buttons on Case cards.
  app.action('case_acknowledge', async ({ ack, body, client, action }: any) => {
    await ack()
    const channelId = String(body?.channel?.id || '')
    const userId = String(body?.user?.id || '')
    const messageTs = String(body?.message?.ts || body?.container?.message_ts || '')

    const value = parseCaseButtonValue(String(action?.value || ''))
    if (!value) {
      if (channelId && userId) {
        await client.chat.postEphemeral({ channel: channelId, user: userId, text: 'Invalid Case button payload.' })
      }
      return
    }

    writeCaseAction({
      caseId: value.case_id,
      action: 'acknowledge',
      params: {},
      slack: { userId, channelId, messageTs },
    })

    if (channelId && userId) {
      await client.chat.postEphemeral({ channel: channelId, user: userId, text: `Queued: acknowledge \`${value.case_id}\`.` })
    }
  })

  app.action('case_dispatch_evidence', async ({ ack, body, client, action }: any) => {
    await ack()
    const channelId = String(body?.channel?.id || '')
    const userId = String(body?.user?.id || '')
    const messageTs = String(body?.message?.ts || body?.container?.message_ts || '')

    const value = parseCaseButtonValue(String(action?.value || ''))
    if (!value) {
      if (channelId && userId) {
        await client.chat.postEphemeral({ channel: channelId, user: userId, text: 'Invalid Case button payload.' })
      }
      return
    }

    writeCaseAction({
      caseId: value.case_id,
      action: 'dispatch_evidence',
      params: { evidence_only: true },
      slack: { userId, channelId, messageTs },
    })

    if (channelId && userId) {
      await client.chat.postEphemeral({ channel: channelId, user: userId, text: `Queued: dispatch evidence for \`${value.case_id}\`.` })
    }
  })

  app.action('case_suppress_1h', async ({ ack, body, client, action }: any) => {
    await ack()
    const channelId = String(body?.channel?.id || '')
    const userId = String(body?.user?.id || '')
    const messageTs = String(body?.message?.ts || body?.container?.message_ts || '')

    const value = parseCaseButtonValue(String(action?.value || ''))
    if (!value) {
      if (channelId && userId) {
        await client.chat.postEphemeral({ channel: channelId, user: userId, text: 'Invalid Case button payload.' })
      }
      return
    }

    writeCaseAction({
      caseId: value.case_id,
      action: 'suppress',
      params: { suppress_minutes: 60 },
      slack: { userId, channelId, messageTs },
    })

    if (channelId && userId) {
      await client.chat.postEphemeral({ channel: channelId, user: userId, text: `Queued: suppress Slack posts for \`${value.case_id}\` for 1h.` })
    }
  })

  // Manual signal entry: /issueops -> modal -> write signal JSON into inbox.
  app.command('/issueops', async ({ ack, body, client }: any) => {
    await ack()
    const channelId = String(body?.channel_id || '')

    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'issueops_signal_modal',
        private_metadata: JSON.stringify({ channel_id: channelId }),
        title: { type: 'plain_text', text: 'IssueOps Signal' },
        submit: { type: 'plain_text', text: 'Create' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'input',
            block_id: 'env',
            label: { type: 'plain_text', text: 'Environment' },
            element: {
              type: 'static_select',
              action_id: 'env',
              options: [
                { text: { type: 'plain_text', text: 'dev' }, value: 'dev' },
                { text: { type: 'plain_text', text: 'staging' }, value: 'staging' },
                { text: { type: 'plain_text', text: 'prod' }, value: 'prod' },
              ],
              initial_option: { text: { type: 'plain_text', text: 'staging' }, value: 'staging' },
            },
          },
          {
            type: 'input',
            block_id: 'domain',
            label: { type: 'plain_text', text: 'Domain' },
            element: {
              type: 'static_select',
              action_id: 'domain',
              options: [
                { text: { type: 'plain_text', text: 'provider_health' }, value: 'provider_health' },
                { text: { type: 'plain_text', text: 'queue' }, value: 'queue' },
                { text: { type: 'plain_text', text: 'api_latency' }, value: 'api_latency' },
                { text: { type: 'plain_text', text: 'freshness' }, value: 'freshness' },
                { text: { type: 'plain_text', text: 'indices' }, value: 'indices' },
                { text: { type: 'plain_text', text: 'pulse' }, value: 'pulse' },
                { text: { type: 'plain_text', text: 'exports' }, value: 'exports' },
                { text: { type: 'plain_text', text: 'infra_drift' }, value: 'infra_drift' },
                { text: { type: 'plain_text', text: 'security' }, value: 'security' },
                { text: { type: 'plain_text', text: 'other' }, value: 'other' },
              ],
              initial_option: { text: { type: 'plain_text', text: 'provider_health' }, value: 'provider_health' },
            },
          },
          {
            type: 'input',
            block_id: 'severity',
            label: { type: 'plain_text', text: 'Severity' },
            element: {
              type: 'static_select',
              action_id: 'severity',
              options: [
                { text: { type: 'plain_text', text: 'sev0' }, value: 'sev0' },
                { text: { type: 'plain_text', text: 'sev1' }, value: 'sev1' },
                { text: { type: 'plain_text', text: 'sev2' }, value: 'sev2' },
                { text: { type: 'plain_text', text: 'sev3' }, value: 'sev3' },
              ],
              initial_option: { text: { type: 'plain_text', text: 'sev2' }, value: 'sev2' },
            },
          },
          {
            type: 'input',
            block_id: 'symptoms',
            label: { type: 'plain_text', text: 'Symptoms' },
            element: { type: 'plain_text_input', action_id: 'symptoms', multiline: true },
          },
          {
            type: 'input',
            block_id: 'provider_id',
            optional: true,
            label: { type: 'plain_text', text: 'Provider ID (optional)' },
            element: { type: 'plain_text_input', action_id: 'provider_id' },
          },
          {
            type: 'input',
            block_id: 'corridor_id',
            optional: true,
            label: { type: 'plain_text', text: 'Corridor ID (optional)' },
            element: { type: 'plain_text_input', action_id: 'corridor_id' },
          },
          {
            type: 'input',
            block_id: 'queue_kind',
            optional: true,
            label: { type: 'plain_text', text: 'Queue kind (optional)' },
            element: {
              type: 'static_select',
              action_id: 'queue_kind',
              options: [
                { text: { type: 'plain_text', text: 'quote_refresh' }, value: 'quote_refresh' },
                { text: { type: 'plain_text', text: 'fx_rate_refresh' }, value: 'fx_rate_refresh' },
                { text: { type: 'plain_text', text: 'ingest_fanout' }, value: 'ingest_fanout' },
                { text: { type: 'plain_text', text: 'ingest_fanout_tier2' }, value: 'ingest_fanout_tier2' },
                { text: { type: 'plain_text', text: 'exports' }, value: 'exports' },
                { text: { type: 'plain_text', text: 'notifications' }, value: 'notifications' },
                { text: { type: 'plain_text', text: 'ops_alerts' }, value: 'ops_alerts' },
                { text: { type: 'plain_text', text: 'gold_live' }, value: 'gold_live' },
              ],
            },
          },
          {
            type: 'input',
            block_id: 'target_url',
            optional: true,
            label: { type: 'plain_text', text: 'Target URL (optional, for api_latency)' },
            element: { type: 'plain_text_input', action_id: 'target_url' },
          },
          {
            type: 'input',
            block_id: 'risk_tier',
            optional: true,
            label: { type: 'plain_text', text: 'Risk tier (0-3, optional)' },
            element: {
              type: 'static_select',
              action_id: 'risk_tier',
              options: [
                { text: { type: 'plain_text', text: '0' }, value: '0' },
                { text: { type: 'plain_text', text: '1' }, value: '1' },
                { text: { type: 'plain_text', text: '2' }, value: '2' },
                { text: { type: 'plain_text', text: '3' }, value: '3' },
              ],
              initial_option: { text: { type: 'plain_text', text: '1' }, value: '1' },
            },
          },
        ],
      },
    })
  })

  app.view('issueops_signal_modal', async ({ ack, body, view, client }: any) => {
    await ack()
    const state = view?.state?.values || {}

    const selectedValue = (blockId: string, actionId: string): string => {
      const node = state?.[blockId]?.[actionId]
      return String(node?.selected_option?.value || '').trim()
    }
    const inputValue = (blockId: string, actionId: string): string => {
      const node = state?.[blockId]?.[actionId]
      return String(node?.value || '').trim()
    }

    const env = normalizeEnv(selectedValue('env', 'env'))
    const domain = normalizeDomain(selectedValue('domain', 'domain'))
    const severity = normalizeSeverity(selectedValue('severity', 'severity'))
    const symptoms = inputValue('symptoms', 'symptoms')
    const providerId = inputValue('provider_id', 'provider_id') || undefined
    const corridorId = inputValue('corridor_id', 'corridor_id') || undefined
    const queueKind = selectedValue('queue_kind', 'queue_kind') || undefined
    const targetUrl = inputValue('target_url', 'target_url') || undefined
    const riskTierRaw = selectedValue('risk_tier', 'risk_tier')
    const riskTier = riskTierRaw ? Number(riskTierRaw) : undefined

    if (!symptoms) {
      // If symptoms are missing, still write the signal to avoid losing the operator's intent.
      // The Brain will route it to manual triage if it can't select skills.
    }

    const signal: SignalEvent = {
      signal_id: `slack:${String(body?.user?.id || 'unknown')}:${randomUUID()}`,
      observed_at: nowIso(),
      env,
      severity,
      signal_sources: ['slack/manual'],
      domain,
      symptoms: symptoms || '(missing symptoms)',
      ...(providerId ? { provider_id: providerId } : {}),
      ...(corridorId ? { corridor_id: corridorId } : {}),
      ...(queueKind ? { queue_kind: queueKind } : {}),
      ...(targetUrl ? { target_url: targetUrl } : {}),
      ...(Number.isFinite(riskTier) ? { risk_tier: Math.max(0, Math.min(3, riskTier as number)) } : {}),
    }

    writeInboxEvent(repoRoot, 'signal-manual', signal)

    const meta = safeJson(String(view?.private_metadata || '')) || {}
    const channelId = String(meta?.channel_id || '')
    const userId = String(body?.user?.id || '')
    if (channelId && userId) {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: `Created signal for \`${env}\` \`${domain}\` (\`${severity}\`). Brain will pick it up shortly.`,
      })
    }
  })

  await app.start()
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ok: true, event: 'slack_frontdesk_started', repo_root: repoRoot, started_at: nowIso() }))
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ ok: false, event: 'slack_frontdesk_failed', error: error instanceof Error ? error.message : String(error) }))
  process.exit(1)
})
