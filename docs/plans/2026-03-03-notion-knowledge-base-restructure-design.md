# Notion Knowledge Base Restructure — Design Doc

**Date:** 2026-03-03
**Author:** Claude (Opus 4.6)
**Status:** Approved

## Goal

Full restructure of the Remit-Scout Notion workspace into a code-verified, multi-audience knowledge base. Replace the existing Confluence-import pages with accurate documentation derived from reading actual source code.

## Audience

- **Stakeholders:** Executive summaries, business model, IP portfolio
- **Engineers:** Architecture, code walkthrough, onboarding
- **AI Agents:** Catalogs, schemas, RAG context, structured references

## Information Architecture: Hub-and-Spoke

### Hub: Remit-Scout (top-level page)

Landing page with mission, key stats, visual navigation to all spokes.

### Spokes

| # | Spoke | Key Content |
|---|-------|-------------|
| 1 | Executive Overview | Mission, business model, IP portfolio, competitive moat |
| 2 | System Architecture | 3-Plane model, service catalog, data flow diagrams |
| 3 | Infrastructure (CDK/AWS) | VPC, ECS, SQS queues, Aurora, Redis, IAM, secrets |
| 4 | Data Pipeline | Bronze/Silver/Gold layers, normalization, schema reference |
| 5 | Proprietary Indices & Formulas | TEER, RCI, RVI, ISER, weighting model, triangulation engine |
| 6 | Provider Catalog | 24 providers, probes, health corridors, module catalog |
| 7 | Agent Self-Healing System | Full pipeline, tool gateway, LLM circuit breaker, reason codes |
| 8 | Frontend | Nuxt 3, pages, SEO infrastructure, composables |
| 9 | Operations & Reliability | CI/CD, runbooks, SLOs, incident response, environments |
| 10 | Security & Compliance | STRIDE, auth, data rights, secrets, pentest results |
| 11 | Roadmap & Plans | Active work, backlog, design docs, ADR index |

### Design Principles

1. Executive summary first (2-3 sentences per page)
2. Architecture overview (diagram or table)
3. Deep reference (code paths, config keys, formulas)
4. Source-of-truth links to canonical repo files
5. Last Updated date on every page

### What Changes

- All 14 existing pages replaced by new structure
- Content verified against actual source code, not just .md files
- Stale/redundant pages removed
- Clean, polished formatting throughout

## Implementation Approach

1. Build full page tree skeleton with stubs
2. Read actual source code for each system
3. Write code-verified content for each page
4. Clean up old pages
5. Cross-link between spokes where relevant
