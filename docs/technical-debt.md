# Technical Debt

This document tracks known technical debt items that are acceptable for the current MVP but should be addressed in future iterations.

---

## Playwright Support (MVP - Not Implemented)

**Status:** Planned for future implementation  
**Priority:** Low  
**Impact:** No current impact - feature not yet needed

### Description

All provider limit files (`backend/plane-b/src/providers/*/limits.ts`) include `playwrightLimits` exports that are currently not used. These limits are defined for future use when Playwright-based browser automation is implemented.

### Current State

- **Remitly**: `playwrightLimits` defined but unused
- **Wise**: `playwrightLimits` defined but unused
- **WorldRemit**: `playwrightLimits` defined but unused
- **Western Union**: `playwrightLimits` defined but unused
- **XE**: `playwrightLimits` defined but unused

All `playwrightLimits` objects include:
- `rpm`: Requests per minute limit
- `concurrency`: Concurrent request limit
- `perLocale`: Locale-based rate limiting flag
- `perCorridorRpm`: Per-corridor rate limit

### Rationale

Playwright support is planned for providers that require browser automation (e.g., JavaScript-heavy sites, anti-bot protection). The limits are pre-defined to:
1. Maintain consistency across providers
2. Enable quick implementation when needed
3. Support environment variable configuration from day one

### Code References

Each provider's `limits.ts` file includes:
```typescript
/**
 * MVP: Playwright support is not yet implemented.
 * These limits are defined for future use and do not affect current functionality.
 */
export const playwrightLimits = {
  rpm: toNumber(process.env.PLANE_B_<PROVIDER>_PLAYWRIGHT_RPM, 4),
  concurrency: toNumber(process.env.PLANE_B_<PROVIDER>_PLAYWRIGHT_CONCURRENCY, 1),
  perLocale: true,
  perCorridorRpm: toNumber(process.env.PLANE_B_<PROVIDER>_PLAYWRIGHT_CORRIDOR_RPM, 2),
}
```

### Future Implementation

When Playwright support is implemented:
1. Create Playwright-based fetch functions for applicable providers
2. Integrate `playwrightLimits` into collector orchestration
3. Add Playwright-specific error handling and retry logic
4. Update collector options to support Playwright mode selection
5. Add Playwright health probes and monitoring

### Related Files

- `backend/plane-b/src/providers/remitly/limits.ts`
- `backend/plane-b/src/providers/wise/limits.ts`
- `backend/plane-b/src/providers/worldremit/limits.ts`
- `backend/plane-b/src/providers/westernunion/limits.ts`
- `backend/plane-b/src/providers/xe/limits.ts`

---

## Adding New Technical Debt Items

When adding new technical debt items to this document:
1. Use the same structure as above
2. Include status, priority, impact, and rationale
3. Link to relevant code files
4. Document the path to resolution
5. Update this document when items are resolved

