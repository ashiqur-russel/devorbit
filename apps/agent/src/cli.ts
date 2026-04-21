#!/usr/bin/env node
import { startAgent } from './agent';

const args = process.argv.slice(2);

if (args[0] !== 'start') {
  console.log('DevOrbit Agent v0.1.0');
  console.log('Usage: npx devorbit-agent start --token=<TOKEN> --api=<URL>');
  process.exit(0);
}

const tokenArg = args.find((a) => a.startsWith('--token='));
const apiArg = args.find((a) => a.startsWith('--api='));

const token = tokenArg?.split('=')[1];
const apiUrl = apiArg?.split('=')[1] || 'http://localhost:4000';

if (!token) {
  console.error('Error: --token=<AGENT_TOKEN> is required');
  console.error('Usage: npx devorbit-agent start --token=dev_xxxx --api=https://your-devorbit.com');
  process.exit(1);
}

console.log('DevOrbit Agent v0.1.0');
console.log(`Connecting to ${apiUrl}...`);

startAgent({ token, apiUrl });
