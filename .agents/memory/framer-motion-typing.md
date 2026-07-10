---
name: Framer Motion TypeScript typing rules
description: How to avoid 'string not assignable to AnimationGeneratorType' TS errors when using Framer Motion variants and transition objects.
---

## The problem
TypeScript widens `type: 'spring'` to `type: string` in plain object literals, which is incompatible with Framer Motion's `Transition` type that expects the literal union `'spring' | 'tween' | 'inertia' | ...`.

This appears in two places:
1. **Variant objects** (passed to `variants` prop) — all keys typed as `VariantLabels`/`TargetAndTransition`.
2. **Helper functions** that return spread props including a `transition` key.

## Fixes

### Variant objects
Import `type { Variants }` from framer-motion and annotate:
```ts
import { type Variants } from 'framer-motion'
const myVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { type: 'spring', stiffness: 200 } }, // OK - Variants handles it
}
```

### Helper functions returning spread props
Add `as const` to the `type` field:
```ts
const up = (delay = 0) => ({
  transition: { type: 'spring' as const, stiffness: 160, damping: 22, delay },
})
```

### Custom variant functions (variant = function)
Also need `as const` on `type` inside the returned object:
```ts
const itemVariants: Variants = {
  visible: (i: number) => ({ opacity: 1, transition: { type: 'spring' as const, delay: i * 0.04 } }),
}
```

**Why:** TypeScript infers object literal `{ type: 'spring' }` as `{ type: string }`, not `{ type: 'spring' }`, unless constrained by a type annotation or `as const`. The `Variants` type does force correct narrowing for static keys but not for function variants or objects outside of the Variants context (e.g. spread props).

**How to apply:** Whenever writing `type: 'spring'` (or 'tween', 'inertia') in a transition object — either annotate the parent as `Variants` if it's a variants object, or add `as const` to the `type` value if it's a spread-prop helper function.
