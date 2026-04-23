'use strict';

/**
 * Spawn the TypeScript compiler without relying on node_modules/.bin shims.
 * Resolves `typescript` from this package or hoisted workspace parents (pnpm-safe).
 */
const { spawnSync } = require('child_process');
const path = require('path');

let tscPath;
try {
  tscPath = require.resolve('typescript/lib/tsc.js');
} catch {
  console.error(
    'Could not resolve "typescript". From the repo root run:\n  pnpm install\n',
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const res = spawnSync(process.execPath, [tscPath, ...args], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env,
});

if (res.error) {
  console.error(res.error);
  process.exit(1);
}
process.exit(typeof res.status === 'number' ? res.status : 1);
