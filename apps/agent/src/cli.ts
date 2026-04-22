#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { startAgent } from './agent';

const allArgs = process.argv.slice(2);
const background =
  allArgs.includes('--background') ||
  allArgs.includes('-b') ||
  process.env.DEVORBIT_AGENT_BACKGROUND === '1';

const args = allArgs.filter((a) => a !== '--background' && a !== '-b');

if (args[0] !== 'start') {
  console.log('DevOrbit Agent v0.1.1');
  console.log('Usage: npx devorbit-agent start --token=<TOKEN> --api=<URL> [--background|-b]');
  console.log('  --background  Detach from terminal (recommended on servers).');
  process.exit(0);
}

function parseArgValue(prefix: string, argv: string[]): string | undefined {
  const raw = argv.find((a) => a.startsWith(prefix));
  if (!raw || !raw.includes('=')) return undefined;
  return raw.slice(raw.indexOf('=') + 1);
}

const token = parseArgValue('--token=', args);
const apiUrl = parseArgValue('--api=', args) || 'http://localhost:4000';

if (!token) {
  console.error('Error: --token=<AGENT_TOKEN> is required');
  console.error('Usage: npx devorbit-agent start --token=dev_xxxx --api=https://your-devorbit.com [--background]');
  process.exit(1);
}

if (background) {
  const script = path.join(__dirname, 'cli.js');
  const child = spawn(process.execPath, [script, ...args], {
    detached: true,
    stdio: 'ignore',
    cwd: process.cwd(),
    env: process.env,
  });
  child.unref();
  console.log('DevOrbit Agent v0.1.1');
  console.log(`Starting in background (pid ${child.pid}) → ${apiUrl}`);
  console.log(`Stop with: kill ${child.pid}`);
  process.exit(0);
}

console.log('DevOrbit Agent v0.1.1');
console.log(`Connecting to ${apiUrl}...`);

startAgent({ token, apiUrl });
