# Backend Tests

## Running Tests

- `pnpm test` - Run all tests with coverage reporting
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Open Vitest UI
- `pnpm test:coverage` - Run tests and generate coverage report

## Coverage Thresholds

We enforce the following coverage thresholds:
- **Statements**: 70%
- **Branches**: 65%
- **Functions**: 70%
- **Lines**: 70%

CI will fail if coverage drops below these thresholds.

## Viewing Coverage Reports

After running `pnpm test`, open `backend/coverage/index.html` in your browser to view the interactive coverage report.

## Coverage Exclusions

The following are excluded from coverage:
- `scripts/` - One-off scripts, not core logic
- `db/migrations/` - SQL migration files
- `shared/config.ts` - Environment variable parsing
- Test files themselves

## Adding New Tests

1. Create a test file: `*.test.ts` or `*.spec.ts`
2. Place in `backend/tests/` or next to the source file
3. Use Vitest's `describe`, `it`, `expect` functions
4. Example:

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should do something', () => {
    expect(myFunction()).toBe(expected)
  })
})
```



