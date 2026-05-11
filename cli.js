#!/usr/bin/env node
import { processInput } from './solve.js';

let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { buf += chunk; });
process.stdin.on('end', () => {
  const out = processInput(buf);
  if (out) process.stdout.write(out + '\n');
});
