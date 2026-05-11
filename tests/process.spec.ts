import { describe, expect, it } from 'vitest';
import { formatResults, processInput } from '@/lib/process';

describe('processInput', () => {
  it('returns one result per non-empty line', () => {
    const results = processInput('10,100,1,10\n5,10,1,10');
    expect(results).toHaveLength(2);
  });

  it('drops empty lines and trims', () => {
    const results = processInput('\n  10,100,1,10  \n\n  \n5,10,1,10\n');
    expect(results).toHaveLength(2);
  });

  it('handles CRLF line endings', () => {
    const results = processInput('10,100,1,10\r\n5,10,1,10\r\n');
    expect(results).toHaveLength(2);
  });

  it('returns ok=true with X for valid lines', () => {
    const [r] = processInput('5,10,1,10');
    expect(r?.ok).toBe(true);
    if (r?.ok) {
      expect(r.X).toBe(5);
      expect(r.input).toBe('5,10,1,10');
    }
  });

  it('returns ok=false with error for invalid lines', () => {
    const [r] = processInput('10,abc,1,10');
    expect(r?.ok).toBe(false);
    if (r && !r.ok) {
      expect(r.error).toBeDefined();
      expect(r.input).toBe('10,abc,1,10');
    }
  });

  it('mixes valid and invalid lines independently', () => {
    const results = processInput('10,100,1,10\n1,2,3\n5,10,1,10');
    expect(results[0]?.ok).toBe(true);
    expect(results[1]?.ok).toBe(false);
    expect(results[2]?.ok).toBe(true);
  });

  it('returns [] for empty input', () => {
    expect(processInput('')).toEqual([]);
    expect(processInput('\n\n  \n')).toEqual([]);
  });
});

describe('formatResults', () => {
  it('renders ok lines as "<input> -> X = <value>"', () => {
    const out = formatResults([{ ok: true, input: '5,10,1,10', X: 5 }]);
    expect(out).toBe('5,10,1,10 -> X = 5');
  });

  it('renders error lines as "<input> -> error: <msg>"', () => {
    const out = formatResults([{ ok: false, input: '1,2,3', error: 'oops' }]);
    expect(out).toBe('1,2,3 -> error: oops');
  });

  it('joins multiple results with newlines', () => {
    const out = formatResults([
      { ok: true, input: '5,10,1,10', X: 5 },
      { ok: false, input: 'bad', error: 'oops' },
    ]);
    expect(out).toBe('5,10,1,10 -> X = 5\nbad -> error: oops');
  });

  it('returns empty string for no results', () => {
    expect(formatResults([])).toBe('');
  });
});
