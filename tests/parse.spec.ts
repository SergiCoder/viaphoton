import { describe, expect, it } from 'vitest';
import { parseLine } from '@/lib/parse';

describe('parseLine — happy paths', () => {
  it('accepts canonical "10,100,1,10"', () => {
    const r = parseLine('10,100,1,10');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ D: 10, N: 100, F: 1, C: 10 });
      expect(r.input).toBe('10,100,1,10');
    }
  });

  it('tolerates whitespace around values and around the line', () => {
    const r = parseLine('  10 , 100 , 1 , 10  ');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ D: 10, N: 100, F: 1, C: 10 });
    }
  });

  it('accepts zero values (degenerate but valid)', () => {
    const r = parseLine('0,0,0,0');
    expect(r.ok).toBe(true);
  });
});

describe('parseLine — rejections', () => {
  it('rejects empty string', () => {
    const r = parseLine('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/empty/);
  });

  it('rejects whitespace-only string', () => {
    const r = parseLine('   ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/empty/);
  });

  it('rejects fewer than 4 fields', () => {
    const r = parseLine('1,2,3');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/expected 4/);
  });

  it('rejects more than 4 fields', () => {
    const r = parseLine('1,2,3,4,5');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/expected 4/);
  });

  it('rejects non-numeric field', () => {
    const r = parseLine('10,abc,1,10');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not numeric/);
  });

  it('rejects float (spec says integers)', () => {
    const r = parseLine('10.5,100,1,10');
    expect(r.ok).toBe(false);
  });

  it('rejects negative value (Zod nonnegative)', () => {
    const r = parseLine('-1,100,1,10');
    expect(r.ok).toBe(false);
  });

  it('Zod failure error message contains the field path and Zod message', () => {
    // -1 triggers the nonnegative constraint on field D, going through the
    // `${issue.path.join('.')}: ${issue.message}` formatting in parseLine.
    const r = parseLine('-1,100,1,10');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toMatch(/D:/);
    }
  });
});
