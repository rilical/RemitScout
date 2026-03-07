# Frontend Build Failure Troubleshooting

The Nuxt 3 frontend build can fail due to TypeScript errors in Nitro server plugins, dependency mismatches, or stale build caches. This runbook covers diagnosis and resolution.

## Known Issue: Nitropack Plugin Type Errors

**Status:** Active since 2026-03-02. Backend deploys succeed; frontend is a separate failure track.

```
Type Error: nitropack/runtime/plugin
- frontend/server/plugins/cspNonce.ts — defineNitroPlugin not recognized
- frontend/server/plugins/encodeNuxtAssetUrls.ts — defineNitroPlugin not recognized
```

**Root cause:** `defineNitroPlugin()` is called without explicit imports. Nitro plugin utilities should be auto-imported by Nuxt, but TypeScript strict mode fails to resolve the global type. The `.nuxt/tsconfig.json` may not include necessary Nitro ambient declarations.

### Fix Options

**Option 1 — Add explicit imports** (preferred):
```typescript
// Add to top of each plugin file
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
```

**Option 2 — Stub missing types** (`frontend/types/nitro.d.ts`):
```typescript
declare global {
  function defineNitroPlugin(
    plugin: (app: any) => void | Promise<void>
  ): void | Promise<void>
}
```

**Option 3 — Clear build cache and regenerate**:
```bash
cd frontend
rm -rf .nuxt node_modules/.cache
pnpm install
pnpm build
```

**Option 4 — Check Nitro version compatibility**:
```bash
cd frontend && npm ls nitropack
# Current: nuxt@^3.20.2 — check if a minor downgrade resolves types
```

## General Build Troubleshooting

### Build Commands

```bash
cd frontend && pnpm build        # Full production build
cd frontend && pnpm type-check   # TypeScript check only
cd frontend && pnpm dev          # Dev mode (port 3000)
```

### Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `nitropack/runtime/plugin` type error | Missing Nitro type imports | See known issue above |
| `Cannot find module` errors | Stale `.nuxt` directory | `rm -rf .nuxt && pnpm build` |
| `ENOMEM` during build | Node.js heap exhaustion | `NODE_OPTIONS="--max-old-space-size=4096" pnpm build` |
| Tailwind/PostCSS errors | Config mismatch | Check `tailwind.config.ts` and `postcss.config.js` |
| Vue component type errors | Auto-import cache stale | `rm -rf .nuxt/types && pnpm type-check` |
| SSR hydration mismatch | Server/client render divergence | Check `<ClientOnly>` wrappers |

### Diagnosis Steps

1. **Run type check first** (faster than full build):
   ```bash
   cd frontend && pnpm type-check
   ```

2. **Check generated tsconfig**:
   ```bash
   cat frontend/.nuxt/tsconfig.json
   ```

3. **Verify dependencies**:
   ```bash
   cd frontend && pnpm install --frozen-lockfile
   ```

4. **Check Nuxt version**:
   ```bash
   cd frontend && npx nuxt info
   ```

5. **Nuclear reset**:
   ```bash
   cd frontend
   rm -rf .nuxt .output node_modules
   pnpm install
   pnpm build
   ```

## CI/CD Integration

Frontend build runs in `.github/workflows/deploy.yml` as a separate step from backend deployment. A frontend build failure does **not** block backend deployment.

### CI Build Failure

1. Check the GitHub Actions log for the specific error
2. Verify the same error reproduces locally (`cd frontend && pnpm build`)
3. If CI-only, check Node.js version mismatch (CI uses version from `.node-version` or workflow config)
4. If dependency-related, check `frontend/pnpm-lock.yaml` for conflicts

## Prevention

- Run `pnpm type-check` before committing frontend changes
- Pin Nuxt/Nitro versions explicitly to avoid surprise breaking changes
- Keep `.nuxt` in `.gitignore` (already configured)

## Related

- `frontend/nuxt.config.ts` — build configuration
- `frontend/server/plugins/` — Nitro server plugins
- `frontend/tsconfig.json` — TypeScript configuration
- `.github/workflows/deploy.yml` — CI/CD pipeline
- CLAUDE.md — known frontend build issue noted under "Recent Changes"
