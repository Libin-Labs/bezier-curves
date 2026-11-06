import {
  evaluate,
  split,
  derivative,
  flatten,
  type Point,
  type Curve,
  type FlattenOptions,
} from '@lp-labs/bezier-curves';
const curve: Curve = [
  { x: 0, y: 0 },
  { x: 1, y: 2 },
  { x: 2, y: 0 },
];
const options: FlattenOptions = { tolerance: 0.01, maxDepth: 20, maxSegments: 1024 };
const p: Point = evaluate(curve, 0.5);
void p;
split(curve, 0.5);
derivative(curve, 0.2);
flatten(curve, options);
const short: readonly [Point, Point] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
];
// @ts-expect-error A curve requires three or four control points.
evaluate(short, 0);
// @ts-expect-error Tolerance is required.
flatten(curve, { maxDepth: 2 });
