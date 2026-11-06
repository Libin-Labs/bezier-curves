import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from '../dist/esm/index.js';
const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/index.js');
test('CommonJS and ESM runtime behavior and export parity', () => {
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
  const sample = ({ flatten }) =>
    flatten(
      [
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 0 },
      ],
      { tolerance: 0.1 },
    );
  assert.deepEqual(sample(esm), sample(cjs));
});
