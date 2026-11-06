# @lp-labs/bezier-curves

Quadratic/cubic planar Bézier evaluation, subdivision, derivatives and error-bounded adaptive flattening; no path parser or arc-length claim.

Catalog ID 412. Version 0.1.0. Standalone, zero runtime, peer or sibling dependencies.
Node.js >=18; strict TypeScript; NodeNext ESM and CommonJS with separate declaration trees.

## Install

```sh
npm install @lp-labs/bezier-curves
```

## Quickstart (JavaScript ESM)

```js
import { evaluate, split, flatten } from '@lp-labs/bezier-curves';
const curve = [
  { x: 0, y: 0 },
  { x: 1, y: 2 },
  { x: 2, y: 0 },
];
console.log(evaluate(curve, 0.5)); // { x: 1, y: 1 }
console.log(split(curve, 0.5));
console.log(flatten(curve, { tolerance: 0.01, maxSegments: 1024 }));
```

CommonJS exposes the same named exports with `require('@lp-labs/bezier-curves')`.
Use the bare package name in NodeNext TypeScript `.mts` and `.cts` consumers.
The package has no default export, global side effects, browser globals, network access or file access.

## Contracts, options, errors and customization

- `evaluate` and `split` use de Casteljau; `derivative` evaluates the analytic derivative. Parameter `t` must be finite in `[0,1]`. A `Curve` has exactly three or four finite points with absolute coordinates <= `1e100`.
- `flatten` requires finite positive `tolerance` in coordinate units. Defaults: `maxDepth=20` (integer `0..24`), `maxSegments=65536` (integer `1..1000000`). It tests every interior control point against the finite endpoint segment, including collinear backtracking and coincident endpoints.
- The convex-hull property bounds curve-to-chord distance on every accepted subdivision. The bound is one-sided curve-to-polyline distance, not uniform parameter, Hausdorff, arc-length or curvature accuracy. Floating-point rounding can dominate extremely tiny tolerances.
- `RangeError` rejects invalid inputs or any nonconvergent depth/segment budget; partial output is never returned. Degenerate constant curves produce two equal endpoints. All returned points are copies.
- Evaluation/subdivision/derivative are O(1). Flatten is O(s) work/output for s segments with depth-bounded stack; caps prevent exponential unbounded work. Customize tolerance and both limits explicitly.

## Complete public declarations

All runtime exports, public types, options and return values follow. Readonly declarations
describe caller-facing ownership; results are not recursively frozen at runtime.

```ts
export interface Point {
  readonly x: number;
  readonly y: number;
}
export type Curve = readonly [Point, Point, Point] | readonly [Point, Point, Point, Point];
export interface FlattenOptions {
  readonly tolerance: number;
  readonly maxDepth?: number;
  readonly maxSegments?: number;
}
export declare function evaluate(c: Curve, t: number): Point;
export declare function split(c: Curve, t: number): readonly [Curve, Curve];
export declare function derivative(c: Curve, t: number): Point;
/** Control-polygon distance to each chord bounds curve-to-polyline error. Throws rather than silently accepting a depth/segment limit. */
export declare function flatten(c: Curve, options: FlattenOptions): Point[];
```

## Development and verification

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

An offline install requires the pinned lockfile's development packages in the local npm cache.
Development-only dependencies: TypeScript ^5.9.3 and Prettier ^3.6.2.
Build emits `dist/esm` and `dist/cjs`, each with declarations; CommonJS has its own package boundary.
Tests cover finite bounds, degeneracy, ownership, work limits, deterministic results and independent reference checks.
Consumer fixtures exercise bare-package ESM/CJS declaration resolution with negative compile-time checks.
Only dist, README, LICENSE and package metadata are published. No automatic publishing is performed.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
