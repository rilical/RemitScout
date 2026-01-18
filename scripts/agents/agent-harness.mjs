#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const getArg = (key) => {
  const idx = args.indexOf(key)
  if (idx === -1) return null
  return args[idx + 1] || null
}
const hasArg = (key) => args.includes(key)

const agentName = getArg('--agent')
const env = getArg('--env') || 'dev'
const mode = getArg('--mode') || 'review only'
const goal = getArg('--goal') || ''
const request = getArg('--request') || ''
const filesArg = getArg('--files') || ''
const outPath = getArg('--out') || ''
const includeContents = hasArg('--include-files')

if (!agentName) {
  console.error('Usage: node scripts/agents/agent-harness.mjs --agent "Cloud Architect" --env dev --mode "review only" --goal "..." --request "..." --files path1,path2 [--include-files] [--out <path>]')
  process.exit(1)
}

const root = process.cwd()
const architecturePath = path.join(root, 'ARCHITECTURE.md')
const agentsPath = path.join(root, 'AGENTS.md')
const agentMatchPath = path.join(root, 'agents/AGENT-MATCH.md')

const readSafe = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''

const agentsText = readSafe(agentsPath)
const archText = readSafe(architecturePath)
const agentMatchText = readSafe(agentMatchPath)

// Parse agent -> RAG map from AGENTS.md
const ragMap = {}
const lines = agentsText.split('\n')
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim()
  const match = line.match(/^\d+\)\s+(.*)$/)
  if (match) {
    const name = match[1].trim()
    const next = lines[i + 1] || ''
    const ragMatch = next.match(/- RAG:\s+`([^`]+)`/)
    if (ragMatch) {
      ragMap[name] = ragMatch[1]
    }
  }
}

const ragPath = ragMap[agentName]
if (!ragPath) {
  console.error(`Agent not found in AGENTS.md: ${agentName}`)
  process.exit(1)
}

const ragText = readSafe(path.join(root, ragPath))

const files = filesArg ? filesArg.split(',').map(f => f.trim()).filter(Boolean) : []

const formatSection = (title, body) => `\n## ${title}\n${body}\n`

let output = ''
output += '# Agent Harness Context Bundle\n'
output += formatSection('Agent', agentName)
output += formatSection('Environment', env)
output += formatSection('Mode', mode)
output += formatSection('Goal', goal)
output += formatSection('Request', request)
output += formatSection('Files', files.length ? files.join('\n') : 'None')
output += formatSection('Agent Match', agentMatchText.trim())
output += formatSection('Base Instructions (AGENTS.md)', agentsText.trim())
output += formatSection('ARCHITECTURE.md', archText.trim())
output += formatSection('Agent RAG', ragText.trim())

if (includeContents && files.length) {
  output += '\n# File Contents\n'
  for (const file of files) {
    const filePath = path.join(root, file)
    if (!fs.existsSync(filePath)) {
      output += `\n## ${file}\n<missing>\n`
      continue
    }
    const content = fs.readFileSync(filePath, 'utf8')
    output += `\n## ${file}\n\n` + content + '\n'
  }
}

const defaultOut = path.join(root, 'agents', 'logs', `${Date.now()}-${agentName.replace(/\s+/g, '-').toLowerCase()}.md`)
const target = outPath || defaultOut
fs.writeFileSync(target, output)
console.log(`Wrote bundle to ${target}`)
