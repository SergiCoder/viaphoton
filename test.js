import { solve, processInput } from './solve.js';

let failed = 0;
const EPS = 1e-6;

function eq(actual, expected, label) {
  const ok = Math.abs(actual - expected) < EPS;
  if (!ok) {
    console.error(`FAIL  ${label}: got ${actual}, expected ${expected}`);
    failed++;
  } else {
    console.log(`pass  ${label}: ${actual}`);
  }
}

function gt(actual, lower, label) {
  const ok = actual > lower;
  if (!ok) {
    console.error(`FAIL  ${label}: got ${actual}, expected > ${lower}`);
    failed++;
  } else {
    console.log(`pass  ${label}: ${actual} > ${lower}`);
  }
}

// --- Degenerate-input guards ---
eq(solve(0, 100, 1, 10), 100, 'D=0 returns N untouched');
eq(solve(10,   0, 1, 10),   0, 'N=0 returns 0');
eq(solve(10, 100, 1,  0),   0, 'C=0 (cart cannot carry) returns 0');
eq(solve(10, 100, 0, 10), 100, 'F=0 (no fuel cost) returns N');

// --- Single-trip regime ---
eq(solve(5, 10, 1, 10), 5, 'single trip, half fuel');
eq(solve(10, 10, 1, 10), 0, 'single trip, all fuel');
eq(solve(100, 5, 1, 10), 0, 'one load cannot reach (5kg, 100km)');

// --- Multi-trip shuttle: the canonical "trap" case ---
// (D=10, N=100, F=1, C=10): naive subtraction gives 0 (10 km * 1 kg/km = 10 = C).
// Correct answer via depot recursion ≈ 13.9977 (derivation in the plan).
// Recompute the closed form here as an independent cross-check rather than
// hard-coding a single literal — protects against fragile FP equality.
{
  const positionToTwoLoads = 10 * (1/19 + 1/17 + 1/15 + 1/13 + 1/11 + 1/9 + 1/7 + 1/5);
  const expected = 20 - 3 * (10 - positionToTwoLoads);
  const got = solve(10, 100, 1, 10);
  const ok = Math.abs(got - expected) < 1e-9 && got > 13 && got < 15;
  if (!ok) { console.error(`FAIL  jeep canonical: got ${got}, expected ${expected}`); failed++; }
  else     { console.log (`pass  jeep canonical (NOT 0): ${got} ≈ ${expected.toFixed(6)}`); }
}

// --- Hint condition: X > 0 even when D*F > C ---
gt(solve(20, 200, 1, 10), 0, 'hint case: D*F=20 > C=10, still X > 0');

// --- processInput multi-line ---
const out = processInput('10,100,1,10\n5,10,1,10\n0,100,1,10\n');
const lines = out.split('\n');
console.log('\nprocessInput output:');
console.log(out);
console.log('');
eq(lines.length, 3, 'processInput emits one line per input line');

// --- Scaling identity: solve(D, αN, αF, αC) = α · solve(D, N, F, C) ---
// (Doubling N alone doesn't scale X — segments depend on (mass-(k-1)C)/((2k-1)F),
// so F must scale with mass-quantities to preserve the per-step distance.)
{
  const a = solve(10, 100, 1, 10);
  const b = solve(10, 200, 2, 20);
  eq(b, 2 * a, 'mass-scaling identity: solve(D, 2N, 2F, 2C) = 2·X');
}

if (failed > 0) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
