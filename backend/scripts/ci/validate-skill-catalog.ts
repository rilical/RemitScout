import fs from 'node:fs'
import path from 'node:path'

import { parse as parseYaml } from 'yaml'

type SkillExecutor = 'github_actions' | 'aws_scheduled' | 'local_codex' | 'manual'

type SkillDef = {
  skill_id: string
  purpose: string
  executor: SkillExecutor
  command?: string
  workflow?: string
  job?: string
  required_inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  risk_tier: number
}

type SkillCatalog = {
  version: number
  skills: SkillDef[]
}

const backendDir = path.resolve(__dirname, '..', '..')
const repoRoot = path.resolve(backendDir, '..')

const catalogPath = path.join(repoRoot, '.remit-scout', 'skills', 'catalog.yaml')

const readYaml = (p: string): any => parseYaml(fs.readFileSync(p, 'utf8')) as any

const main = () => {
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Missing skill catalog: ${catalogPath}`)
  }

  const raw = readYaml(catalogPath)
  const catalog: SkillCatalog = {
    version: Number(raw?.version) || 0,
    skills: Array.isArray(raw?.skills) ? raw.skills : [],
  }

  const errors: string[] = []
  if (!Number.isInteger(catalog.version) || catalog.version < 1) {
    errors.push(`Invalid skill catalog version in ${catalogPath}`)
  }

  const seen = new Set<string>()
  for (const s of catalog.skills) {
    const id = String(s?.skill_id || '').trim()
    if (!id) {
      errors.push(`Skill missing skill_id: ${JSON.stringify(s)}`)
      continue
    }
    if (seen.has(id)) errors.push(`Duplicate skill_id: ${id}`)
    seen.add(id)

    const ex = String(s?.executor || '').trim()
    if (!['github_actions', 'aws_scheduled', 'local_codex', 'manual'].includes(ex)) {
      errors.push(`Invalid executor for ${id}: ${ex}`)
    }

    const risk = Number(s?.risk_tier)
    if (!Number.isInteger(risk) || risk < 0 || risk > 3) errors.push(`Invalid risk_tier for ${id}: ${String(s?.risk_tier)}`)

    if (ex === 'github_actions') {
      const wf = String(s?.workflow || '').trim()
      if (!wf) {
        errors.push(`github_actions skill missing workflow: ${id}`)
        continue
      }
      const wfPath = path.join(repoRoot, wf)
      if (!fs.existsSync(wfPath)) {
        errors.push(`Workflow file not found for ${id}: ${wf}`)
        continue
      }

      const wfRaw = fs.readFileSync(wfPath, 'utf8')
      const wfYaml = readYaml(wfPath)

      const onBlock = (wfYaml?.on ?? wfYaml?.['on'] ?? (wfYaml as any)?.true) as any
      const dispatch = onBlock?.workflow_dispatch as any
      const inputs = dispatch?.inputs && typeof dispatch.inputs === 'object' ? dispatch.inputs : {}
      const inputKeys = new Set(Object.keys(inputs))

      const required = s?.required_inputs && typeof s.required_inputs === 'object' ? Object.keys(s.required_inputs) : []
      for (const k of required) {
        if (!inputKeys.has(k)) errors.push(`Workflow inputs missing required_inputs key for ${id}: ${k}`)
      }

      if (id.startsWith('evidence.')) {
        const file = String(s?.outputs?.file || '').trim()
        if (file !== 'evidence.json') errors.push(`Evidence skill outputs.file must be evidence.json for ${id}`)

        if (!wfRaw.includes('actions/upload-artifact')) {
          errors.push(`Evidence workflow does not upload artifacts (missing actions/upload-artifact) for ${id}: ${wf}`)
        } else if (!wfRaw.includes('path: evidence.json')) {
          errors.push(`Evidence workflow upload-artifact path should include evidence.json for ${id}: ${wf}`)
        }
      }
    }
  }

  if (errors.length) {
     
    console.error('validate-skill-catalog failed:\n' + errors.map((e) => `- ${e}`).join('\n'))
    process.exit(1)
  }

   
  console.log(`validate-skill-catalog ok (skills=${catalog.skills.length})`)
}

main()
