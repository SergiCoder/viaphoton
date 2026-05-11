#!/usr/bin/env tsx
import { formatResults, processInput } from '../lib/process';

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => {
  buf += chunk;
});
process.stdin.on('end', () => {
  const out = formatResults(processInput(buf));
  if (out.length > 0) process.stdout.write(`${out}\n`);
});
