import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, split, derivative, flatten } from '../dist/esm/index.js';
const c = [
  { x: 0, y: 0 },
  { x: 0, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: 0 },
];
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) < t, `${a} != ${b}`);
test('quadratic and cubic evaluate endpoints', () => {
  assert.deepEqual(evaluate(c, 0), c[0]);
  assert.deepEqual(evaluate(c, 1), c[3]);
  assert.deepEqual(evaluate(c, 0.5), { x: 1, y: 1.5 });
  assert.deepEqual(
    evaluate(
      [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 0 },
      ],
      0.5,
    ),
    { x: 1, y: 1 },
  );
});
test('split reconstructs both parameter intervals', () => {
  const [a, b] = split(c, 0.3);
  for (const t of [0, 0.2, 0.5, 1]) {
    const p = evaluate(a, t),
      q = evaluate(c, t * 0.3),
      r = evaluate(b, t),
      s = evaluate(c, 0.3 + t * 0.7);
    near(p.x, q.x);
    near(p.y, q.y);
    near(r.x, s.x);
    near(r.y, s.y);
  }
});
test('analytic derivative and finite difference', () => {
  assert.deepEqual(derivative(c, 0), { x: 0, y: 6 });
  const a = evaluate(c, 0.5 - 1e-5),
    b = evaluate(c, 0.5 + 1e-5),
    d = derivative(c, 0.5);
  near(d.x, (b.x - a.x) / 2e-5, 1e-8);
  near(d.y, (b.y - a.y) / 2e-5, 1e-8);
});
test('flatten tolerance against dense independent Bernstein samples', () => {
  const points = flatten(c, { tolerance: 0.005 });
  const distance = (p, a, b) => {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  };
  for (let i = 0; i <= 1000; i++) {
    const t = i / 1000,
      u = 1 - t,
      p = { x: 6 * u * t * t + 2 * t ** 3, y: 6 * u * u * t + 6 * u * t * t };
    assert.ok(
      Math.min(...points.slice(1).map((b, j) => distance(p, points[j], b))) <= 0.005 + 1e-12,
    );
  }
});
test('collinear overshoot and closed cusp are not silently flat', () => {
  const overshoot = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 1, y: 0 },
  ];
  assert.ok(flatten(overshoot, { tolerance: 0.01 }).length > 2);
  assert.ok(
    flatten(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 0 },
      ],
      { tolerance: 0.01 },
    ).length > 2,
  );
});
test('nonconvergence and exact segment budgets', () => {
  assert.throws(() => flatten(c, { tolerance: 1e-20, maxDepth: 0 }), /converge/);
  assert.throws(() => flatten(c, { tolerance: 0.001, maxSegments: 1 }), /maxSegments/);
  assert.equal(
    flatten(
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      { tolerance: 1, maxSegments: 1 },
    ).length,
    2,
  );
});
test('validation ownership and degenerate points', () => {
  assert.throws(() => evaluate(c, -1), RangeError);
  assert.throws(() => flatten(c, { tolerance: 0 }), RangeError);
  assert.throws(() => evaluate([{ x: Infinity, y: 0 }, ...c.slice(1)], 0), RangeError);
  const copy = structuredClone(c),
    [a] = split(c, 0);
  a[0].x = 100;
  assert.deepEqual(c, copy);
  assert.equal(
    flatten(
      [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ],
      { tolerance: 1e-10 },
    ).length,
    2,
  );
});
test('seeded independent quadratic and cubic Bernstein oracle', () => {
  let seed = 412;
  const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
  for (let i = 0; i < 100; i++) {
    const points = Array.from({ length: i % 2 ? 3 : 4 }, () => ({
        x: random() * 100,
        y: random() * 100,
      })),
      t = random(),
      u = 1 - t;
    const weights =
      points.length === 3
        ? [u * u, 2 * u * t, t * t]
        : [u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3];
    const expected = points.reduce(
      (p, q, j) => ({ x: p.x + q.x * weights[j], y: p.y + q.y * weights[j] }),
      { x: 0, y: 0 },
    );
    const actual = evaluate(points, t);
    near(actual.x, expected.x);
    near(actual.y, expected.y);
  }
});
