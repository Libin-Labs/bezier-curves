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
function validate(c: Curve): void {
  if (c.length !== 3 && c.length !== 4) throw new RangeError('Expected quadratic or cubic');
  for (const p of c)
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      Math.abs(p.x) > 1e100 ||
      Math.abs(p.y) > 1e100
    )
      throw new RangeError('Coordinates must be finite and <= 1e100');
}
function parameter(t: number): void {
  if (!Number.isFinite(t) || t < 0 || t > 1) throw new RangeError('t outside [0,1]');
}
function mix(a: Point, b: Point, t: number): Point {
  return { x: (1 - t) * a.x + t * b.x, y: (1 - t) * a.y + t * b.y };
}
export function evaluate(c: Curve, t: number): Point {
  validate(c);
  parameter(t);
  let row: Point[] = c.map((p) => ({ ...p }));
  while (row.length > 1) row = row.slice(1).map((p, i) => mix(row[i]!, p, t));
  return row[0]!;
}
export function split(c: Curve, t: number): readonly [Curve, Curve] {
  validate(c);
  parameter(t);
  let row: Point[] = c.map((p) => ({ ...p }));
  const left = [row[0]!],
    right = [row.at(-1)!];
  while (row.length > 1) {
    row = row.slice(1).map((p, i) => mix(row[i]!, p, t));
    left.push(row[0]!);
    right.unshift(row.at(-1)!);
  }
  return [left as unknown as Curve, right as unknown as Curve];
}
export function derivative(c: Curve, t: number): Point {
  validate(c);
  parameter(t);
  const n = c.length - 1,
    d = c.slice(1).map((p, i) => ({ x: n * (p.x - c[i]!.x), y: n * (p.y - c[i]!.y) }));
  while (d.length > 1) {
    for (let i = 0; i < d.length - 1; i++) d[i] = mix(d[i]!, d[i + 1]!, t);
    d.pop();
  }
  return d[0]!;
}
function segmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const u = dx / length,
    v = dy / length,
    projection = Math.max(0, Math.min(length, (p.x - a.x) * u + (p.y - a.y) * v));
  return Math.hypot(p.x - a.x - u * projection, p.y - a.y - v * projection);
}
/** Control-polygon distance to each chord bounds curve-to-polyline error. Throws rather than silently accepting a depth/segment limit. */
export function flatten(c: Curve, options: FlattenOptions): Point[] {
  validate(c);
  const { tolerance, maxDepth = 20, maxSegments = 65536 } = options;
  if (
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 24 ||
    !Number.isInteger(maxSegments) ||
    maxSegments < 1 ||
    maxSegments > 1_000_000
  )
    throw new RangeError('Invalid flatten bounds');
  const output: Point[] = [{ ...c[0] }],
    stack: { c: Curve; depth: number }[] = [{ c, depth: 0 }];
  while (stack.length) {
    const item = stack.pop()!,
      end = item.c.at(-1)!;
    const flat = item.c.slice(1, -1).every((p) => segmentDistance(p, item.c[0], end) <= tolerance);
    if (flat) {
      if (output.length > maxSegments) throw new RangeError('maxSegments exceeded');
      output.push({ ...end });
    } else {
      if (item.depth === maxDepth) throw new RangeError('Flatten did not converge within maxDepth');
      const [left, right] = split(item.c, 0.5);
      stack.push({ c: right, depth: item.depth + 1 }, { c: left, depth: item.depth + 1 });
      if (stack.length + output.length - 1 > maxSegments)
        throw new RangeError('maxSegments exceeded');
    }
  }
  return output;
}
