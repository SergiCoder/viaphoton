import { describe, expect, it } from 'vitest';
import { solve } from '@/lib/solve';

describe('solve — degenerate-input guards', () => {
  it('D = 0 returns N untouched (no travel needed)', () => {
    expect(solve(0, 100, 1, 10)).toBe(100);
  });

  it('N = 0 returns 0 (nothing to move)', () => {
    expect(solve(10, 0, 1, 10)).toBe(0);
  });

  it('C = 0 returns 0 (cart cannot carry)', () => {
    expect(solve(10, 100, 1, 0)).toBe(0);
  });

  it('F = 0 returns N (no fuel cost, all arrives)', () => {
    expect(solve(10, 100, 0, 10)).toBe(100);
  });
});

describe('solve — single-trip regime (mass ≤ C)', () => {
  it('half fuel: D=5, N=10, F=1, C=10 → 5', () => {
    expect(solve(5, 10, 1, 10)).toBe(5);
  });

  it('all fuel: D=10, N=10, F=1, C=10 → 0', () => {
    expect(solve(10, 10, 1, 10)).toBe(0);
  });

  it('one load cannot reach far town: D=100, N=5, F=1, C=10 → 0', () => {
    expect(solve(100, 5, 1, 10)).toBe(0);
  });
});

describe('solve — multi-load shuttle (the AI trap)', () => {
  it('canonical jeep case: solve(10, 100, 1, 10) ≈ 13.998 (NOT 0)', () => {
    // Closed-form cross-check: position to reach 2 loads + final leg
    const positionAtTwoLoads =
      10 * (1 / 19 + 1 / 17 + 1 / 15 + 1 / 13 + 1 / 11 + 1 / 9 + 1 / 7 + 1 / 5);
    const expected = 20 - 3 * (10 - positionAtTwoLoads);

    const x = solve(10, 100, 1, 10);
    expect(x).toBeCloseTo(expected, 9);
    expect(x).toBeGreaterThan(13);
    expect(x).toBeLessThan(15);
  });

  it('hint case: solve(20, 200, 1, 10) > 0 even though D·F > C', () => {
    const x = solve(20, 200, 1, 10);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(10);
  });

  it('impossible at scale: solve(100, 1000, 1, 10) → 0 (harmonic sum diverges too slowly)', () => {
    expect(solve(100, 1000, 1, 10)).toBe(0);
  });
});

describe('solve — invariants', () => {
  it('mass-scaling identity: solve(D, αN, αF, αC) = α · solve(D, N, F, C)', () => {
    const base = solve(10, 100, 1, 10);
    const scaled = solve(10, 300, 3, 30);
    expect(scaled).toBeCloseTo(3 * base, 9);
  });

  it('monotonic in N: more nuts cannot decrease delivered amount', () => {
    const xs = [50, 100, 200, 500, 1000].map((n) => solve(10, n, 1, 10));
    for (let i = 1; i < xs.length; i++) {
      const prev = xs[i - 1] ?? Number.NaN;
      const curr = xs[i] ?? Number.NaN;
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('mid-segment overshoot branch: tiny D mid-shuttle hits segment >= remain', () => {
    // With N = 100, C = 10, F = 1 the first segment is 10/19 ≈ 0.526.
    // A D smaller than that forces the overshoot branch to fire on iteration 1.
    const x = solve(0.3, 100, 1, 10);
    // mass=100, k=10, rate=19; X = 100 - 19 * 0.3 = 94.3
    expect(x).toBeCloseTo(94.3, 9);
  });

  it('reaches all the way through the loop down to single-trip regime', () => {
    // N = 25, C = 10: starts with 3 loads, advances through 2 then drops to single-trip.
    // Verifies the `mass <= C` branch is taken AFTER the loop has shrunk mass.
    const x = solve(0.05, 25, 1, 10);
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(25);
  });
});
