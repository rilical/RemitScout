# Color Migration Map

## Raw → Semantic Mapping

| Raw Tailwind class | Semantic replacement | Notes |
|---|---|---|
| `slate-50` | `neutral-50` | Use page background token where semantically appropriate |
| `slate-100` | `neutral-100` | |
| `slate-200` | `neutral-200` | |
| `slate-300` | `neutral-300` | |
| `slate-400` | `neutral-400` | |
| `slate-500` | `neutral-500` | |
| `slate-600` | `neutral-600` | |
| `slate-700` | `neutral-700` | |
| `slate-800` | `neutral-800` | |
| `slate-900` | `neutral-900` | |
| `blue-50` | `primary-50` | |
| `blue-100` | `primary-100` | |
| `blue-200` | `primary-200` | |
| `blue-300` | `primary-300` | |
| `blue-400` | `primary-400` | |
| `blue-500` | `primary-500` | |
| `blue-600` | `brand-600` | CTA/primary action semantics |
| `blue-700` | `brand-700` | CTA/primary action semantics |
| `blue-800` | `primary-800` | |
| `blue-900` | `primary-900` | |
| `blue-950` | `primary-950` | |
| `gray-50` | `neutral-50` | |
| `gray-100` | `neutral-100` | |
| `gray-200` | `neutral-200` | |
| `gray-300` | `neutral-300` | |
| `gray-400` | `neutral-400` | |
| `gray-500` | `neutral-500` | |
| `gray-600` | `neutral-600` | |
| `gray-700` | `neutral-700` | |
| `gray-800` | `neutral-800` | |
| `gray-900` | `neutral-900` | |
| `emerald-*` | `success-*` | |
| `amber-*` | `warning-*` | |
| `rose-*` | `danger-*` | |
| `red-*` | `danger-*` | |
| `violet-*` | `accent-*` | |
| `purple-*` | `accent-*` | |

## Raw → Semantic Edge Cases

- `bg-white` → `bg-surface`
- `bg-slate-50` → `bg-rs-bg` (global background token)
- `text-slate-500` → `text-rs-muted`
- `text-slate-900` → `text-rs-fg`
- `border-slate-200` → `border-rs-border`
- `text-blue-600` → `text-brand-600`
- `text-blue-700` → `text-brand-700`
- `hover:text-blue-*` → `hover:text-brand-*`

## Standard Before/After Examples

```html
<div class="bg-slate-50 text-slate-900 border-slate-200">...</div>
<div class="bg-rs-bg text-rs-fg border-rs-border">...</div>

<a class="bg-blue-600 text-white hover:bg-blue-700">Compare</a>
<a class="bg-brand-600 text-white hover:bg-brand-700">Compare</a>

<div class="text-gray-700 bg-gray-100">...</div>
<div class="text-neutral-700 bg-neutral-100">...</div>

<span class="text-blue-500">Learn more</span>
<span class="text-primary-500">Learn more</span>

<Badge class="border border-emerald-600 text-rose-600" />
<Badge class="border border-success-600 text-danger-600" />
```
